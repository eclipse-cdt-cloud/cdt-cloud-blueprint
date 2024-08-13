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

import { ContributionProvider } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/common/file-uri';
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

    async generateExample(example: Example, target: string, folderName: string): Promise<void> {
        const resolvedExample = (await this.getExamples()).find(e => e.id === example.id) ?? example;
        const exampleUri = new URI(resolvedExample.resourcesPath);
        const examplePath = FileUri.fsPath(exampleUri);
        if (!examplePath || !fs.existsSync(examplePath)) {
            throw new Error(`Could not find resources of example in ${examplePath}`);
        }

        const targetUri = new URI(target);
        this.copyFiles(targetUri, examplePath);

        if (resolvedExample.tasks || resolvedExample.launches) {
            const workspaceRoot = folderName ? targetUri.parent : targetUri;
            const configFolder = FileUri.fsPath(workspaceRoot.resolve('.theia'));
            fs.ensureDirSync(configFolder);
            this.createOrAmendTasksJson(resolvedExample, workspaceRoot, folderName);
            this.createOrAmendLaunchJson(resolvedExample, workspaceRoot, folderName);
        }
    }

    protected copyFiles(targetUri: URI, examplePath: string): void {
        const targetPath = FileUri.fsPath(targetUri);
        fs.copySync(examplePath, targetPath, { recursive: true, errorOnExist: true });
    }

    protected createOrAmendTasksJson(example: Example, workspaceRoot: URI, targetFolderName: string): void {
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
            const targetFolder = FileUri.fsPath(workspaceRoot.resolve(targetFolderName));
            const newTasks = example.tasks({targetFolderName, targetFolder});
            tasksJson['tasks'] = [...existingTaskConfigurations, ...newTasks];
            fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, undefined, 2));
        }
    }

    protected createOrAmendLaunchJson(example: Example, workspaceRoot: URI, targetFolderName: string): void {
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
            const targetFolder = FileUri.fsPath(workspaceRoot.resolve(targetFolderName));
            const newLaunchConfigs = example.launches({targetFolderName, targetFolder});
            launchJson['configurations'] = [...existingLaunchConfigurations, ...newLaunchConfigs];
            fs.writeFileSync(launchJsonPath, JSON.stringify(launchJson, undefined, 2));
        }
    }

}
