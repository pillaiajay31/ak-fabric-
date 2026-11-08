import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "KnitFlow - Textile Production & Dispatch System | A.K. Fabric",
  description:
    "Textile production tracking, roll weighing, delivery challans, and GST tax invoice generation for A.K. Fabric Silvassa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50/50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
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
      </body>
    </html>
  );
}
