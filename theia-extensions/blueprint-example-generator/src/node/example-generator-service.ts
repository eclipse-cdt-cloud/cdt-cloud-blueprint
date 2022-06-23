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

import { Path } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import * as fs from 'fs-extra';
import { ExampleGeneratorService, Examples } from '../common/protocol';

const EXAMPLE_DIRECTORY = 'resources';

// TODO use fsPath once we upgrade Theia
// https://github.com/eclipse-theia/theia/wiki/Coding-Guidelines#backend-fs-path
@injectable()
export class ExampleGeneratorServiceImpl implements ExampleGeneratorService {

    async generateExample(exampleId: string, targetFolderUri: string): Promise<string | undefined> {
        const examplesPath = new Path(module.path).resolve(`../../${EXAMPLE_DIRECTORY}`);
        if (!examplesPath || !fs.existsSync(examplesPath.toString())) {
            throw new Error('Could not find examples folder');
        }

        const examplePath = examplesPath.resolve(`${exampleId}`);
        if (!examplePath || !fs.existsSync(examplePath.toString())) {
            throw new Error(`Could not find files in ${examplesPath}${examplePath}`);
        }

        const target = new URI(targetFolderUri);
        fs.copySync(examplePath.toString(), target.path.toString(), { recursive: true, errorOnExist: true });

        const fileToBeOpened = this.getFileToBeOpened(exampleId);
        return fileToBeOpened ? target.path.resolve(fileToBeOpened)?.toString() : undefined;
    }

    protected getFileToBeOpened(exampleId: string): string | undefined {
        if (exampleId === Examples.CMAKE_WITH_LIBRARY) {
            return 'README.md';
        }
        if (exampleId === Examples.CLANGD_CONTEXTS) {
            return 'README.md';
        }
        return undefined;
    }

}
