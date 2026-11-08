"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full bg-[#201f26] text-white">
        {children}
      </main>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950" />
        }
      >
        <Navbar />
      </Suspense>

      {/* Main Content with bottom padding for mobile bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <footer className="hidden md:block border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>A.K. Fabric Silvassa — Production & Dispatch Platform</span>
          <span>Subject to Silvassa Jurisdiction</span>
        </div>
      </footer>

      {/* Dedicated Mobile Bottom App Bar */}
      <MobileBottomNav />
    </>
  );
}

