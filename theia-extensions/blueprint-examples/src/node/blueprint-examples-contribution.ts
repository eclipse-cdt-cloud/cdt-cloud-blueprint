/* eslint-disable @typescript-eslint/tslint/config */
/********************************************************************************
 * Copyright (C) 2023 STMicroelectronics and others.
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

import { Example, ExampleOptions, ExamplesContribution } from '@eclipse-cdt-cloud/blueprint-example-generator/lib/node';
import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { PanelKind, RevealKind } from '@theia/task/lib/common';
import { CdtCloudBlueprintExamples } from '../common/cdt-blueprint-examples';

@injectable()
export class CdtCloudBlueprintExamplesContribution implements ExamplesContribution {
    get examples(): Example[] {
        return [{
            id: CdtCloudBlueprintExamples.CMAKE_EXAMPLE,
            label: 'CMake example',
            welcomeFile: 'CMAKE_EXAMPLE_README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/cmake-example').normalizePath().toString(),
            launches: (options: ExampleOptions) => [{
                'type': 'gdb',
                'request': 'launch',
                'name': `Debug Example C++ (${options.targetFolderName})`,
                'program': `\${workspaceFolder}/${options.targetFolderName}/Example`,
                'initCommands': ['tbreak main'],
                'preLaunchTask': `Binary build (${options.targetFolderName})`
            }],
            tasks: (options: ExampleOptions) => [{
                'label': `Binary build (${options.targetFolderName})`,
                'type': 'shell',
                'command': 'cmake . && make',
                'group': {
                    'kind': 'build',
                    'isDefault': true
                },
                'options': {
                    'cwd': `\${workspaceFolder}/${options.targetFolderName}`
                },
                'problemMatcher': []
            },
            {
                'label': `Launch Example C++ (${options.targetFolderName})`,
                'type': 'shell',
                'command': './Example',
                'dependsOn': [ `Binary build (${options.targetFolderName})` ],
                'presentation': {
                    'echo': true,
                    'reveal': RevealKind.Always,
                    'focus': true,
                    'panel': PanelKind.Shared,
                    'showReuseMessage': false,
                    'clear': true
                },
                'options': {
                    'cwd': `\${workspaceFolder}/${options.targetFolderName}`
                },
                'problemMatcher': []
            }]
        },
        {
            id: CdtCloudBlueprintExamples.EXAMPLE_TRACES,
            label: 'Example traces',
            welcomeFile: 'EXAMPLE_TRACES_README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/example-traces').normalizePath().toString()
        },
        {
            id: CdtCloudBlueprintExamples.CLANGD_CONTEXTS,
            label: 'Clangd contexts',
            welcomeFile: 'CLANGD_CONTEXTS_README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/clangd-contexts').normalizePath().toString()
        }];
    }
}
