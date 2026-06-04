import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "http://localhost:8081/api";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const backendBaseUrl = (process.env.APPWEAVER_API_BASE_URL || DEFAULT_BACKEND_BASE_URL).replace(/\/+$/, "");
  const backendUrl = new URL(`${backendBaseUrl}/${path.map(encodeURIComponent).join("/")}`);
  backendUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("expect");
  headers.delete("keep-alive");
  headers.delete("proxy-authenticate");
  headers.delete("proxy-authorization");
  headers.delete("te");
  headers.delete("trailer");
  headers.delete("upgrade");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  const responseBody = response.status === 204 ? null : await response.arrayBuffer();

  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
