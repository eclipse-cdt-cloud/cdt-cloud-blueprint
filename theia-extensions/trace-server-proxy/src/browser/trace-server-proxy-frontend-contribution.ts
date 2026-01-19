/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PreferenceScope, PreferenceService } from '@theia/core/lib/common';
import { TraceServerProxyService } from '../common/trace-server-proxy-protocol';

/**
 * Preference keys for the vscode-trace-extension
 */
const TRACE_SERVER_URL_PREF = 'trace-compass.traceserver.url';
const TRACE_SERVER_BACKEND_URL_PREF = 'trace-compass.traceserver.backendUrl';
const TRACE_SERVER_ENABLE_SEPARATE_BACKEND_URL_PREF = 'trace-compass.traceserver.enableSeparateBackendUrl';

@injectable()
export class TraceServerProxyFrontendContribution implements FrontendApplicationContribution {

    @inject(TraceServerProxyService)
    protected readonly proxyService: TraceServerProxyService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    async onStart(): Promise<void> {
        try {
            const config = await this.proxyService.getProxyConfig();
            if (config) {
                console.log('TraceServerProxy: Configuring trace server preferences for cloud mode');
                console.log('TraceServerProxy: Frontend URL: ' + config.frontendUrl);
                console.log('TraceServerProxy: Backend URL: ' + config.backendUrl);

                await this.preferenceService.set(TRACE_SERVER_URL_PREF, config.frontendUrl, PreferenceScope.User);
                await this.preferenceService.set(TRACE_SERVER_BACKEND_URL_PREF, config.backendUrl, PreferenceScope.User);
                await this.preferenceService.set(TRACE_SERVER_ENABLE_SEPARATE_BACKEND_URL_PREF, true, PreferenceScope.User);

                console.log('TraceServerProxy: Preferences configured successfully');
            } else {
                console.log('TraceServerProxy: Proxy not active, using default trace server URL');
            }
        } catch (error) {
            console.error('TraceServerProxy: Failed to configure trace server URL:', error);
        }
    }
}
