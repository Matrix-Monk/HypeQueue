import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if ((token && pathname === "/signin" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }


   if (
     !token &&
     (pathname.startsWith("/dashboard") ||
       pathname.startsWith("/room") ||
       pathname.startsWith("/profile"))
   ) {
     return NextResponse.redirect(new URL("/signin", req.url));
   }

  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/signup", "/dashboard/:path*", "/room/:path*"],
};
