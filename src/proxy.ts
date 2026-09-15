import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const clerkProxy = clerkMiddleware(
  async (_auth, request) => {
    if (request.nextUrl.pathname === "/api/stripe/webhook") {
      return NextResponse.next({ request });
    }
    return updateSupabaseSession(request);
  },
  { frontendApiProxy: { enabled: true } }
);

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return clerkProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
