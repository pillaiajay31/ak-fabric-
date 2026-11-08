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
  Truck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavSection {
  title: string;
  key: "production" | "finance" | "masters";
  isActive: (pathname: string) => boolean;
  items: NavSubItem[];
}

const navSections: NavSection[] = [
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
      },
      {
        name: "Production Entry",
        href: "/production",
        icon: Layers,
        description: "Log weighed rolls & rapid batch mode",
      },
      {
        name: "Rejection Entry",
        href: "/rejection",
        icon: AlertOctagon,
        description: "Record fabric scrap & quality defects",
      },
    ],
  },
  {
    title: "Finance",
    key: "finance",
    isActive: (pathname) => pathname.startsWith("/dispatch"),
    items: [
      {
        name: "Dispatch & Invoices",
        href: "/dispatch",
        icon: FileSpreadsheet,
        description: "All delivery challans & GST invoices",
      },
      {
        name: "Create New Dispatch",
        href: "/dispatch/new",
        icon: PlusCircle,
        description: "Issue challan & tax invoice for transport",
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
      },
      {
        name: "Customer Master",
        href: "/masters/customers",
        icon: Users,
        description: "Client GSTIN, addresses & routes",
      },
      {
        name: "Company Profile",
        href: "/masters/company",
        icon: Building2,
        description: "A.K. Fabric, Bank of Baroda & Silvassa info",
      },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95">
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
                        : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800",
                      isOpen && !isSectionActive && "bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white"
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

                  {/* Dropdown Popover */}
                  {isOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="text-[10px] uppercase font-semibold text-neutral-400 px-3 py-1.5">
                        {section.title} Section
                      </div>
                      <div className="space-y-0.5">
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
                              className={cn(
                                "flex items-start gap-2.5 p-2 rounded-lg text-xs transition-colors",
                                isItemActive
                                  ? "bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-950 dark:text-white"
                                  : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                              )}
                            >
                              <div className="h-6 w-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 text-neutral-700 dark:text-neutral-300">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-neutral-900 dark:text-white">
                                  {item.name}
                                </span>
                                <span className="text-[11px] font-normal text-neutral-500 line-clamp-1">
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

          {/* Right Status Badge & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>4 Machines Active</span>
            </div>

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

      {/* Expandable Mobile Navigation Menu Grouped into the 3 Sections */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-4 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
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
      {!mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/60 px-3 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {navSections.map((section) => {
            const isSectionActive = section.isActive(pathname);
            // First item link as fallback or top item
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
