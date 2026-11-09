"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  AlertOctagon,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  // Hide on login page or print mode
  if (pathname === "/login") {
    return null;
  }

  const allTabs = [
    {
      name: "Summary",
      href: "/",
      icon: LayoutDashboard,
      isActive: (p: string) => p === "/",
      visible: hasPermission("productionDashboard"),
    },
    {
      name: "Roll Entry",
      href: "/production",
      icon: Layers,
      isActive: (p: string) => p.startsWith("/production"),
      visible: hasPermission("productionRollEntry"),
    },
    {
      name: "Rejections",
      href: "/rejection",
      icon: AlertOctagon,
      isActive: (p: string) => p.startsWith("/rejection"),
      visible: hasPermission("productionRejection"),
    },
    {
      name: "Finance",
      href: "/finance",
      icon: FileSpreadsheet,
      isActive: (p: string) => p.startsWith("/finance") || p.startsWith("/dispatch"),
      visible: hasPermission("financeView"),
    },
    {
      name: "Masters",
      href: "/masters/machines",
      icon: Settings,
      isActive: (p: string) => p.startsWith("/masters"),
      visible:
        hasPermission("masterMachines") ||
        hasPermission("masterCustomers") ||
        hasPermission("masterCompany") ||
        hasPermission("masterUsers"),
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.visible);
  if (visibleTabs.length === 0) return null;

  return (
    <div
      className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 pt-1 shadow-lg"
      style={{
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
        willChange: "transform",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 8px))",
      }}
    >
      <nav className="flex items-center justify-around">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive(pathname);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all min-w-[58px]",
                active
                  ? "text-neutral-950 dark:text-white font-bold"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-md transition-colors",
                  active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-500"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
