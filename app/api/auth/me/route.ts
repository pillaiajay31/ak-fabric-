import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: true, data: null });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: true, data: null });
    }

    // Refresh against database to ensure latest role/permissions and active status
    const liveUser = await store.getUserById(session.id);
    if (!liveUser || !liveUser.isActive) {
      const res = NextResponse.json({ success: true, data: null });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: liveUser.id,
        username: liveUser.username,
        fullName: liveUser.fullName,
        role: liveUser.role,
        permissions: liveUser.permissions,
        phone: liveUser.phone,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

