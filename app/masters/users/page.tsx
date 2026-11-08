"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  Check,
  X,
  Lock,
  Phone,
  Search,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";
import { UserAccount, UserRole, UserPermissions, ROLE_PRESETS } from "@/lib/types";

const ROLE_LABELS: Record<UserRole, { label: string; desc: string }> = {
  admin: {
    label: "Administrator",
    desc: "Complete, unrestricted access across all production, finance, and master records.",
  },
  supervisor: {
    label: "Production Supervisor",
    desc: "Access to production dashboard, roll weighing, rejection logs, and machine parameters.",
  },
  finance: {
    label: "Finance & Dispatch",
    desc: "Access to summary dashboard, delivery challans, tax invoices, and customer accounts.",
  },
  operator: {
    label: "Machine Operator",
    desc: "Restricted exclusively to floor roll entry and weighing on the factory floor.",
  },
  custom: {
    label: "Custom Access",
    desc: "Tailored permissions configured manually per workspace module.",
  },
};

const PERMISSION_DEFINITIONS: {
  key: keyof UserPermissions;
  category: "Production" | "Finance" | "Master";
  label: string;
  desc: string;
}[] = [
  {
    key: "productionDashboard",
    category: "Production",
    label: "Summary Dashboard",
    desc: "View factory output KPIs, machine output graphs, and date range filters.",
  },
  {
    key: "productionRollEntry",
    category: "Production",
    label: "Roll Production Entry",
    desc: "Log roll weights, shifts, and batch entries for Machines A, B, C, D.",
  },
  {
    key: "productionRejection",
    category: "Production",
    label: "Defect & Rejection Log",
    desc: "Document fabric defects, needle drops, oil stains, and wastage scrap.",
  },
  {
    key: "financeView",
    category: "Finance",
    label: "Dispatch & Invoices View",
    desc: "Inspect dispatch records, view Delivery Challans, and print Tax Invoices.",
  },
  {
    key: "financeCreate",
    category: "Finance",
    label: "Create New Dispatch",
    desc: "Select in-stock rolls, assign transporter/vehicle, and generate challan/invoice.",
  },
  {
    key: "masterMachines",
    category: "Master",
    label: "Machine Master",
    desc: "Add or edit circular knitting machines, roll prefixes, and target quotas.",
  },
  {
    key: "masterCustomers",
    category: "Master",
    label: "Customer Master",
    desc: "Manage customer GSTIN, delivery addresses, and default transport info.",
  },
  {
    key: "masterCompany",
    category: "Master",
    label: "Company Profile",
    desc: "Update company GSTIN, jurisdiction, bank account, and default tax rates.",
  },
  {
    key: "masterUsers",
    category: "Master",
    label: "User Master & Access Control",
    desc: "Create staff accounts, reset passwords, and assign role permissions.",
  },
];

