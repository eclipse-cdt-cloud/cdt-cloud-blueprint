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
import { TraceServerService, traceServerPath } from '../common/trace-server-protocol';
import { TraceServerServiceImpl } from './trace-server-service';

export default new ContainerModule(bind => {
    bind(TraceServerService).to(TraceServerServiceImpl).inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(ctx =>
            new RpcConnectionHandler(traceServerPath, () =>
                ctx.container.get<TraceServerService>(TraceServerService)
            )
        )
        .inSingletonScope();
});
