import { auth } from "@/server/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");
  const isProtectedPage =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/play");

  const isHomePage = req.nextUrl.pathname === "/";

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/play", req.nextUrl));
  }

  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isHomePage && isLoggedIn) {
    console.log("redirecting to play");
    return Response.redirect(new URL("/play", req.nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|background-card.jpeg).*)",
  ],
};