export default function UserMasterPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("operator");
  const [permissions, setPermissions] = useState<UserPermissions>(
    ROLE_PRESETS.operator
  );
  const [isActive, setIsActive] = useState(true);
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Check permission
  const canManageUsers = hasPermission("masterUsers");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      } else {
        setMessage({ type: "error", text: json.error || "Failed to load users." });
      }
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  if (!canManageUsers) {
    return (
      <AccessDenied
        requiredPermission="masterUsers"
        moduleName="User Master & Access Control"
      />
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setUsername("");
    setFullName("");
    setPassword("");
    setRole("operator");
    setPermissions(ROLE_PRESETS.operator);
    setIsActive(true);
    setPhone("");
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserAccount) => {
    setEditingId(u.id);
    setUsername(u.username);
    setFullName(u.fullName);
    setPassword(""); // Leave blank unless changing
    setRole(u.role);
    setPermissions(u.permissions || ROLE_PRESETS[u.role] || ROLE_PRESETS.operator);
    setIsActive(u.isActive);
    setPhone(u.phone || "");
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole !== "custom") {
      setPermissions(ROLE_PRESETS[newRole]);
    }
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
    setRole("custom");
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setMessage({ type: "error", text: "Username and full name are required." });
      return;
    }

    if (!editingId && !password.trim()) {
      setMessage({ type: "error", text: "Password is required for new users." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const payload = {
        username: username.trim(),
        fullName: fullName.trim(),
        password: password.trim() ? password.trim() : undefined,
        role,
        permissions,
        isActive,
        phone: phone.trim(),
      };

      if (editingId) {
        const res = await fetch(`/api/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: "success", text: `User "${fullName}" updated.` });
          resetForm();
          loadUsers();
        } else {
          setMessage({ type: "error", text: json.error || "Update failed." });
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({
            type: "success",
            text: `New user account "${fullName}" created.`,
          });
          resetForm();
          loadUsers();
        } else {
          setMessage({ type: "error", text: json.error || "Creation failed." });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: UserAccount) => {
    if (!confirm(`Are you sure you want to remove user "${u.fullName}" (@${u.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `User "${u.fullName}" removed.` });
        loadUsers();
      } else {
        setMessage({ type: "error", text: json.error || "Failed to delete user." });
      }
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            User Master & Permissions
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage factory user logins, access roles, and granular workspace permissions
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
            message.type === "success"
              ? "bg-neutral-100 border-neutral-300 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, username, or role..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:outline-none"
          />
        </div>
        <span className="text-xs text-neutral-500 font-medium">
          {filteredUsers.length} user accounts registered
        </span>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500">
          Loading user accounts...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-xs text-neutral-500">
          No users match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const isSelf = currentUser?.id === u.id;
            return (
              <div
                key={u.id}
                className={`rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
                  u.isActive
                    ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                    : "bg-neutral-50 dark:bg-neutral-950/60 border-neutral-200/60 dark:border-neutral-800/60 opacity-75"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Role & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm">
                        {u.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-950 dark:text-white flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </h3>
                        <span className="text-xs font-mono text-neutral-500">
                          @{u.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.isActive
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        }`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge & Description */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Access Role:</span>
                      <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                        {ROLE_LABELS[u.role]?.label || u.role}
                      </span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-neutral-500">Phone:</span>
                        <span className="font-mono text-neutral-700 dark:text-neutral-300">
                          {u.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Permissions Pills Overview */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                      Granted Modules
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {u.permissions?.productionDashboard && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Dashboard
                        </span>
                      )}
                      {u.permissions?.productionRollEntry && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Roll Entry
                        </span>
                      )}
                      {u.permissions?.productionRejection && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Rejections
                        </span>
                      )}
                      {u.permissions?.financeView && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Finance View
                        </span>
                      )}
                      {u.permissions?.financeCreate && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          New Dispatch
                        </span>
                      )}
                      {u.permissions?.masterMachines && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Machines
                        </span>
                      )}
                      {u.permissions?.masterCustomers && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Customers
                        </span>
                      )}
                      {u.permissions?.masterCompany && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Company
                        </span>
                      )}
                      {u.permissions?.masterUsers && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          User Master
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    {u.lastLoginAt
                      ? `Active ${new Date(u.lastLoginAt).toLocaleDateString()}`
                      : "Never logged in"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="Edit Account & Permissions"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/40 text-neutral-500 hover:text-red-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-neutral-950 dark:text-white">
                  {editingId ? "Edit User Account & Access" : "Create New User Account"}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Set user identity, login password, and individual permissions
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                    Username / Login ID
                  </label>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    disabled={Boolean(editingId)}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. rajesh or shift_a"
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-mono font-medium disabled:opacity-60"
                  />
                  {editingId && (
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Username cannot be changed after creation.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                    Full Name & Staff Title
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Patel (Floor Head)"
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                    {editingId ? "New Password (Leave blank to keep)" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 absolute left-3 top-3.5 text-neutral-400" />
                    <input
                      type="text"
                      required={!editingId}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingId ? "Unchanged" : "Enter password"}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                    Phone / Contact Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="h-3.5 w-3.5 absolute left-3 top-3.5 text-neutral-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98251 00000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Role Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                  Access Role Preset
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-semibold"
                >
                  <option value="admin">Administrator (Complete access to all modules)</option>
                  <option value="supervisor">Production Supervisor (Floor, Machines, Rolls, Rejection)</option>
                  <option value="finance">Finance & Accounts (Dashboard, Dispatches, Challans, Invoices)</option>
                  <option value="operator">Machine Operator (Floor Roll Entry Only)</option>
                  <option value="custom">Custom (Manually configure permission checkboxes below)</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {ROLE_LABELS[role]?.desc}
                </p>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Module Access Permissions
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Toggling any permission switches role to Custom
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERMISSION_DEFINITIONS.map((def) => {
                    const checked = Boolean(permissions[def.key]);
                    return (
                      <label
                        key={def.key}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          checked
                            ? "border-neutral-900 bg-neutral-50/80 dark:border-white dark:bg-neutral-800/40"
                            : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handlePermissionToggle(def.key)}
                          className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 h-4 w-4"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <span>{def.label}</span>
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold bg-neutral-200/70 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                              {def.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 leading-tight">
                            {def.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Switch */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                    Account Status
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Disabled accounts cannot log in to the mill system
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {isActive ? "Active Account" : "Deactivated"}
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                    ? "Update User Account"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
