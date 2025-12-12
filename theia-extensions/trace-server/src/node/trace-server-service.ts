/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import { dirname, isAbsolute, resolve } from 'path';
import { injectable } from '@theia/core/shared/inversify';
import { TraceServerService } from '../common/trace-server-protocol';
import treeKill = require('tree-kill');

const APPLICATION_ROOT = resolve(dirname(process.argv0));

export const BUNDLED_TRACE_SERVER_PATH = resolve(
    APPLICATION_ROOT,
    'resources/trace-compass-server/tracecompass-server'
);

export function resolveTraceServerPath(): string {
    const envPath = process.env.TRACE_SERVER_PATH;
    if (envPath) {
        return isAbsolute(envPath) ? envPath : resolve(process.cwd(), envPath);
    }
    return BUNDLED_TRACE_SERVER_PATH;
}

const SUCCESS = 'success';

export interface ChildProcessWithPid extends ChildProcess {
    pid: number;
}

@injectable()
export class TraceServerServiceImpl implements TraceServerService {
    protected server?: ChildProcess;

    async startTraceServer(): Promise<string> {
        if (this.isServerRunning(this.server)) {
            return SUCCESS;
        }

        const path = resolveTraceServerPath();
        if (!(await this.validateTraceServerPath(path))) {
            const hint = process.env.TRACE_SERVER_PATH
                ? 'Check that the TRACE_SERVER_PATH environment variable points to the correct location.'
                : 'Set the TRACE_SERVER_PATH environment variable to specify a custom path.';
            throw new Error(`Could not find the Trace Server at: ${path}. ${hint}`);
        }

        const server = spawn(path, []);
        if (server.pid === undefined) {
            return new Promise<never>((_, reject) => server.once('error', reject));
        }

        this.server = server;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let timeout: any;
        try {
            await new Promise<void>((res, rej) => {
                timeout = setTimeout(res, 2000);
                server.once('exit', (code, _signal) => rej(new Error(`Server exited with code ${code}`)));
                server.once('error', rej);
            });
        } catch (error) {
            this.server = undefined;
            throw error;
        } finally {
            server.removeAllListeners();
            clearTimeout(timeout);
        }

        server.once('exit', () => {
            this.server = undefined;
        });

        return SUCCESS;
    }

    async stopTraceServer(): Promise<string> {
        const { server } = this;
        if (!this.isServerRunning(server)) {
            return SUCCESS;
        }

        await new Promise<void>((res, rej) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let exitTimeout: any;
            server.once('exit', () => {
                clearTimeout(exitTimeout);
                res();
            });
            treeKill(server.pid, error => {
                if (error) {
                    rej(error);
                } else {
                    exitTimeout = setTimeout(() => rej(new Error('The Trace Server did not exit')), 1000);
                }
            });
        });

        return SUCCESS;
    }

    protected async validateTraceServerPath(traceServerPath: string): Promise<boolean> {
        try {
            const stat = await fs.promises.stat(traceServerPath);
            return stat.isFile() && (stat.mode & fs.constants.R_OK) !== 0;
        } catch {
            return false;
        }
    }

    protected isServerRunning(server?: ChildProcess): server is ChildProcessWithPid {
        // eslint-disable-next-line no-null/no-null
        return server !== undefined && server.exitCode === null && server.signalCode === null;
    }
}
