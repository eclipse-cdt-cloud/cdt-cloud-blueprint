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

import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { PanelKind, RevealKind } from '@theia/task/lib/common';
import { CdtCloudBlueprintExamples } from '../common/cdt-blueprint-examples';
import { ExamplesContribution, Example } from '@eclipse-cdt-cloud/blueprint-example-generator/lib/node';

@injectable()
export class CdtCloudBlueprintExamplesContribution implements ExamplesContribution {
    get examples(): Example[] {
        return [{
            id: CdtCloudBlueprintExamples.CMAKE_EXAMPLE,
            label: 'CMake example',
            welcomeFile: 'CMAKE_EXAMPLE_README.md',
            resourcesPath: new URI(module.path).resolve('../../resources/cmake-example').normalizePath().toString(),
            launches: [{
                'type': 'gdb',
                'request': 'launch',
                'name': 'Debug Example C++',
                'program': '${targetFolder}/Example',
                'initCommands': ['tbreak main']
            }],
            tasks: [{
                'label': 'Binary build',
                'type': 'shell',
                'command': 'cmake . && make',
                'group': {
                    'kind': 'build',
                    'isDefault': true
                },
                'options': {
                    'cwd': '${targetFolder}'
                },
                'problemMatcher': []
            },
            {
                'label': 'Launch Example C++',
                'type': 'shell',
                'command': './Example',
                'presentation': {
                    'echo': true,
                    'reveal': RevealKind.Always,
                    'focus': true,
                    'panel': PanelKind.Shared,
                    'showReuseMessage': false,
                    'clear': true
                },
                'options': {
                    'cwd': '${targetFolder}'
                },
                'problemMatcher': []
            }]
        },
        {
            id: CdtCloudBlueprintExamples.EXAMPLE_TRACES,
            label: 'Example traces',
            welcomeFile: 'EXAMPLE_TRACES_README.md',
            resourcesPath: new URI(module.path).resolve('../../resources/example-traces').normalizePath().toString()
        },
        {
            id: CdtCloudBlueprintExamples.CLANGD_CONTEXTS,
            label: 'Clangd contexts',
            welcomeFile: 'CLANGD_CONTEXTS_README.md',
            resourcesPath: new URI(module.path).resolve('../../resources/clangd-contexts').normalizePath().toString()
        }];
    }
}
