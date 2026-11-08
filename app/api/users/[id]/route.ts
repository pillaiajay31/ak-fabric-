import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { ROLE_PRESETS, UserPermissions, UserRole } from "@/lib/types";

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await verifyAdminOrUserMasterPermission();
    if (!caller) {
      return NextResponse.json(
        { success: false, error: "Access denied. Master Users permission required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await store.getUserById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (body.fullName !== undefined) updates.fullName = body.fullName.trim();
    if (body.phone !== undefined) updates.phone = body.phone.trim();
    if (body.isActive !== undefined) {
      // Prevent deactivating own account if admin
      if (caller.id === id && body.isActive === false) {
        return NextResponse.json(
          { success: false, error: "You cannot deactivate your own active session." },
          { status: 400 }
        );
      }
      updates.isActive = Boolean(body.isActive);
    }

    if (body.role !== undefined) {
      const userRole: UserRole = body.role;
      updates.role = userRole;

      if (userRole === "custom" && body.permissions) {
        updates.permissions = {
          productionDashboard: Boolean(body.permissions.productionDashboard),
          productionRollEntry: Boolean(body.permissions.productionRollEntry),
          productionRejection: Boolean(body.permissions.productionRejection),
          financeView: Boolean(body.permissions.financeView),
          financeCreate: Boolean(body.permissions.financeCreate),
          masterMachines: Boolean(body.permissions.masterMachines),
          masterCustomers: Boolean(body.permissions.masterCustomers),
          masterCompany: Boolean(body.permissions.masterCompany),
          masterUsers: Boolean(body.permissions.masterUsers),
        };
      } else if (ROLE_PRESETS[userRole]) {
        updates.permissions = ROLE_PRESETS[userRole];
      }
    } else if (body.permissions && existing.role === "custom") {
      updates.permissions = {
        ...existing.permissions,
        ...body.permissions,
      };
    }

    if (body.password && body.password.trim().length > 0) {
      updates.password = body.password.trim();
    }

    const updated = await store.updateUser(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update user." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        role: updated.role,
        permissions: updated.permissions,
        isActive: updated.isActive,
        phone: updated.phone,
        createdAt: updated.createdAt,
        lastLoginAt: updated.lastLoginAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await verifyAdminOrUserMasterPermission();
    if (!caller) {
      return NextResponse.json(
        { success: false, error: "Access denied. Master Users permission required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (caller.id === id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account while logged in." },
        { status: 400 }
      );
    }

    const users = await store.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Check if this is the only admin
    if (target.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin" && u.isActive).length;
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the sole Administrator account." },
          { status: 400 }
        );
      }
    }

    const deleted = await store.deleteUser(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete user." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

