import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

export const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/invites/(.*)",
  "/api/webhooks(.*)",
  "/api/v1/health",
  "/api/v1/trips/discover(.*)",
  "/api/v1/trips/public/(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/public/(.*)",
  "/story(.*)",
  "/discover(.*)",
  "/robots.txt",
  "/sitemap.xml",
]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
