/********************************************************************************
 * Copyright (C) 2025 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import path from 'path';
import fs from 'fs';
import child_process from 'child_process';

const signCommand = path.join(__dirname, 'sign.sh');
const notarizeCommand = path.join(__dirname, 'notarize.sh');
const entitlements = path.resolve(__dirname, '..', 'entitlements.plist');

// File extensions and patterns that need code signing on macOS
const BINARY_EXTENSIONS = ['.dylib', '.so', '.node', '.framework'];
const BINARY_FILENAMES = ['node.napi.node', 'spawn-helper', 'chrome_crashpad_handler']; // Specific binary filenames that need signing
const BINARY_PATTERNS = [
    /^MacOS\//, // Executable files in MacOS directory
    /^Contents\/MacOS\//, // Executable files in Contents/MacOS directory
];
const EXECUTABLE_NAMES = [
    'node', 'electron', 'rg', 'macos-trash', 'chrome-sandbox'
];

// Function to check if a file is likely a binary that needs signing
function isBinaryFile(filePath: string): boolean {
    const extension = path.extname(filePath);
    const fileName = path.basename(filePath);
    const relativePath = filePath.replace(/^.*?\.app\//, ''); // Get path relative to .app bundle

    // Check by extension - .node files always need signing
    if (BINARY_EXTENSIONS.includes(extension)) {
        return true;
    }

    // Check by executable name
    if (EXECUTABLE_NAMES.includes(fileName)) {
        return true;
    }

    // Check by specific binary filenames
    if (BINARY_FILENAMES.includes(fileName)) {
        return true;
    }

    // Special check for .node files with complex names
    if (fileName.endsWith('.node')) {
        return true;
    }

    // Check by pattern
    for (const pattern of BINARY_PATTERNS) {
        if (pattern.test(relativePath)) {
            return true;
        }
    }

    // Check if file is executable (Unix-only check)
    try {
        const stat = fs.statSync(filePath);
        if ((stat.mode & 0o111) !== 0) { // Check if execute bit is set
            // Further verify it's a binary with 'file' command if available
            try {
                const fileType = child_process.execSync(`file "${filePath}"`).toString();
                return fileType.includes('Mach-O') ||
                       fileType.includes('executable') ||
                       fileType.includes('shared library') ||
                       fileType.includes('dynamically linked') ||
                       fileType.includes('universal binary'); // Handle universal binaries
            } catch (e) {
                // If 'file' command fails, fall back to assuming it's a binary if it has execute permission
                return true;
            }
        }
    } catch (e) {
        // If stat fails, skip this check
    }

    return false;
}

// Function to recursively find binaries in a directory
function findBinariesToSign(dirPath: string): string[] {
    const result: string[] = [];

    function scanDirectory(currentPath: string): void {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                // Skip .git directories but allow node_modules within plugins
                if (entry.name === '.git') {
                    continue;
                }
                // Skip node_modules directories unless they're within plugins
                if (entry.name === 'node_modules') {
                    // Check if we're in a plugins directory by looking at the full path
                    const isInPlugins = currentPath.includes('/plugins/') ||
                                      currentPath.includes('\\plugins\\') ||
                                      currentPath.includes('app/plugins') ||
                                      currentPath.includes('Resources/app/plugins');
                    if (!isInPlugins) {
                        console.log(`Skipping node_modules directory: ${fullPath} (not in plugins)`);
                        continue;
                    } else {
                        console.log(`Allowing node_modules directory: ${fullPath} (in plugins)`);
                    }
                }
                scanDirectory(fullPath);
            } else if (entry.isFile()) {
                const isBinary = isBinaryFile(fullPath);
                if (isBinary) {
                    console.log(`Found binary file: ${fullPath}`);
                    result.push(fullPath);
                } else if (entry.name.includes('.node')) {
                    console.log(`Found .node file but not marked as binary: ${fullPath}`);
                }
            }
        }
    }

    scanDirectory(dirPath);

    // Sort by path depth (deepest first) to ensure nested binaries are signed first
    return result.sort((a, b) => {
        const aDepth = a.split(path.sep).length;
        const bDepth = b.split(path.sep).length;
        return bDepth - aDepth;
    });
}

const signFile = (file: string) => {
    const stat = fs.lstatSync(file);
    const mode = stat.isFile() ? stat.mode : undefined;

    // Get SHA hash of file before signing - only for actual files, not directories
    let shaBeforeSigning: string | undefined;
    if (stat.isFile()) {
        shaBeforeSigning = child_process.execSync(`shasum -a 256 "${file}"`).toString().trim();
    }

    console.log(`Signing ${file}...`);
    child_process.spawnSync(signCommand, [
        path.basename(file),
        entitlements
    ], {
        cwd: path.dirname(file),
        maxBuffer: 1024 * 10000,
        env: process.env,
        stdio: 'inherit',
        encoding: 'utf-8'
    });

    // Get SHA hash of file after signing - only for actual files, not directories
    if (stat.isFile()) {
        const shaAfterSigning = child_process.execSync(`shasum -a 256 "${file}"`).toString().trim();
        // Log a warning if the SHA hash hasn't changed after signing
        if (shaBeforeSigning === shaAfterSigning) {
            console.warn(`WARNING: SHA hash did not change after signing for ${file}. This might indicate the file was not properly signed.`);
        }
    }

    if (mode) {
        console.log(`Setting attributes of ${file}...`);
        fs.chmodSync(file, mode);
    }
};

const argv = yargs(hideBin(process.argv))
    .option('directory', { alias: 'd', type: 'string', default: 'dist', description: 'The directory which contains the application to be signed' })
    .version(false)
    .wrap(120)
    .parseSync();

execute();

async function execute(): Promise<void> {
    console.log(`signCommand: ${signCommand}; notarizeCommand: ${notarizeCommand}; entitlements: ${entitlements}; directory: ${argv.directory}`);

    // First sign all individual binaries inside the app bundle
    const binariesToSign = findBinariesToSign(argv.directory);
    console.log(`Found ${binariesToSign.length} binaries to sign:`);
    binariesToSign.forEach(binary => console.log(`  - ${binary}`));

    for (const binaryPath of binariesToSign) {
        signFile(binaryPath);
    }

    // Then sign the main app bundle
    console.log('Signing main application bundle...');
    signFile(argv.directory);

    // Notarize app
    console.log('Notarizing application...');
    child_process.spawnSync(notarizeCommand, [
        path.basename(argv.directory),
        'cdtcloud.blueprint'
    ], {
        cwd: path.dirname(argv.directory),
        maxBuffer: 1024 * 10000,
        env: process.env,
        stdio: 'inherit',
        encoding: 'utf-8'
    });
}
