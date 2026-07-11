import { type NextRequest, NextResponse } from "next/server";
import {
  LOCAL_SESSION_COOKIE,
  verifyLocalSessionToken,
  isSupabaseConfigured,
} from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;
  const isAuthed = await verifyLocalSessionToken(token);

  if (pathname.startsWith("/write") && !isAuthed) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isAuthed) {
    const writeUrl = request.nextUrl.clone();
    writeUrl.pathname = "/write";
    writeUrl.search = "";
    return NextResponse.redirect(writeUrl);
  }

  if (isSupabaseConfigured()) {
    const { updateSession } = await import("@/lib/supabase/middleware");
    return updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
