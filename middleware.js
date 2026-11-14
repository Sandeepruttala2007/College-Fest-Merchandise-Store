// Runs on the server before a page loads.
// Visitors without the login cookie are sent to /login for /profile and /dashboard.
// (The dashboard also checks for an admin account inside the page.)
import { NextResponse } from 'next/server';

export function middleware(request) {
  if (!request.cookies.get('lpu_session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/profile', '/dashboard'] };
