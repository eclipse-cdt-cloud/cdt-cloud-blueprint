/* eslint-disable @typescript-eslint/tslint/config */
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

import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { TaskCustomization } from '@theia/task/lib/common/task-protocol';

export const ExampleGeneratorService = Symbol('ExampleGeneratorService');
export const EXAMPLE_GENERATOR_PATH = '/services/example-generator';

export interface ExampleOptions {
    /** The full path of the selected target folder. */
    targetFolder: string;
    /** The name of the target folder. */
    targetFolderName: string;
}

export interface Example {
    id: string;
    label: string;
    resourcesPath: string;
    welcomeFile?: string;
    tasks?: (options: ExampleOptions) => TaskCustomization[];
    launches?: (options: ExampleOptions) => DebugConfiguration[];
}

/**
 * Service for generating examples.
 */
export interface ExampleGeneratorService {
    /**
     * Returns all examples available for generation.
     */
    getExamples(): Promise<Example[]>;
    /**
     * Generates the specified `example` into the specified folder `targetPath`.
     * @param example the example to generate.
     * @param targetPath URI of the folder into which the example shall be generated.
     * @param targetFolderName The user-specified name of the target folder.
     */
    generateExample(example: Example, targetPath: string, targetFolderName: string): Promise<void>
}

export const ExamplesContribution = Symbol('ExamplesContribution');
export interface ExamplesContribution {
    readonly examples: Example[];
}
