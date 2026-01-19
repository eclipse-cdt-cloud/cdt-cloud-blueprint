/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

export const TRACE_SERVER_PROXY_PATH = '/services/trace-server-proxy';

export const TRACE_SERVER_PROXY_ENDPOINT = '/trace-server-proxy';

export const TraceServerProxyService = Symbol('TraceServerProxyService');
export interface TraceServerProxyService {
    /**
     * Get the trace server proxy configuration for the frontend.
     * Returns the proxy URL and backend URL if running in cloud mode,
     * or undefined if the proxy is not active.
     */
    getProxyConfig(): Promise<TraceServerProxyConfig | undefined>;
}

export interface TraceServerProxyConfig {
    /**
     * The URL for the frontend to use (via proxy).
     */
    frontendUrl: string;
    /**
     * The URL for the backend to use (direct connection to trace server).
     */
    backendUrl: string;
}
