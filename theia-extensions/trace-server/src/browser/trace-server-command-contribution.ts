/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, MessageService } from '@theia/core/lib/common';
import { TraceServerService } from '../common/trace-server-protocol';

export namespace TraceServerCommands {
    export const START: Command = {
        id: 'traceServer.start',
        label: 'Trace Server: Start'
    };
    export const STOP: Command = {
        id: 'traceServer.stop',
        label: 'Trace Server: Stop'
    };
    export const RESTART: Command = {
        id: 'traceServer.restart',
        label: 'Trace Server: Restart'
    };
}

@injectable()
export class TraceServerCommandContribution implements CommandContribution {

    @inject(TraceServerService)
    protected readonly traceServerService: TraceServerService;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(TraceServerCommands.START, {
            execute: async () => {
                try {
                    await this.traceServerService.startTraceServer();
                    this.messageService.info('Trace Server started successfully.');
                } catch (error) {
                    this.messageService.error(`Failed to start Trace Server: ${error}`);
                }
            }
        });

        commands.registerCommand(TraceServerCommands.STOP, {
            execute: async () => {
                try {
                    await this.traceServerService.stopTraceServer();
                    this.messageService.info('Trace Server stopped successfully.');
                } catch (error) {
                    this.messageService.error(`Failed to stop Trace Server: ${error}`);
                }
            }
        });

        commands.registerCommand(TraceServerCommands.RESTART, {
            execute: async () => {
                try {
                    await this.traceServerService.stopTraceServer();
                    await this.traceServerService.startTraceServer();
                    this.messageService.info('Trace Server restarted successfully.');
                } catch (error) {
                    this.messageService.error(`Failed to restart Trace Server: ${error}`);
                }
            }
        });
    }
}
