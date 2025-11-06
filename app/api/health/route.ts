import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    version: '0.1.0'
  });
}

