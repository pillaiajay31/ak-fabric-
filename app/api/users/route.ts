import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { ROLE_PRESETS, UserPermissions, UserRole } from "@/lib/types";

// Helper to verify caller has user management permission
async function verifyAdminOrUserMasterPermission() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const liveUser = await store.getUserById(session.id);
  if (!liveUser || !liveUser.isActive) return null;
  if (liveUser.role === "admin" || liveUser.permissions?.masterUsers) {
    return liveUser;
  }
  return null;
}

export async function GET() {
  try {
    const caller = await verifyAdminOrUserMasterPermission();
    if (!caller) {
      return NextResponse.json(
        { success: false, error: "Access denied. Master Users permission required." },
        { status: 403 }
      );
    }

    const users = await store.getUsers();
    // Sanitize passwords before returning
    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      permissions: u.permissions,
      isActive: u.isActive,
      phone: u.phone,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }));

    return NextResponse.json({ success: true, data: safeUsers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const caller = await verifyAdminOrUserMasterPermission();
    if (!caller) {
      return NextResponse.json(
        { success: false, error: "Access denied. Master Users permission required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, password, fullName, role, permissions, phone, isActive } = body;

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: "Username, password, and full name are required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await store.getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username "${cleanUsername}" is already taken.` },
        { status: 400 }
      );
    }

    const userRole: UserRole = role || "operator";
    const userPermissions: UserPermissions =
      userRole === "custom" && permissions
        ? {
            productionDashboard: Boolean(permissions.productionDashboard),
            productionRollEntry: Boolean(permissions.productionRollEntry),
            productionRejection: Boolean(permissions.productionRejection),
            financeView: Boolean(permissions.financeView),
            financeCreate: Boolean(permissions.financeCreate),
            masterMachines: Boolean(permissions.masterMachines),
            masterCustomers: Boolean(permissions.masterCustomers),
            masterCompany: Boolean(permissions.masterCompany),
            masterUsers: Boolean(permissions.masterUsers),
          }
        : ROLE_PRESETS[userRole] || ROLE_PRESETS.operator;

    const created = await store.addUser({
      username: cleanUsername,
      password: password.trim(),
      fullName: fullName.trim(),
      role: userRole,
      permissions: userPermissions,
      isActive: isActive !== false,
      phone: phone ? phone.trim() : "",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          username: created.username,
          fullName: created.fullName,
          role: created.role,
          permissions: created.permissions,
          isActive: created.isActive,
          phone: created.phone,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
