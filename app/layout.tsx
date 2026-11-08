import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppLayout } from "@/components/AppLayout";

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
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
