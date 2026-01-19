/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core/lib/common';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { TraceServerProxyService, TRACE_SERVER_PROXY_PATH } from '../common/trace-server-proxy-protocol';
import { TraceServerProxyContribution } from './trace-server-proxy-contribution';

export default new ContainerModule(bind => {
    bind(TraceServerProxyContribution).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(TraceServerProxyContribution);
    bind(TraceServerProxyService).toService(TraceServerProxyContribution);

    bind(ConnectionHandler)
        .toDynamicValue(ctx =>
            new RpcConnectionHandler(TRACE_SERVER_PROXY_PATH, () =>
                ctx.container.get<TraceServerProxyService>(TraceServerProxyService)
            )
        )
        .inSingletonScope();
});
