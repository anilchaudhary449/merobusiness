import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Exclude API routes and the reset password page itself from redirection loop
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');
  const isResetPage = req.nextUrl.pathname === '/reset-password';
  const isPublicRoute = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register' || req.nextUrl.pathname === '/';

  if (token && (token as any).requirePasswordChange) {
    if (!isApiRoute && !isResetPage) {
      // Force user to reset their password
      return NextResponse.redirect(new URL('/reset-password', req.url));
    }
  }

  // Ensure unauthenticated users cannot access /reset-password
  if (!token && isResetPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
