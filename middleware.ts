import { clerkMiddleware, createRouteMatcher, } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in",
    "/sign-up",
    "/home"
]);

const isPublicApiRoute = createRouteMatcher([
    "/api/videos",
]);

export default clerkMiddleware( async(auth, req) => {
    const { userId } =  await auth();
    const currentUrl = new URL(req.url);
    const isAccessingDashboard = currentUrl.pathname === "/home";
    const isApiRequest = currentUrl.pathname.startsWith("/api");

    // Redirect to the home page if the user is signed in and trying to access a public page
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    // User isn't logged in
    if (!userId) {
        // User isn't logged in and is trying to access a protected route
        if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url));
        }

        // If req is for a protected API and the user is not logged in
        if (isApiRequest && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url));
        }
    }

    // If none of the conditions matched, proceed with the request
    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!.*\\..*\\..*|_next).*)", // Matches all routes except for files with a dot (like .js, .css, etc.) or _next
        "/", 
        "/(api|trpc)(.*)" // Matches all API routes
    ],
};