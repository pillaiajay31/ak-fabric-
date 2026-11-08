import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await store.getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "This user account has been deactivated. Please contact administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password || "");
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Update last login
    await store.updateLastLogin(user.id);

    const sessionPayload = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      data: sessionPayload,
      message: `Signed in as ${user.fullName}`,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
