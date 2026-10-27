import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Write refreshed tokens onto the request (for this render) and the
          // response (for the browser), so the session survives the next click.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if the access token expired. Must run before any
  // redirect logic below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  // /admin has its own passcode gate and doesn't need a student login.
  const isPublic =
    isAuthPage ||
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico";

  // Any redirect must carry over refreshed cookies, or the user gets logged out.
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && !isPublic) return redirectTo("/login");
  if (user && isAuthPage) return redirectTo("/dashboard");

  // First-run onboarding: a signed-in user with zero courses goes through
  // /onboarding first. Only checked on page loads, not server actions.
  if (user && !isPublic && request.method === "GET") {
    const isOnboarding = path === "/onboarding";
    const { count } = await supabase
      .from("courses")
      .select("id", { count: "exact", head: true });
    const hasCourses = (count ?? 0) > 0;

    if (!hasCourses && !isOnboarding) return redirectTo("/onboarding");
    if (hasCourses && isOnboarding) return redirectTo("/dashboard");
  }

  return response;
}
