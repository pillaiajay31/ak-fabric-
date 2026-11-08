import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

function handleLogout() {
  const response = NextResponse.json({
    success: true,
    message: "Signed out successfully",
  });

  const isProduction = process.env.NODE_ENV === "production";

  // Expire and clear the session cookie with exact matching attributes (path, secure, httpOnly)
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure: isProduction,
  });

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}


