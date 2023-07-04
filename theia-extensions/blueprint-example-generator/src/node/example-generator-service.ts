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

import { ContributionProvider } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import * as fs from 'fs-extra';
import { Example, ExamplesContribution, ExampleGeneratorService } from '../common/protocol';
import { TaskConfiguration } from '@theia/task/lib/common';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';

@injectable()
export class ExampleGeneratorServiceImpl implements ExampleGeneratorService {

    @inject(ContributionProvider) @named(ExamplesContribution)
    protected readonly examplesProvider: ContributionProvider<ExamplesContribution>;

    async getExamples(): Promise<Example[]> {
        const contributions = this.examplesProvider.getContributions();
        return contributions.flatMap(contribution => contribution.examples);
    }

    async generateExample(example: Example, target: string, folderName?: string): Promise<void> {
        const exampleUri = new URI(example.resourcesPath);
        const examplePath = FileUri.fsPath(exampleUri);
        if (!examplePath || !fs.existsSync(examplePath)) {
            throw new Error(`Could not find resources of example in ${examplePath}`);
        }

        const targetUri = new URI(target);
        this.copyFiles(targetUri, examplePath);

        if (example.tasks || example.launches) {
            const workspaceRoot = folderName ? targetUri.parent : targetUri;
            const configFolder = FileUri.fsPath(workspaceRoot.resolve('.theia'));
            fs.ensureDirSync(configFolder);
            this.createOrAmendTasksJson(example, workspaceRoot, folderName);
            this.createOrAmendLaunchJson(example, workspaceRoot, folderName);
        }
    }

    protected copyFiles(targetUri: URI, examplePath: string): void {
        const targetPath = FileUri.fsPath(targetUri);
        fs.copySync(examplePath, targetPath, { recursive: true, errorOnExist: true });
    }

    protected createOrAmendTasksJson(example: Example, workspaceRoot: URI, folderName?: string): void {
        if (example.tasks) {
            const tasksJsonPath = FileUri.fsPath(workspaceRoot.resolve('.theia/tasks.json'));
            if (!fs.existsSync(tasksJsonPath)) {
                fs.writeFileSync(tasksJsonPath, `{
                    "version": "2.0.0",
                    "tasks": []
                }`);
            }
            const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath).toString());
            const existingTaskConfigurations = tasksJson['tasks'] as TaskConfiguration[];
            const newTasks = example.tasks && folderName ? example.tasks.map(task => ({
                ...task,
                'label': task.label + ' (' + folderName + ')'
            })) : example.tasks;
            tasksJson['tasks'] = [...existingTaskConfigurations, ...newTasks];
            const newTasksJsonContent = this.resolveVariablesAndSerialize(tasksJson, folderName);
            fs.writeFileSync(tasksJsonPath, newTasksJsonContent);
        }
    }

    protected createOrAmendLaunchJson(example: Example, workspaceRoot: URI, folderName?: string): void {
        if (example.launches) {
            const launchJsonPath = FileUri.fsPath(workspaceRoot.resolve('.theia/launch.json'));
            if (!fs.existsSync(launchJsonPath)) {
                fs.writeFileSync(launchJsonPath, `{
                    "version": "2.0.0",
                    "configurations": []
                }`);
            }
            const launchJson = JSON.parse(fs.readFileSync(launchJsonPath).toString());
            const existingLaunchConfigurations = launchJson['configurations'] as DebugConfiguration[];
            const newLaunchConfigs = example.launches && folderName ? example.launches.map(launchConfig => ({
                ...launchConfig,
                'name': launchConfig.name + ' (' + folderName + ')'
            })) : example.launches;
            launchJson['configurations'] = [...existingLaunchConfigurations, ...newLaunchConfigs];
            const newLaunchJsonContent = this.resolveVariablesAndSerialize(launchJson, folderName);
            fs.writeFileSync(launchJsonPath, newLaunchJsonContent);
        }
    }

    protected resolveVariablesAndSerialize(jsonObject: object, folderName?: string): string {
        const postFix = folderName ? `/${folderName}` : '';
        return JSON.stringify(jsonObject, undefined, 2).replace(/\$\{targetFolder\}/g, '${workspaceFolder}' + postFix);
    }
}
