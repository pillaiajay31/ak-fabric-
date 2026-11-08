"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SessionUser, UserPermissions } from "@/lib/types";

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (key: keyof UserPermissions) => boolean;
  canAccessPath: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
  hasPermission: () => false,
  canAccessPath: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setUser(null);
    router.push("/login");
  };

  const hasPermission = useCallback(
    (key: keyof UserPermissions): boolean => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return Boolean(user.permissions && user.permissions[key]);
    },
    [user]
  );

  const canAccessPath = useCallback(
    (path: string): boolean => {
      if (!user) return false;
      if (user.role === "admin") return true;

      const p = user.permissions;
      if (!p) return false;

      if (path === "/") return p.productionDashboard;
      if (path.startsWith("/production")) return p.productionRollEntry;
      if (path.startsWith("/rejection")) return p.productionRejection;
      if (path === "/dispatch/new") return p.financeCreate;
      if (path.startsWith("/dispatch")) return p.financeView;
      if (path.startsWith("/masters/machines")) return p.masterMachines;
      if (path.startsWith("/masters/customers")) return p.masterCustomers;
      if (path.startsWith("/masters/company")) return p.masterCompany;
      if (path.startsWith("/masters/users")) return p.masterUsers;

      return true;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        refreshUser: fetchUser,
        hasPermission,
        canAccessPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
