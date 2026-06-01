import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://100.55.196.2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

async function proxy(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const url = `${BACKEND_BASE}/order/${path}${search}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower !== 'host' &&
      lower !== 'connection' &&
      lower !== 'content-length' &&
      lower !== 'transfer-encoding' &&
      lower !== 'keep-alive' &&
      lower !== 'expect'
    ) {
      headers[key] = value;
    }
  });

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.blob()
      : undefined;

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await res.blob();
    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
    });
  } catch (error) {
    console.error('[order-bff] Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal terhubung ke layanan order.' },
      { status: 502 }
    );
  }
}
