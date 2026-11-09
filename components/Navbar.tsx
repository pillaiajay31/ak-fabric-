"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  AlertOctagon,
  FileSpreadsheet,
  Settings,
  Building2,
  Users,
  Menu,
  X,
  ChevronDown,
  PlusCircle,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { UserPermissions } from "@/lib/types";

interface NavSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permissionKey: keyof UserPermissions;
}

interface NavSection {
  title: string;
  key: "production" | "finance" | "masters";
  isActive: (pathname: string) => boolean;
  items: NavSubItem[];
}

const allNavSections: NavSection[] = [
  {
    title: "Production",
    key: "production",
    isActive: (pathname) =>
      pathname === "/" ||
      pathname === "/production" ||
      pathname === "/rejection",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Overview, today's output & top machine",
        permissionKey: "productionDashboard",
      },
      {
        name: "Production Entry",
        href: "/production",
        icon: Layers,
        description: "Log weighed rolls & rapid batch mode",
        permissionKey: "productionRollEntry",
      },
      {
        name: "Rejection Entry",
        href: "/rejection",
        icon: AlertOctagon,
        description: "Record fabric scrap & quality defects",
        permissionKey: "productionRejection",
      },
    ],
  },
  {
    title: "Finance",
    key: "finance",
    isActive: (pathname) =>
      pathname.startsWith("/finance") || pathname.startsWith("/dispatch"),
    items: [
      {
        name: "Finance Dashboard",
        href: "/finance",
        icon: Receipt,
        description: "Month-to-date revenue, GST & invoice totals",
        permissionKey: "financeView",
      },
      {
        name: "Dispatch & Invoices",
        href: "/dispatch",
        icon: FileSpreadsheet,
        description: "All delivery challans & GST invoices",
        permissionKey: "financeView",
      },
      {
        name: "Create New Dispatch",
        href: "/dispatch/new",
        icon: PlusCircle,
        description: "Issue challan & tax invoice for transport",
        permissionKey: "financeCreate",
      },
    ],
  },
  {
    title: "Master",
    key: "masters",
    isActive: (pathname) => pathname.startsWith("/masters"),
    items: [
      {
        name: "Machine Master",
        href: "/masters/machines",
        icon: Settings,
        description: "4 circular knitting units & targets",
        permissionKey: "masterMachines",
      },
      {
        name: "Customer Master",
        href: "/masters/customers",
        icon: Users,
        description: "Client GSTIN, addresses & routes",
        permissionKey: "masterCustomers",
      },
      {
        name: "Company Profile",
        href: "/masters/company",
        icon: Building2,
        description: "A.K. Fabric, Bank of Baroda & Silvassa info",
        permissionKey: "masterCompany",
      },
      {
        name: "User Master",
        href: "/masters/users",
        icon: ShieldCheck,
        description: "Staff accounts, passwords & access rights",
        permissionKey: "masterUsers",
      },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  // If on login page, hide navbar completely for the immersive split screen
  if (pathname === "/login") {
    return null;
  }

  // Filter sections by user permissions
  const navSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.permissionKey)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95"
      style={{
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
        willChange: "transform",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-semibold text-sm tracking-tight shadow-sm">
                KF
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight text-neutral-950 dark:text-white">
                  KnitFlow
                </span>
                <span className="text-[11px] font-medium tracking-wide uppercase text-neutral-500">
                  A.K. Fabric Silvassa
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation with Dropdowns */}
          <nav
            ref={navRef}
            className="hidden md:flex items-center gap-1.5"
            aria-label="Main Navigation"
          >
            {navSections.map((section) => {
              const isOpen = openDropdown === section.key;
              const isSectionActive = section.isActive(pathname);

              return (
                <div key={section.key} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(section.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                      isSectionActive
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-150",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute left-0 mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isItemActive =
                            item.href === "/"
                              ? pathname === "/"
                              : pathname === item.href;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpenDropdown(null)}
                              className={cn(
                                "flex items-start gap-3 p-2.5 rounded-lg text-xs transition-colors",
                                isItemActive
                                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold"
                                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                              )}
                            >
                              <div
                                className={cn(
                                  "p-1.5 rounded-md mt-0.5",
                                  isItemActive
                                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-neutral-950 dark:text-white">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-normal leading-tight">
                                  {item.description}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right User Badge & Sign Out Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2.5 pr-3 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="h-6 w-6 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px]">
                    {user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-xl z-50 space-y-1">
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs font-bold text-neutral-950 dark:text-white">
                        {user.fullName}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        @{user.username} · {user.role.toUpperCase()}
                      </div>
                    </div>

                    {hasPermission("masterUsers") && (
                      <Link
                        href="/masters/users"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Manage Users</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-4 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
                  {user.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-950 dark:text-white">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">
                    {user.role} · @{user.username}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
              >
                <LogOut className="h-3 w-3" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {navSections.map((section) => (
            <div key={section.key} className="space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-2 py-0.5">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isItemActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors",
                        isItemActive
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.name}</span>
                        <span
                          className={cn(
                            "text-[10px]",
                            isItemActive
                              ? "text-neutral-300 dark:text-neutral-600"
                              : "text-neutral-500"
                          )}
                        >
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Horizontal Section Pill Bar (When Hamburger is closed) */}
      {!mobileMenuOpen && navSections.length > 0 && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/60 px-3 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {navSections.map((section) => {
            const isSectionActive = section.isActive(pathname);
            const defaultHref = section.items[0].href;

            return (
              <Link
                key={section.key}
                href={defaultHref}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                  isSectionActive
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                )}
              >
                <span>{section.title}</span>
                <span className="text-[10px] opacity-60">
                  ({section.items.length})
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
