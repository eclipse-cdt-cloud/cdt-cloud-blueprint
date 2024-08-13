/* eslint-disable @typescript-eslint/tslint/config */
/********************************************************************************
 * Copyright (C) 2022 EclipseSource and others.
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
import { exec } from 'child_process';
import { execute } from './tracecompass-server-download';

const LOCAL_DOWNLOAD_TARGET_PATH = './tracecompass-server/';
const LOCAL_BINARY_PATH = `${LOCAL_DOWNLOAD_TARGET_PATH}trace-compass-server/tracecompass-server`;

execute().then(() => runTraceCompassServer());

async function runTraceCompassServer(): Promise<void> {
    console.log('Starting trace compass server...');
    const traceCompassServceProc = exec(`${LOCAL_BINARY_PATH}`);
    traceCompassServceProc.on('close', (code, _) => console.log('Trace Compass Server stopped with ' + code));
    if (traceCompassServceProc.stdout) {
        traceCompassServceProc.stdout.on('data', data => console.log(data));
    }
    if (traceCompassServceProc.stderr) {
        traceCompassServceProc.stderr.on('data', data => console.error(data));
    }
}
