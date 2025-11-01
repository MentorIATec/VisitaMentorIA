import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const session = await auth();
  const url = new URL(req.url);
  const pathname = url.pathname;

  const role = (session as any)?.role as 'admin' | 'mentor' | undefined;

  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  if (pathname.startsWith('/mentor')) {
    if (role !== 'mentor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/mentor/:path*']
};


