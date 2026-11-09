"use client";

import { useState } from "react";
import { Loader2, Share2, Download, Check } from "lucide-react";
import { sharePdfToWhatsApp, downloadPdfFromElement, SharePdfOptions } from "@/lib/sharePdf";

interface WhatsAppShareButtonProps {
  elementId?: string;
  fallbackUrl?: string;
  fileName: string;
  shareTitle: string;
  shareMessage: string;
  label?: string;
  variant?: "primary" | "secondary" | "icon" | "outline";
  showDownloadOption?: boolean;
}

export function WhatsAppShareButton({
  elementId,
  fallbackUrl,
  fileName,
  shareTitle,
  shareMessage,
  label = "Share on WhatsApp",
  variant = "primary",
  showDownloadOption = true,
}: WhatsAppShareButtonProps) {
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      setSharing(true);
      await sharePdfToWhatsApp({
        elementId,
        fallbackUrl,
        fileName,
        shareTitle,
        shareMessage,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!elementId) return;
    try {
      setDownloading(true);
      await downloadPdfFromElement(elementId, fileName);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Primary WhatsApp Share Button */}
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
          variant === "primary"
            ? "bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1da851] text-white shadow-emerald-500/20"
            : variant === "outline"
            ? "border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
            : "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        } ${sharing ? "opacity-75 cursor-wait" : ""}`}
      >
        {sharing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <svg
            className="h-3.5 w-3.5 shrink-0 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.153.57 4.17 1.564 5.91l-1.664 6.074 6.244-1.637c1.7 1.01 3.684 1.653 5.856 1.653 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
          </svg>
        )}
        <span>{sharing ? "Generating PDF..." : label}</span>
      </button>

      {/* Direct PDF Download Button */}
      {showDownloadOption && elementId && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          title="Download PDF directly"
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-xs"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
