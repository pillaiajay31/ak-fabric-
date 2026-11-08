"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthProvider";

interface AccessDeniedProps {
  requiredPermission?: string;
  moduleName?: string;
}

export function AccessDenied({
  requiredPermission,
  moduleName = "this section",
}: AccessDeniedProps) {
  const { user } = useAuth();

  // Find a landing route the user is permitted to use
  let fallbackUrl = "/login";
  let fallbackLabel = "Sign In";

  if (user) {
    if (user.permissions?.productionDashboard) {
      fallbackUrl = "/";
      fallbackLabel = "Summary Dashboard";
    } else if (user.permissions?.productionRollEntry) {
      fallbackUrl = "/production";
      fallbackLabel = "Roll Production Entry";
    } else if (user.permissions?.financeView) {
      fallbackUrl = "/dispatch";
      fallbackLabel = "Dispatch & Invoices";
    } else if (user.permissions?.masterMachines) {
      fallbackUrl = "/masters/machines";
      fallbackLabel = "Machine Master";
    } else {
      fallbackUrl = "/";
      fallbackLabel = "Home";
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center shadow-sm space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 mx-auto flex items-center justify-center">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-neutral-950 dark:text-white tracking-tight">
            Access Restricted
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Your account does not have permission to view {moduleName}.
            {user && (
              <span className="block mt-1 font-mono text-[11px] text-neutral-500">
                Logged in as: <strong className="text-neutral-900 dark:text-white">{user.fullName}</strong> ({user.role.toUpperCase()})
              </span>
            )}
          </p>
          {requiredPermission && (
            <p className="text-[11px] text-neutral-400 font-mono">
              Missing permission: {requiredPermission}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Link
            href={fallbackUrl}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go to {fallbackLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
