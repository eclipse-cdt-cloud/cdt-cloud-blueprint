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

import { Example, ExampleGeneratorService } from '@eclipse-cdt-cloud/blueprint-example-generator/lib/browser';
import { Command, CommandContribution, CommandHandler, CommandRegistry, CommandService, MessageService, nls } from '@theia/core';
import { LabelProvider, QuickInputService, QuickPickService, QuickPickValue } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';

import { inject, injectable } from 'inversify';

export const GenerateExampleCommand: Command = {
    id: 'eclipse-cdt-cloud.example-generator.generate-example',
    label: 'Generate CDT Cloud Blueprint Example'
};

@injectable()
export class GenerateExampleCommandHandler implements CommandHandler {

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(ExampleGeneratorService)
    protected readonly exampleGeneratorService: ExampleGeneratorService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    async execute(...args: string[]): Promise<void> {
        const example = await this.selectExample(args);
        if (!example) {
            return;
        }

        const workspaceFolder = await this.getWorkspaceRoot();
        if (!workspaceFolder) {
            this.messageService.error('Cannot resolve workspace root, please open a workspace');
            return;
        }

        const targetFolder = await this.specifyTargetFolder(example, workspaceFolder);
        if (!targetFolder) {
            return;
        }

        const targetFolderName = targetFolder.path.name;
        if (await this.validateFolderName(targetFolderName, workspaceFolder)) {
            throw new Error('Target folder is invalid, probably it already exists.');
        }

        const progress = await this.messageService.showProgress({
            text: `Generating example ${example.label} to ${targetFolderName}`
        });
        try {
            await this.exampleGeneratorService.generateExample(example, targetFolder.toString(), targetFolderName);
            await this.refreshAndReveal(targetFolder);
            if (example.welcomeFile) {
                const fileUri = targetFolder.resolve(example.welcomeFile);
                await this.editorManager.open(fileUri);
            }
        } catch (error) {
            console.error('Uncaught Exception: ', error.toString());
        } finally {
            progress.cancel();
        }
    }

    protected async selectExample(args: string[]): Promise<Example | undefined> {
        if (args.length < 1 || typeof args[0] !== 'string') {
            return this.askUserToChooseExample();
        }

        const examples = await this.exampleGeneratorService.getExamples();
        const matchedExample = examples.filter((e: Example) => args[0] === e.id);
        if (matchedExample.length > 0) {
            return matchedExample[0];
        }

        return undefined;
    }

    protected async askUserToChooseExample(): Promise<Example | undefined> {
        const examples = await this.exampleGeneratorService.getExamples();
        const items: QuickPickValue<Example>[] = examples.map((e: Example) => <QuickPickValue<Example>>{ label: e.label, value: e });
        const selection = await this.quickPickService.show(items, {
            placeholder: 'Select type of example to generate'
        });
        return selection?.value;
    }

    protected async getWorkspaceRoot(): Promise<URI | undefined> {
        const workspaceRoot = await this.selectWorkspaceRoot();
        if (!workspaceRoot) {
            return;
        }
        return workspaceRoot;
    }

    protected async selectWorkspaceRoot(): Promise<URI | undefined> {
        const workspaceRoots = this.workspaceService.tryGetRoots();
        if (workspaceRoots.length === 0) {
            return;
        }
        if (workspaceRoots.length === 1) {
            return workspaceRoots[0].resource;
        }
        const items: QuickPickValue<URI>[] = [];
        for (const workspaceRoot of workspaceRoots) {
            items.push({
                label: this.labelProvider.getName(workspaceRoot.resource),
                description: this.labelProvider.getLongName(workspaceRoot.resource),
                value: workspaceRoot.resource
            });
        }
        const root = await this.quickPickService.show(items, {
            placeholder: nls.localize('theia/debug/addConfigurationPlaceholder', 'Select workspace root to add example to')
        });
        return root?.value;
    }

    protected async refreshAndReveal(fileUri: URI): Promise<void> {
        await this.commandService.executeCommand(FileNavigatorCommands.REFRESH_NAVIGATOR.id);
        await this.commandService.executeCommand(FileNavigatorCommands.REVEAL_IN_NAVIGATOR.id, fileUri);
    }

    protected async specifyTargetFolder(example: Example, workspaceFolder: URI): Promise<URI> {
        const targetFolder = await this.quickInputService.input({
            placeHolder: example.id,
            value: example.id,
            prompt: 'Specify the name of the target folder',
            validateInput: input => this.validateFolderName(input, workspaceFolder)
        }) ?? '';
        return workspaceFolder.resolve(targetFolder.length > 0 ? targetFolder : example.id);
    }

    protected async validateFolderName(input: string, workspaceFolder: URI): Promise<string | { content: string; severity: number; } | null | undefined> {
        const inputIsNotEmpty = input.length !== 0;
        const validFolderNameRegExp = /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/;
        if (inputIsNotEmpty && !validFolderNameRegExp.test(input)) {
            return {
                content: 'Invalid folder name',
                severity: 3 // Error
            };
        }
        if (inputIsNotEmpty && await this.fileService.exists(workspaceFolder.resolve(input))) {
            return {
                content: 'Folder already exists',
                severity: 3 // Error
            };
        }
        return undefined;
    }
}

@injectable()
export class ExampleGeneratorCommandContribution implements CommandContribution {

    @inject(GenerateExampleCommandHandler)
    private readonly generateExampleCommandHandler: GenerateExampleCommandHandler;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(GenerateExampleCommand, this.generateExampleCommandHandler);
    }

}
