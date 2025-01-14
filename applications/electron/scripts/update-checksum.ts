/********************************************************************************
 * Copyright (C) 2021 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import * as path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

const argv = yargs(hideBin(process.argv))
    .option('executable', { alias: 'e', type: 'string', default: 'TheiaIDE.AppImage', description: 'The executable for which the checksum needs to be updated' })
    .option('yaml', { alias: 'y', type: 'string', default: 'latest-linux.yml', description: 'The yaml file where the checksum needs to be updated' })
    .option('platform', { alias: 'p', type: 'string', default: 'linux', description: 'The OS platform' })
    .option('updatepaths', { alias: 'u', type: 'boolean', default: true, description: 'Whether to update the paths from absolute to relative' })
    .option('fileextension', { alias: 'f', type: 'string', default: '.AppImage', description: 'Only paths/urls with this extension will be updated' })
    .version(false)
    .wrap(120)
    .parseSync();

execute();

async function execute(): Promise<void> {
    const executable = argv.executable;
    const yaml = argv.yaml;
    const platform = argv.platform;
    const updatePaths = argv.updatepaths;
    const fileExtension = argv.fileextension;

    const executablePath = path.resolve(
        __dirname,
        '../dist/',
        executable
    );

    const yamlPath = path.resolve(
        __dirname,
        '../dist/',
        yaml
    );

    console.log(`Exe: ${executablePath}; Yaml: ${yamlPath}; Platform: ${platform}; Update Paths: ${updatePaths}; File Extension: ${fileExtension}`);

    const hash = await hashFile(executablePath, 'sha512', 'base64', {});
    const size = fs.statSync(executablePath).size;

    const yamlContents: string = fs.readFileSync(yamlPath, { encoding: 'utf8' });
    console.log(`Initial Yaml Contents: ${yamlContents}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestYaml: any = jsyaml.safeLoad(yamlContents);

    if (latestYaml.path.endsWith(fileExtension)) {
        latestYaml.sha512 = hash;
        if (updatePaths) {
            latestYaml.path = updatedPath(latestYaml.path, latestYaml.version, platform);
        }
    }

    for (const file of latestYaml.files) {
        if (file.url.endsWith(fileExtension)) {
            file.sha512 = hash;
            file.size = size;
            if (updatePaths) {
                file.url = updatedPath(file.url, latestYaml.version, platform);
            }
        }
    }

    // line width -1 to avoid adding >- on long strings like a hash
    const newYamlContents = jsyaml.dump(latestYaml, { lineWidth: -1 });
    console.log(`New Yaml Contents: ${newYamlContents}`);
    fs.writeFileSync(yamlPath, newYamlContents);
}

function hashFile(file: fs.PathLike, algorithm = 'sha512', encoding: BufferEncoding = 'base64', options: string | {
    flags?: string;
    encoding?: BufferEncoding;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    emitClose?: boolean;
    start?: number;
    end?: number;
    highWaterMark?: number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<any> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        hash.on('error', reject).setEncoding(encoding);
        fs.createReadStream(
            file,
            Object.assign({}, options, {
                highWaterMark: 1024 * 1024,
            })
        )
            .on('error', reject)
            .on('end', () => {
                hash.end();
                resolve(hash.read());
            })
            .pipe(
                hash,
                {
                    end: false,
                }
            );
    });
}

function updatedPath(toUpdate: string, version: string, platform: string): string {
    const extensionIndex = toUpdate.lastIndexOf('.');
    return '../../' + version + '/' + platform + '/' + toUpdate.substring(0, extensionIndex) + '-' + version + toUpdate.substring(extensionIndex);
}
