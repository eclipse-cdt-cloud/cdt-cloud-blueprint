/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

export const traceServerPath = '/services/trace-server-manager';

export const TraceServerService = Symbol('TraceServerService');
export interface TraceServerService {
    startTraceServer(): Promise<string>;
    stopTraceServer(): Promise<string>;
}
