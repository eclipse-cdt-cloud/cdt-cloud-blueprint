/********************************************************************************
 * Copyright (C) 2022 STMicroelectronics and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs-extra';
import { ExampleGeneratorService, Examples } from '../common/protocol';

const EXAMPLE_DIRECTORY = 'resources';

@injectable()
export class ExampleGeneratorServiceImpl implements ExampleGeneratorService {

    async generateExample(exampleId: string, targetFolderUri: string): Promise<string | undefined> {
        const examplesUri = new URI(module.path).resolve(`../../${EXAMPLE_DIRECTORY}`).normalizePath();
        const examplesPath = FileUri.fsPath(examplesUri);
        if (!examplesPath || !fs.existsSync(examplesPath)) {
            throw new Error('Could not find examples folder');
        }

        const exampleUri = examplesUri.resolve(exampleId);
        const examplePath = FileUri.fsPath(exampleUri);
        if (!examplePath || !fs.existsSync(examplePath)) {
            throw new Error(`Could not find files in ${examplePath}`);
        }

        const targetUri = new URI(targetFolderUri);
        const targetPath = FileUri.fsPath(targetUri);
        fs.copySync(examplePath, targetPath, { recursive: true, errorOnExist: true });

        const fileToBeOpened = this.getFileToBeOpened(exampleId);
        if (fileToBeOpened) {
            return FileUri.fsPath(targetUri.resolve(fileToBeOpened));
        }

        return undefined;
    }

    protected getFileToBeOpened(exampleId: string): string | undefined {
        if (exampleId === Examples.CMAKE_EXAMPLE) {
            return 'CMAKE_EXAMPLE_README.md';
        }
        if (exampleId === Examples.CLANGD_CONTEXTS) {
            return 'CLANGD_CONTEXTS_README.md';
        }
        if (exampleId === Examples.EXAMPLE_TRACES) {
            return 'EXAMPLE_TRACES_README.md';
        }
        return undefined;
    }

}
