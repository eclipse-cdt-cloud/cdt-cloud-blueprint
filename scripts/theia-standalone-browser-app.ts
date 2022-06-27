import { exec, spawn } from "child_process";
import * as fs from "fs-extra";
import { glob } from "glob";
import * as path from "path";
import { promisify } from "util";
import yargs from "yargs/yargs";
const waitPort = require("wait-port");

const execSync = promisify(exec);

interface Disposable {
    dispose(): void;
}

// TODO create command line options for config below
const args = yargs(process.argv)
    .help()
    .parse();

execute();

async function execute(): Promise<void> {
    const disposables: Disposable[] = [];

    // CONFIG
    // mandatory
    const verdaccioConfig = 'configs/verdaccio.config.yaml';
    const includeExtensionPaths = ['theia-extensions/*'];
    const browserApp = 'applications/browser';
    const target = '../target';
    // optional
    const ignoreExtensionPaths: string[] = [];
    const port = 4873;
    const verdaccioStorage = 'verdaccio-storage';
    // /CONFIG

    try {
        disposables.push(await createNpmrcFile(port));
        disposables.push(await startVerdaccio(verdaccioConfig, port, verdaccioStorage));

        await publishAllExtensions(port, includeExtensionPaths, ignoreExtensionPaths);
        await copyBrowserApp(browserApp, target);
        await buildBrowserApp(target, port);
    } finally {
        disposables.forEach(disposable => disposable.dispose());
    }
}

async function createNpmrcFile(port: number): Promise<Disposable> {
    console.log('📝 Generating npmrc file for anonymous publishing.');
    fs.removeSync('.npmrc');
    fs.writeFileSync('.npmrc', `//localhost:${port}/:_authToken="fooBar"\n\n`);
    return { dispose: () => fs.removeSync('.npmrc') }
}

async function startVerdaccio(config: string, port: number, storage: string): Promise<Disposable> {
    const verdaccioWorkingDir = path.resolve(storage);
    const configCmd = config ? `--config ${config}` : '';
    const portCmd = port ? `--listen ${port}` : '';
    const args = `${configCmd} ${portCmd}`.split(' ');

    console.log('🚀 Starting verdaccio...');
    const verdaccioHandle = spawn(
        'verdaccio',
        args,
        {
            env: {
                ...process.env,
                VERDACCIO_STORAGE_PATH: verdaccioWorkingDir
            }
        }
    );
    await waitPort({ port });
    return {
        dispose: () => {
            verdaccioHandle.kill();
            fs.removeSync(verdaccioWorkingDir);
        }
    };
}

async function publishAllExtensions(verdaccioPort: number, includeExtensionPaths: string[], ignoreExtensionPaths?: string[]): Promise<void> {
    const paths: string[] = [];
    for (const includeExtensionPath of includeExtensionPaths) {
        const result = glob.sync(includeExtensionPath, { ignore: ignoreExtensionPaths, realpath: true });
        paths.push(...result);
    }
    const uniquePaths = [...new Set(paths)];
    for (const extensionPath of uniquePaths) {
        const version = require(extensionPath + '/package.json').version;
        console.log(`🪛  Publishing version ${version} of '${extensionPath}'...`);
        const publishProcess = await execSync(
            `yarn --cwd "${extensionPath}" publish --registry http://localhost:${verdaccioPort} --new-version "${version}"`
        );
        if (publishProcess.stderr) {
            console.error(publishProcess.stderr);
        }
    }
}
async function copyBrowserApp(browserApp: string, target: string): Promise<void> {
    console.log(`🚡 Copying app at '${browserApp}' to target at '${target}'...`);
    fs.removeSync(target);
    fs.copySync(browserApp, target, { recursive: true, overwrite: true });
    fs.copyFileSync('yarn.lock', target + '/yarn.lock');
}

async function buildBrowserApp(target: string, verdaccioPort: number): Promise<void> {
    console.log(`🏗️  Building app at '${target}'...`);
    const buildProcess = await execSync(
        `yarn --cwd ${target} install`,
        { env: { ...process.env, YARN_REGISTRY: `http://localhost:${verdaccioPort}` } }
    );
    if (buildProcess.stderr) {
        console.log(buildProcess.stdout);
        console.error(buildProcess.stderr);
    } else {
        console.log(`📦 Building app completed successfully at '${target}'.`);
        console.log(`You can now start the app with: node '${target}/node_modules/@theia/cli/bin/theia start'`)
    }
}
