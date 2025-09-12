import { NextRequest, NextResponse } from 'next/server';

async function handler(req: NextRequest) {
  const bodyText = await req.text().catch(() => '');
  const res = {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    body: bodyText,
  };
  return NextResponse.json(res);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

