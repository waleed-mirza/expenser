import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/api/auth",
  "/manifest.json",
  "/sw.js",
  "/icons",
  "/images",
  "/logo.png",
  "/offline",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/signin" || pathname === "/signup";

  if (!isAuthPage && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Already signed in: skip the auth pages.
  if (isAuthPage) {
    return token
      ? NextResponse.redirect(new URL("/dashboard", req.url))
      : NextResponse.next();
  }

  if (!token) {
    // API clients (incl. the offline sync) need a status code, not an HTML redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
