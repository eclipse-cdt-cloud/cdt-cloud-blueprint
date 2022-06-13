/********************************************************************************
 * Copyright (C) 2020 EclipseSource and others.
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

import { Key, KeyCode } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandService } from '@theia/core/lib/common/command';
import { GenerateExampleCommand } from '@eclipse-cdt-cloud/blueprint-example-generator/lib/browser';
import * as React from 'react';

export interface ExternalBrowserLinkProps {
    text: string;
    url: string;
    windowService: WindowService;
}

function ExternalBrowserLink(props: ExternalBrowserLinkProps): JSX.Element {
    return <a
        role={'button'}
        tabIndex={0}
        onClick={() => openExternalLink(props.url, props.windowService)}
        onKeyDown={(e: React.KeyboardEvent) => {
            if (Key.ENTER.keyCode === KeyCode.createKeyCode(e.nativeEvent).key?.keyCode) {
                openExternalLink(props.url, props.windowService);
            }
        }}>
        {props.text}
    </a>;
}

function openExternalLink(url: string, windowService: WindowService): void {
    windowService.openNewWindow(url, { external: true });
}

export function renderWhatIs(windowService: WindowService, commandService: CommandService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Welcome to CDT.cloud Blueprint
        </h3>
        <div >
            CDT.cloud Blueprint is a <span className='gs-text-bold'>template</span> tool for building custom, web-based C/C++ tools.
            Purely based on extensible open source components, it offers a modern and feature-rich C/C++ development experience,
            including language editing and debugging support, memory debugging and a tracing view.
            It is meant to serve as a starting point for the implementation of your own domain-specific custom C/C++ tool.
        </div>
        <h3 className='gs-section-header'>
            Start playing around!
        </h3>
        <div>Select and generate an <a
                role={'button'}
                tabIndex={0}
                onClick={() => generateExample(commandService)}
                onKeyDown={(e: React.KeyboardEvent) => generateExample(commandService)}>
                {'example project'}
            </a>.</div>
        <div>Explore the features, such as code editing, building, build configurations, debugging, etc.</div>
        <div>Download and open <ExternalBrowserLink text="example traces"
            url="https://github.com/tuxology/tracevizlab/blob/master/labs/TraceCompassTutorialTraces.tgz" windowService={windowService} ></ExternalBrowserLink> with
            Trace Compass Cloud.</div>
    </div>;
}

function generateExample(commandService: CommandService): void {
    commandService.executeCommand(GenerateExampleCommand.id);
}

export function renderWhatIsNot(): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            What CDT.cloud Blueprint isn't
        </h3>
        <div >
            CDT.cloud Blueprint is <span className='gs-text-bold'>not meant to be used as a production-ready product</span>.
            However, feel free to use it a template for building your own custom C/C++ tool based on this blueprint, as well
            as for testing the integrated CDT.cloud components.
        </div>
    </div>;
}

export function renderTickets(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Get involved with CDT.cloud
        </h3>
        <div >
            CDT.cloud Blueprint is part of the CDT.cloud project, which hosts components and best practices for building
            customizable web-based C/C++ tools. For more information on CDT.cloud visit us
            on <ExternalBrowserLink text="our webpage" url="https://cdt-cloud.io"
                windowService={windowService} ></ExternalBrowserLink> or
            on <ExternalBrowserLink text="Github" url="https://github.com/eclipse-cdt-cloud/cdt-cloud"
                windowService={windowService} ></ExternalBrowserLink> and <ExternalBrowserLink text="get in touch"
                    url="https://cdt-cloud.io/contact" windowService={windowService} ></ExternalBrowserLink> to
            discuss ideas, request features, report bugs, or to get support for building your custom C/C++ tool.
        </div>
    </div>;
}

export function renderSourceCode(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Source Code and CDT.cloud components
        </h3>
        <div >
            The source code of CDT.cloud Blueprint is available
            on <ExternalBrowserLink text="Github" url="https://github.com/eclipse-cdt-cloud/cdt-cloud-blueprint"
                windowService={windowService} ></ExternalBrowserLink>.
        </div>
        <div >
            CDT.cloud Blueprint bundles the following CDT.cloud open-source components:
            <ul>
                <li>
                    <ExternalBrowserLink text="CDT GDB Debug Adapter" url="https://github.com/eclipse-cdt-cloud/cdt-gdb-adapter"
                        windowService={windowService} ></ExternalBrowserLink>
                </li>
                <li>
                    <ExternalBrowserLink text="Clangd Contexts" url="https://github.com/eclipse-cdt-cloud/clangd-contexts"
                        windowService={windowService} ></ExternalBrowserLink>
                </li>
                <li>
                    <ExternalBrowserLink text="Trace Compass Cloud" url="https://github.com/eclipse-cdt-cloud/theia-trace-extension"
                        windowService={windowService} ></ExternalBrowserLink>
                </li>
            </ul>
        </div>
    </div>;
}

export function renderDocumentation(windowService: WindowService): React.ReactNode {
    return <div className='gs-section'></div>;
}

export function renderDownloads(): React.ReactNode {
    return <div className='gs-section'>
        <h3 className='gs-section-header'>
            Updates and Downloads
        </h3>
        <div className='gs-action-container'>
            You can update CDT.cloud Blueprint directly in this application by navigating to
            File {'>'} Settings {'>'} Check for Updates. Moreover the application will check for Updates
            after each launch automatically.
            Alternatively you can download the most recent version from our webpage.
        </div>
    </div>;
}
