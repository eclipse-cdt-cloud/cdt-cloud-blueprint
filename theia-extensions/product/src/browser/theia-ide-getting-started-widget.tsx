/********************************************************************************
 * Copyright (C) 2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import * as React from 'react';

import { codicon, Message, PreferenceService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { renderDocumentation, renderDownloads, renderSourceCode, renderSupport, renderTickets, renderWhatIs, renderWhatIsNot } from './branding-util';

import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandService, nls } from '@theia/core';
import { GenerateExampleCommand, CdtCloudBlueprintExamples } from '@eclipse-cdt-cloud/blueprint-examples/lib/browser';

@injectable()
export class TheiaIDEGettingStartedWidget extends GettingStartedWidget {

    @inject(VSXEnvironment)
    protected readonly environment: VSXEnvironment;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected vscodeApiVersion: string;

    protected async doInit(): Promise<void> {
        super.doInit();
        this.vscodeApiVersion = await this.environment.getVscodeApiVersion();
        await this.preferenceService.ready;
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('alwaysShowWelcomePage');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

    protected render(): React.ReactNode {
        return <div className='gs-container'>
            <div className='gs-content-container'>
                <div className='gs-float'>
                    <div className='gs-logo'>
                    </div>
                    {this.renderActions()}
                </div>
                {this.renderHeader()}
                <hr className='gs-hr' />
                <div className='flex-grid'>
                    <div className='col'>
                        {renderWhatIs(this.windowService, this.commandService)}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {renderWhatIsNot()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {renderSupport(this.windowService)}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {renderTickets(this.windowService)}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {renderSourceCode(this.windowService)}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {renderDocumentation(this.windowService)}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {renderDownloads()}
                    </div>
                </div>
                <div className='flex-grid'>
                    <div className='col'>
                        {this.renderPreferences()}
                    </div>
                </div>
            </div>
        </div>;
    }

    protected renderActions(): React.ReactNode {
        return <div className='gs-container'>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderStart()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderRecentWorkspaces()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderExamples()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderSettings()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {this.renderHelp()}
                </div>
            </div>
        </div>;
    }

    protected renderHeader(): React.ReactNode {
        return <div className='gs-header'>
            <h1>CDT Cloud <span className='gs-blue-header'>Blueprint</span></h1>
            {this.renderVersion()}
        </div>;
    }

    protected renderVersion(): React.ReactNode {
        return <div>
            <p className='gs-sub-header' >
                {this.applicationInfo ? 'Version ' + this.applicationInfo.version : '-'}
            </p>

            <p className='gs-sub-header' >
                {'VS Code API Version: ' + this.vscodeApiVersion}
            </p>
        </div>;
    }

    protected renderExamples(): React.ReactNode {
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('beaker')}></i>
                {nls.localizeByDefault('Examples')}
            </h3>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doGenerateExample(CdtCloudBlueprintExamples.CMAKE_EXAMPLE)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doGenerateExampleEnter(e, CdtCloudBlueprintExamples.CMAKE_EXAMPLE)}>
                    {nls.localizeByDefault('CMake Example')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doGenerateExample(CdtCloudBlueprintExamples.EXAMPLE_TRACES)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doGenerateExampleEnter(e, CdtCloudBlueprintExamples.EXAMPLE_TRACES)}>
                    {nls.localizeByDefault('Example traces')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doGenerateExample(CdtCloudBlueprintExamples.CLANGD_CONTEXTS)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doGenerateExampleEnter(e, CdtCloudBlueprintExamples.CLANGD_CONTEXTS)}>
                    {nls.localizeByDefault('Clangd contexts')}
                </a>
            </div>
        </div>;
    }

    protected doGenerateExample = (exampleId: string) => this.commandRegistry.executeCommand(GenerateExampleCommand.id, exampleId);
    protected doGenerateExampleEnter = (e: React.KeyboardEvent, exampleId: string) => {
        if (this.isEnterKey(e)) {
            this.doGenerateExample(exampleId);
        }
    };

    protected renderHelp(): React.ReactNode {
        return <div className='gs-section'>
            <h3 className='gs-section-header'>
                <i className={codicon('question')}></i>
                {nls.localizeByDefault('Help')}
            </h3>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink('https://www.eclipse.org/cdt-cloud/documentation')}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, 'https://www.eclipse.org/cdt-cloud/documentation')}>
                    {nls.localizeByDefault('CDT Cloud Documentation')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink(this.documentationUrl)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, this.documentationUrl)}>
                    {nls.localizeByDefault('Theia Documentation')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink(this.extensionUrl)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, this.extensionUrl)}>
                    {nls.localize('theia/getting-started/newExtension', 'Building a New Extension')}
                </a>
            </div>
            <div className='gs-action-container'>
                <a
                    role={'button'}
                    tabIndex={0}
                    onClick={() => this.doOpenExternalLink(this.pluginUrl)}
                    onKeyDown={(e: React.KeyboardEvent) => this.doOpenExternalLinkEnter(e, this.pluginUrl)}>
                    {nls.localize('theia/getting-started/newPlugin', 'Building a New Plugin')}
                </a>
            </div>
        </div>;
    }
}
