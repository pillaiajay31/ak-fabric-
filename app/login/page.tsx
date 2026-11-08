"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Authentication failed. Check credentials.");
        return;
      }

      await refreshUser();

      // If redirected to home, check if operator who only has production access
      const userPermissions = json.data?.permissions;
      let target = redirectPath;
      if (target === "/" && userPermissions && !userPermissions.productionDashboard) {
        if (userPermissions.productionRollEntry) target = "/production";
        else if (userPermissions.financeView) target = "/dispatch";
        else if (userPermissions.masterMachines) target = "/masters/machines";
      }

      router.push(target);
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-base tracking-tight shadow-md mx-auto">
          KF
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
            KnitFlow
          </h1>
          <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase mt-0.5">
            A.K. Fabric Silvassa · Access Portal
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
            Sign In to Account
          </h2>
          <p className="text-xs text-neutral-500">
            Enter authorized mill operator or admin credentials
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs font-medium border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
              Username or Staff ID
            </label>
            <div className="relative">
              <User className="h-4 w-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or operator"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-medium focus:ring-1 focus:ring-neutral-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-medium focus:ring-1 focus:ring-neutral-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Helper for Admin/Floor */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block text-center">
            Default Access Credentials
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => fillQuickLogin("admin", "admin")}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <span className="block font-bold">Admin</span>
              <span className="text-[10px] text-neutral-400 font-mono">admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin("supervisor", "supervisor")}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <span className="block font-bold">Supervisor</span>
              <span className="text-[10px] text-neutral-400 font-mono">supervisor</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin("operator", "operator")}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <span className="block font-bold">Operator</span>
              <span className="text-[10px] text-neutral-400 font-mono">operator</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-400">
        A.K. Fabric · Silvassa Mill Operations Platform
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-xs text-neutral-500">Loading Login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
