"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface SharePdfOptions {
  elementId?: string;
  fallbackUrl?: string;
  fileName: string;
  shareTitle: string;
  shareMessage: string;
}

/**
 * Capture an HTML printable document element and generate an A4 PDF Blob & File.
 */
export async function generatePdfBlob(
  elementId: string,
  fileName: string
): Promise<{ blob: Blob; file: File } | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF generation.`);
    return null;
  }

  // Ensure high quality rendering with full width on both mobile and desktop
  const canvas = await html2canvas(element, {
    scale: 2, // 2x retina sharpness
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: Math.max(element.scrollWidth, 1000),
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = 210; // A4 standard width (mm)
  const pdfHeight = 297; // A4 standard height (mm)
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
  heightLeft -= pdfHeight;

  // Additional pages if document exceeds 1 page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;
  }

  const blob = pdf.output("blob");
  const safeFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const file = new File([blob], safeFileName, { type: "application/pdf" });

  return { blob, file };
}

/**
 * Downloads the PDF directly to device.
 */
export async function downloadPdfFromElement(
  elementId: string,
  fileName: string
): Promise<boolean> {
  try {
    const result = await generatePdfBlob(elementId, fileName);
    if (!result) return false;

    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Failed to download PDF", error);
    return false;
  }
}

/**
 * Shares the PDF directly via WhatsApp using Web Share API (mobile) or WhatsApp Web (desktop).
 */
export async function sharePdfToWhatsApp(options: SharePdfOptions): Promise<boolean> {
  const { elementId, fallbackUrl, fileName, shareTitle, shareMessage } = options;

  try {
    let pdfFile: File | null = null;

    if (elementId) {
      const result = await generatePdfBlob(elementId, fileName);
      if (result) {
        pdfFile = result.file;
      }
    }

    // 1. Mobile Web Share API with PDF file attached (Android Chrome & iOS Safari)
    if (
      pdfFile &&
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [pdfFile] })
    ) {
      await navigator.share({
        files: [pdfFile],
        title: shareTitle,
        text: shareMessage,
      });
      return true;
    }

    // 2. Fallback for desktop or non-file-sharing environments:
    // Download the PDF automatically so the user has the file ready to drag-and-drop
    if (elementId) {
      await downloadPdfFromElement(elementId, fileName);
    }

    // Open WhatsApp with pre-filled message
    const messageWithLink = `${shareMessage}\n\n*Please find the attached official PDF document.*`;

    const encoded = encodeURIComponent(messageWithLink);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, "_blank");
    return true;
  } catch (error) {
    // If user cancelled Web Share dialog, ignore AbortError
    if ((error as Error)?.name === "AbortError") {
      return true;
    }
    console.error("Failed to share PDF", error);
    return false;
  }
}

