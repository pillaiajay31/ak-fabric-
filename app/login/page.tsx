"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, Eye, EyeOff, Loader2, X, ShieldCheck } from "lucide-react";
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRolesHelper, setShowRolesHelper] = useState(false);

  const performLogin = async (loginUser: string, loginPass: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUser.trim(),
          password: loginPass.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Authentication failed. Check credentials.");
        return;
      }

      await refreshUser();

      // Smart redirect based on role permissions
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
      setError((err as Error).message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both email/username and password.");
      return;
    }
    performLogin(username, password);
  };

  const handleAdminQuickLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setUsername("admin");
    setPassword("admin");
    performLogin("admin", "admin");
  };

  const fillQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    performLogin(u, p);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-between h-full min-h-[580px] py-4">
      {/* Brand & Titles matching reference */}
      <div className="text-center">
        {/* Yarn Spool Logo Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-md bg-[#232228] p-1 border border-[#343340]">
            <Image
              src="/images/ak-spool-logo.jpg"
              alt="AK Fabric Spool Logo"
              width={80}
              height={80}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
          AK Fabric
        </h1>

        {/* Subtitles */}
        <div className="mt-2.5 space-y-0.5">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-100 tracking-tight">
            AK Fabric Login
          </h2>
          <p className="text-xs text-neutral-400 font-normal">or</p>
          <p className="text-sm font-medium text-neutral-300">Partner Portal</p>
        </div>
      </div>

      {/* Main Login Form */}
      <div className="my-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-xs font-medium border border-red-500/30 bg-red-950/60 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email / Username Input */}
          <div className="relative">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoComplete="username email"
              autoCapitalize="none"
              spellCheck="false"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email"
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#272730] border border-[#383745] hover:border-[#4f4d61] focus:border-[#196eef] focus:ring-1 focus:ring-[#196eef] text-white placeholder-neutral-400 text-base sm:text-sm outline-none transition-colors"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-11 py-3 rounded-lg bg-[#272730] border border-[#383745] hover:border-[#4f4d61] focus:border-[#196eef] focus:ring-1 focus:ring-[#196eef] text-white placeholder-neutral-400 text-base sm:text-sm outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Primary Action Button: Electric Royal Blue */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 px-4 rounded-lg bg-[#196eef] hover:bg-[#1660d2] active:bg-[#124fae] text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer Navigation Links matching reference */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex flex-col items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-neutral-400 hover:text-neutral-200 underline underline-offset-4 cursor-pointer transition-colors"
          >
            Privacy Policy
          </button>

          <button
            type="button"
            onClick={handleAdminQuickLogin}
            disabled={loading}
            className="text-neutral-400 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
          >
            Sign In As Admin
          </button>
        </div>

        {/* Optional Demo Floor Accounts Toggle */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setShowRolesHelper(!showRolesHelper)}
            className="text-[11px] text-neutral-400 hover:text-neutral-300 font-medium tracking-wide transition-colors"
          >
            {showRolesHelper ? "Hide mill test accounts" : "Switch mill test accounts"}
          </button>

          {showRolesHelper && (
            <div className="mt-2.5 p-2 rounded-lg bg-[#1a1920] border border-[#2e2d38] grid grid-cols-3 gap-1.5 text-center text-xs">
              <button
                type="button"
                onClick={() => fillQuickAccount("admin", "admin")}
                className="p-1.5 rounded bg-[#26252f] hover:bg-[#32313f] text-neutral-200 transition-colors"
              >
                <div className="font-semibold text-[11px]">Admin</div>
                <div className="text-[9px] text-neutral-400 font-mono">admin</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("supervisor", "supervisor")}
                className="p-1.5 rounded bg-[#26252f] hover:bg-[#32313f] text-neutral-200 transition-colors"
              >
                <div className="font-semibold text-[11px]">Supervisor</div>
                <div className="text-[9px] text-neutral-400 font-mono">supervisor</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("operator", "operator")}
                className="p-1.5 rounded bg-[#26252f] hover:bg-[#32313f] text-neutral-200 transition-colors"
              >
                <div className="font-semibold text-[11px]">Operator</div>
                <div className="text-[9px] text-neutral-400 font-mono">operator</div>
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-neutral-400 pt-2 font-mono">
          A.K. Fabric Silvassa · Operations Portal
        </p>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1d25] border border-[#353342] rounded-2xl max-w-md w-full p-6 text-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2c38]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">A.K. Fabric Privacy Policy</h3>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-[#2b2a36]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-neutral-300 max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>Internal Operations Security:</strong> Access to this system is restricted to authorized personnel of A.K. Fabric, Silvassa (D.N.H.).
              </p>
              <p>
                <strong>Data Logging:</strong> All production roll entries, rejection logs, delivery challans, and GST tax invoices are recorded with user timestamps and staff IDs for auditing purposes.
              </p>
              <p>
                <strong>Security:</strong> All credentials and session tokens are encrypted. Do not share your staff credentials or write passwords on machines or floor clipboards.
              </p>
              <p>
                <strong>Inquiries:</strong> Contact the mill administration office or system administrator for account provisioning or password resets.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-2.5 rounded-lg bg-[#196eef] hover:bg-[#1660d2] text-white font-medium text-xs transition-colors"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#201f26]">
      {/* Left Column: Dark Clean Login Panel matching reference */}
      <div className="w-full lg:w-[460px] xl:w-[500px] shrink-0 min-h-screen flex flex-col justify-center px-6 sm:px-12 py-10 bg-[#201f26] border-r border-[#2d2b36] z-10">
        <Suspense
          fallback={
            <div className="flex items-center justify-center text-xs text-neutral-400 py-20">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Column: High-tech Isometric Factory Scene matching reference */}
      <div className="hidden lg:flex flex-1 relative bg-[#2a3848] overflow-hidden min-h-screen items-center justify-center">
        <Image
          src="/images/factory-isometric.jpg"
          alt="A.K. Fabric Textile Production Mill Isometric"
          fill
          priority
          sizes="(min-width: 1024px) calc(100vw - 460px), 100vw"
          className="object-cover object-center select-none"
        />
        {/* Subtle dark gradient overlay on left seam to blend with left panel */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#201f26] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
