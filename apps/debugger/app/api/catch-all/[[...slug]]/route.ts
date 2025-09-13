import { NextRequest, NextResponse } from 'next/server';

async function handleRequest(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const url = new URL(request.url);

  let body: any = null;
  let bodyText = '';

  try {
    const contentType = request.headers.get('content-type') || '';

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType.includes('application/json')) {
        body = await request.json();
        bodyText = JSON.stringify(body, null, 2);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData);
        bodyText = new URLSearchParams(formData as any).toString();
      } else {
        bodyText = await request.text();
        body = bodyText || null;
      }
    }
  } catch (error) {
    bodyText = `[Error reading body: ${error}]`;
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const requestInfo = {
    timestamp,
    method: request.method,
    url: request.url,
    pathname: url.pathname,
    search: url.search,
    searchParams: Object.fromEntries(url.searchParams),
    headers,
    body,
    bodyText,
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };

  return NextResponse.json(requestInfo, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    }
  });
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

export async function HEAD(request: NextRequest) {
  return handleRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleRequest(request);
}