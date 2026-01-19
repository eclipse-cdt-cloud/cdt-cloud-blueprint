/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { TraceServerProxyService, TRACE_SERVER_PROXY_PATH } from '../common/trace-server-proxy-protocol';
import { TraceServerProxyFrontendContribution } from './trace-server-proxy-frontend-contribution';

export default new ContainerModule(bind => {
    bind(TraceServerProxyService).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<TraceServerProxyService>(TRACE_SERVER_PROXY_PATH);
    }).inSingletonScope();

    bind(TraceServerProxyFrontendContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(TraceServerProxyFrontendContribution);
});
