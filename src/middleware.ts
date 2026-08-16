import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the auth session on every request and guards /app.
 *
 * The portal (/o/*) is deliberately NOT protected — the whole point
 * is that a client reaches it with no account. Its security is the
 * unguessable token plus an email-code gate on the agreement and
 * payment steps, enforced server-side.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Until the environment is wired up the app runs on mock data.
  // Without this guard every route would 500 on a fresh clone.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser, not getSession: it revalidates the token with the auth
  // server. getSession trusts a cookie that can be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/app") || path === "/welcome";

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // Send them back where they were headed after signing in.
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const app = request.nextUrl.clone();
    app.pathname = "/app";
    app.search = "";
    return NextResponse.redirect(app);
  }

  return response;
}

export const config = {
  matcher: [
    /**
     * Everything except static assets and image files. Notably this
     * DOES cover /o/* — the portal needs its session cookie refreshed
     * for the email-verification gate, it just isn't login-guarded.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
