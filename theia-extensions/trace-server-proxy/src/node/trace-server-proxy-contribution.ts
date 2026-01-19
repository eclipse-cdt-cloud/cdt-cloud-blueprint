/********************************************************************************
 * Copyright (C) 2026 TypeFox, EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Application, Request, Response, NextFunction } from '@theia/core/shared/express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { TraceServerProxyService, TraceServerProxyConfig, TRACE_SERVER_PROXY_ENDPOINT } from '../common/trace-server-proxy-protocol';
import { ClientRequest } from 'http';

const THEIACLOUD_SESSION_URL_ENV = 'THEIACLOUD_SESSION_URL';
const TRACE_SERVER_URL_ENV = 'TRACE_SERVER_URL';
const DEFAULT_TRACE_SERVER_URL = 'http://localhost:8080';

const CORS_ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const CORS_ALLOWED_HEADERS = 'Content-Type, Authorization, x-requested-with, Accept';

@injectable()
export class TraceServerProxyContribution implements BackendApplicationContribution, TraceServerProxyService {

    protected readonly sessionUrl: string | undefined;
    protected readonly traceServerUrl: string;
    protected readonly sessionHost: string | undefined;

    constructor() {
        this.sessionUrl = process.env[THEIACLOUD_SESSION_URL_ENV]?.trim();
        this.traceServerUrl = process.env[TRACE_SERVER_URL_ENV]?.trim() || DEFAULT_TRACE_SERVER_URL;
        this.sessionHost = this.extractHost(this.sessionUrl);
    }

    protected extractHost(url: string | undefined): string | undefined {
        if (!url) {
            return undefined;
        }
        try {
            const parsed = new URL(url);
            return parsed.host; // includes port if present
        } catch {
            return undefined;
        }
    }

    /**
     * Check if the given origin is allowed to access the proxy.
     * Allowed origins:
     * - The exact session URL origin (e.g., "http://localhost:3000")
     * - Webview origins matching pattern: http(s)://*.webview.{sessionHost}
     */
    protected isAllowedOrigin(origin: string | undefined): boolean {
        if (!origin || !this.sessionHost) {
            return false;
        }

        try {
            const originUrl = new URL(origin);
            const originHost = originUrl.host;

            if (originHost === this.sessionHost) {
                return true;
            }

            const webviewPattern = `.webview.${this.sessionHost}`;
            if (originHost.endsWith(webviewPattern)) {
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }

    protected addCorsHeaders(res: Response, origin: string | undefined): void {
        if (origin && this.isAllowedOrigin(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', CORS_ALLOWED_METHODS);
            res.setHeader('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
    }

    /**
     * Re-stream the request body to the proxy request if it was parsed by Express body-parser.
     * This is necessary because body-parser consumes the stream, making it unavailable for proxying.
     */
    protected fixRequestBody(proxyReq: ClientRequest, req: Request): void {
        if (req.body && Object.keys(req.body).length > 0) {
            const contentType = req.headers['content-type'] || '';
            let bodyData: string;

            if (contentType.includes('application/json')) {
                bodyData = JSON.stringify(req.body);
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                bodyData = new URLSearchParams(req.body).toString();
            } else {
                bodyData = JSON.stringify(req.body);
            }

            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }

    configure(app: Application): void {
        if (!this.sessionUrl) {
            console.log('TraceServerProxy: THEIACLOUD_SESSION_URL not set, proxy disabled');
            return;
        }

        console.log('TraceServerProxy: Enabling proxy at ' + TRACE_SERVER_PROXY_ENDPOINT + ' -> ' + this.traceServerUrl);

        app.options([TRACE_SERVER_PROXY_ENDPOINT, TRACE_SERVER_PROXY_ENDPOINT + '/*'], (req: Request, res: Response) => {
            const origin = req.headers.origin;
            if (this.isAllowedOrigin(origin)) {
                this.addCorsHeaders(res, origin);
                res.sendStatus(204);
            } else {
                res.sendStatus(403);
            }
        });

        app.use(TRACE_SERVER_PROXY_ENDPOINT, (req: Request, res: Response, next: NextFunction) => {
            const origin = req.headers.origin;
            this.addCorsHeaders(res, origin);
            next();
        });

        app.use(
            TRACE_SERVER_PROXY_ENDPOINT,
            createProxyMiddleware({
                target: this.traceServerUrl,
                changeOrigin: true,
                pathRewrite: {
                    [`^${TRACE_SERVER_PROXY_ENDPOINT}`]: ''
                },
                onProxyReq: (proxyReq: ClientRequest, req: Request, _res: Response) => {
                    // Re-stream the body if it was parsed by body-parser
                    if (req.body && Object.keys(req.body).length > 0) {
                        this.fixRequestBody(proxyReq, req);
                    }
                },
                onError: (err: Error, req: Request, res: Response) => {
                    console.error('TraceServerProxy: Proxy error for ' + req.method + ' ' + req.originalUrl);
                    console.error('TraceServerProxy: ' + err.message);
                    if (res.writeHead) {
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            error: 'Trace server proxy error',
                            message: err.message
                        }));
                    }
                }
            })
        );
    }

    async getProxyConfig(): Promise<TraceServerProxyConfig | undefined> {
        if (!this.sessionUrl) {
            return undefined;
        }

        // Normalize the session URL (remove trailing slash if present)
        let baseUrl = this.sessionUrl;
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        return {
            frontendUrl: `${baseUrl}${TRACE_SERVER_PROXY_ENDPOINT}`,
            backendUrl: this.traceServerUrl
        };
    }
}
