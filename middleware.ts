import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


const isPublicRoute = createRouteMatcher([
    "/",
    "/signin",
    "/signup",
    "/home"
    ]);
const isPublicApiRoute = createRouteMatcher([
    "/api/videos",
    ]);

export default clerkMiddleware((auth,req)=>{
    const {userId} =auth();
    const currentUrl = new URL(req.url)
    const isAccessingDashboard  =currentUrl.pathname === "/home"
    const isApiRequest =currentUrl.pathname.startsWith("/api")

// Redirect to the home page if the user is signed in and trying to access a public page
    if(userId && isPublicRoute(req) && !isAccessingDashboard){
        return {
            NextResponse.redirect(new URL("/home",req.url))
        }
    }
//not logged in
    if(!userId){
        //user isn't logged in and is trying to access a protected route
        if(!isPublicRoute(req) && !isPublicApiRoute(req)){
           return NextResponse.redirect(new URL("/signin",req.url))
        }
        //if req is for a protected api and the user is not logged in
        if(isApiRequest && ! isPublicApiRoute(req)){
            return NextResponse.redirect(new URL("/signin",req.url))  
        }

    return NextResponse.next();
}
});

export const config = {
  matcher: [
    "/((?!.*\\..*\\..*|_next).*)","/","/(api|trpc)(.*)"
  ],
};



/*
createRouteMatcher -string  matching -public routes | private routes identified by the ClerkProvider
*/