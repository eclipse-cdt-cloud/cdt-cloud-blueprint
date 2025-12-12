/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution } from '@theia/core/lib/common';
import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { TraceServerService, traceServerPath } from '../common/trace-server-protocol';
import { TraceServerCommandContribution } from './trace-server-command-contribution';

export default new ContainerModule(bind => {
    bind(TraceServerService).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<TraceServerService>(traceServerPath);
    }).inSingletonScope();

    bind(CommandContribution).to(TraceServerCommandContribution);
});
