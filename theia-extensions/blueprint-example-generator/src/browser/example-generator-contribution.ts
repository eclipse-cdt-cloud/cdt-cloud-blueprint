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

import { Command, CommandContribution, CommandHandler, CommandRegistry, MessageService, nls } from '@theia/core';
import { LabelProvider, QuickInputService, QuickPickService, QuickPickValue } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { inject, injectable } from 'inversify';
import { ExampleGeneratorService, Examples } from '../common/protocol';

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

    async execute(...args: string[]): Promise<void> {
        const exampleId = await this.getExampleId(args);
        if (!exampleId) {
            return;
        }

        const targetFolder = await this.getWorkspaceRoot();
        if (!targetFolder) {
            this.messageService.error('Cannot resolve workspace root, please open a workspace');
            return;
        }

        const progress = await this.messageService.showProgress({ text: 'Starting to report progress' });
        try {
            const fileToBeOpened = await this.exampleGeneratorService.generateExample(exampleId, targetFolder.toString());
            if (fileToBeOpened) {
                this.editorManager.open(new URI(fileToBeOpened));
            }
        } catch (error) {
            console.error('Uncaught Exception: ', error.toString());
        } finally {
            progress.cancel();
        }
    }

    protected async getExampleId(args: string[]): Promise<string | undefined> {
        if (args.length < 1 || typeof args[0] !== 'string') {
            return this.askUserToChooseExample();
        }
        return args[0];
    }

    protected async askUserToChooseExample(): Promise<string | undefined> {
        const items: QuickPickValue<string>[] = [
            { label: 'CMake example', value: Examples.CMAKE_EXAMPLE },
            { label: 'Example traces', value: Examples.EXAMPLE_TRACES },
            { label: 'Clangd contexts', value: Examples.CLANGD_CONTEXTS }
        ];
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
}

@injectable()
export class ExampleGeneratorCommandContribution implements CommandContribution {

    @inject(GenerateExampleCommandHandler)
    private readonly generateExampleCommandHandler: GenerateExampleCommandHandler;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(GenerateExampleCommand, this.generateExampleCommandHandler);
    }
}
