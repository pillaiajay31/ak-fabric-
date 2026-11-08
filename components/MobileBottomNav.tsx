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

const mobileTabs = [
  {
    name: "Summary",
    href: "/",
    icon: LayoutDashboard,
    isActive: (p: string) => p === "/",
  },
  {
    name: "Roll Entry",
    href: "/production",
    icon: Layers,
    isActive: (p: string) => p.startsWith("/production"),
  },
  {
    name: "Rejections",
    href: "/rejection",
    icon: AlertOctagon,
    isActive: (p: string) => p.startsWith("/rejection"),
  },
  {
    name: "Finance",
    href: "/dispatch",
    icon: FileSpreadsheet,
    isActive: (p: string) => p.startsWith("/dispatch"),
  },
  {
    name: "Masters",
    href: "/masters/machines",
    icon: Settings,
    isActive: (p: string) => p.startsWith("/masters"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on print
  return (
    <div className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1 shadow-lg">
      <nav className="flex items-center justify-around">
        {mobileTabs.map((tab) => {
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

