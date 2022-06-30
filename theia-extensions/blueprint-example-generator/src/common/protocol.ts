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

export const ExampleGeneratorService = Symbol('ExampleGeneratorService');
export const EXAMPLE_GENERATOR_PATH = '/services/example-generator';

export enum Examples {
    CMAKE_EXAMPLE = 'cmake-example',
    EXAMPLE_TRACES = 'example-traces',
    CLANGD_CONTEXTS = 'clangd-contexts'
}

/**
 * Service for generating CDT.cloud blueprint examples.
 */
export interface ExampleGeneratorService {
    /**
     * Generates the example with the name `exampleId` into the specified folder `targetFolderName`.
     * @param exampleId identifyer of the example.
     * @param targetFolderUri URI of the folder into which the example shall be generated.
     * @returns (optional) URI of a file to be opened in an editor.
     */
    generateExample(exampleId: string, targetFolderUri: string): Promise<string | undefined>
}
