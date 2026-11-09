"use client";

import jsPDF from "jspdf";
import { DeliveryChallan, TaxInvoice, CompanyProfile } from "./types";
import { formatIndianCurrency, formatDateIndian, numberToWordsIndian } from "./utils";

const DEFAULT_COMPANY: CompanyProfile = {
  name: "A.K. FABRIC",
  email: "akfabric17@gmail.com",
  phone: "9825123456",
  gstin: "26AGHPP8818L1ZQ",
  address: "Balaji Industrial Estate, Gala No 110, Survey No 113/2/7, Amli, Silvassa-396230, Dadra & Nagar Haveli",
  jurisdiction: "SILVASSA",
  bankName: "HDFC BANK",
  bankBranch: "SILVASSA BRANCH",
  bankAccountNo: "50200067891234",
  bankIfsc: "HDFC0000456",
  defaultRate: 42,
  defaultHsn: "998821",
  defaultDescription: "JOB WORK OF KNITTING GREY FABRIC",
};

/**
 * Generate a pixel-perfect, vector A4 PDF for Delivery Challan
 */
export function generateChallanPdf(
  challan: DeliveryChallan,
  companyProfile?: CompanyProfile | null
): jsPDF {
  const company = companyProfile || DEFAULT_COMPANY;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const left = 10;
  const right = 200;
  const width = right - left; // 190 mm
  const midX = 105;

  // Outer border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(left, 10, width, 277);

  // 1. Jurisdiction & Copy status
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `SUBJECT TO ${(company.jurisdiction || "SILVASSA").toUpperCase()} JURISDICTION`,
    left + 2,
    14
  );
  doc.setFont("helvetica", "bold");
  doc.text("[X] Original for Recipient", right - 2, 14, { align: "right" });
  doc.line(left, 16, right, 16);

  // 2. Company Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(company.name || "A.K. FABRIC", midX, 22.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Email: ${company.email || "akfabric17@gmail.com"} | GSTIN: ${company.gstin || "26AGHPP8818L1ZQ"}`,
    midX,
    26.5,
    { align: "center" }
  );

  const addressLines = doc.splitTextToSize(
    company.address || DEFAULT_COMPANY.address,
    width - 10
  );
  doc.text(addressLines, midX, 30.5, { align: "center" });
  doc.line(left, 34, right, 34);

  // 3. Document Title
  doc.setFillColor(242, 242, 242);
  doc.rect(left, 34, width, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("DELIVERY CHALLAN", midX, 38, { align: "center" });
  doc.line(left, 39.5, right, 39.5);

  // 4. Address of Delivery & Challan Meta
  doc.line(midX, 39.5, midX, 80);

  // Left: Customer details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Address of Delivery / Shipped To:", left + 2, 43.5);

  doc.setFontSize(8.5);
  doc.text(challan.customerName || "Customer", left + 2, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const custAddr = doc.splitTextToSize(challan.shippingAddress || "", 90);
  doc.text(custAddr, left + 2, 52);

  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: ${challan.customerGstin || "N/A"}`, left + 2, 77);

  // Right: Meta Table
  const metaRows = [
    { label: "Challan No:", val: String(challan.challanNo || "") },
    { label: "Date of Supply:", val: formatDateIndian(challan.challanDate) },
    { label: "Transport:", val: challan.transporter || "ROADWAYS" },
    { label: "Transport Mode:", val: challan.transportMode || "ROADWAYS" },
    { label: "Vehicle No:", val: challan.vehicleNo || "" },
    { label: "Place of Supply:", val: (challan.placeOfSupply || "SILVASSA").toUpperCase() },
    { label: "L.R. No:", val: challan.lrNo || "—" },
  ];

  let metaY = 39.5;
  const metaRowH = (80 - 39.5) / metaRows.length;
  metaRows.forEach((row, i) => {
    const yTop = metaY + i * metaRowH;
    const yBaseline = yTop + metaRowH * 0.7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(row.label, midX + 2, yBaseline);
    doc.setFont("helvetica", "bold");
    doc.text(row.val, right - 2, yBaseline, { align: "right" });
    if (i < metaRows.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(midX, yTop + metaRowH, right, yTop + metaRowH);
      doc.setDrawColor(0, 0, 0);
    }
  });

  doc.line(left, 80, right, 80);

  // 5. 3-Column Roll Grid Table
  const colWidth = width / 3; // 63.33 mm each
  const c1X = left;
  const c2X = left + colWidth;
  const c3X = left + colWidth * 2;

  // Header row
  doc.setFillColor(242, 242, 242);
  doc.rect(left, 80, width, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);

  [c1X, c2X, c3X].forEach((colStart) => {
    doc.text("Sr", colStart + 3, 83.5);
    doc.text("Roll No", colStart + 18, 83.5);
    doc.text("Net Wt", colStart + colWidth - 3, 83.5, { align: "right" });
  });

  doc.line(left, 85, right, 85);
  // Column dividers
  doc.line(c2X, 80, c2X, 225);
  doc.line(c3X, 80, c3X, 225);

  // Divide rolls into 3 columns
  const rolls = challan.rolls || [];
  const perCol = Math.max(1, Math.ceil(rolls.length / 3));
  const col1 = rolls.slice(0, perCol).map((r, i) => ({ sr: i + 1, ...r }));
  const col2 = rolls.slice(perCol, perCol * 2).map((r, i) => ({ sr: perCol + i + 1, ...r }));
  const col3 = rolls.slice(perCol * 2).map((r, i) => ({ sr: perCol * 2 + i + 1, ...r }));
  const maxRows = Math.min(30, Math.max(col1.length, col2.length, col3.length));

  const tableTop = 85;
  const tableBottom = 225;
  const rowHeight = Math.min(4.5, (tableBottom - tableTop) / Math.max(maxRows, 1));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);

  for (let idx = 0; idx < maxRows; idx++) {
    const y = tableTop + idx * rowHeight + rowHeight * 0.72;
    const r1 = col1[idx];
    const r2 = col2[idx];
    const r3 = col3[idx];

    if (r1) {
      doc.text(String(r1.sr), c1X + 3, y);
      doc.text(String(r1.rollNo), c1X + 16, y);
      doc.text(Number(r1.netWeight).toFixed(2), c1X + colWidth - 3, y, { align: "right" });
    }
    if (r2) {
      doc.text(String(r2.sr), c2X + 3, y);
      doc.text(String(r2.rollNo), c2X + 16, y);
      doc.text(Number(r2.netWeight).toFixed(2), c2X + colWidth - 3, y, { align: "right" });
    }
    if (r3) {
      doc.text(String(r3.sr), c3X + 3, y);
      doc.text(String(r3.rollNo), c3X + 16, y);
      doc.text(Number(r3.netWeight).toFixed(2), c3X + colWidth - 3, y, { align: "right" });
    }

    if (idx < maxRows - 1) {
      doc.setDrawColor(235, 235, 235);
      doc.line(left, tableTop + (idx + 1) * rowHeight, right, tableTop + (idx + 1) * rowHeight);
      doc.setDrawColor(0, 0, 0);
    }
  }

  // 6. Summary Block
  doc.line(left, 225, right, 225);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(
    `NO OF ROLLS : ${challan.totalRolls}        NO OF BAGS: ${challan.noOfBags || 1}`,
    left + 3,
    230
  );
  doc.text(
    `TOTAL WEIGHT: ${Number(challan.totalWeight).toFixed(2)} KG`,
    right - 3,
    230,
    { align: "right" }
  );

  doc.line(left, 233, right, 233);
  doc.setFontSize(7);
  doc.text(challan.machineSummaryText || "", left + 3, 237.5);

  doc.line(left, 241, right, 241);
  doc.text(
    challan.fabricQuality || "NYLON 44/10 KNITTED GREY FABRIC",
    left + 3,
    245.5
  );

  doc.line(left, 249, right, 249);

  // 7. Signatures
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Receiver's Signature", left + 4, 280);

  doc.setFont("helvetica", "bold");
  doc.text(`FOR ${(company.name || "A.K. FABRIC").toUpperCase()}`, right - 4, 256, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", right - 4, 280, { align: "right" });

  return doc;
}

/**
 * Generate a pixel-perfect, vector A4 PDF for Tax Invoice
 */
export function generateInvoicePdf(
  invoice: TaxInvoice,
  companyProfile?: CompanyProfile | null
): jsPDF {
  const company = companyProfile || DEFAULT_COMPANY;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const left = 10;
  const right = 200;
  const width = right - left; // 190 mm
  const midX = 105;

  // Outer border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(left, 10, width, 277);

  // 1. Jurisdiction & Copy status
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `SUBJECT TO ${(company.jurisdiction || "SILVASSA").toUpperCase()} JURISDICTION`,
    left + 2,
    14
  );
  doc.setFont("helvetica", "bold");
  doc.text("[X] Original for Recipient", right - 2, 14, { align: "right" });
  doc.line(left, 16, right, 16);

  // 2. Company Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(company.name || "A.K. FABRIC", midX, 22.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Email: ${company.email || "akfabric17@gmail.com"} | GSTIN: ${company.gstin || "26AGHPP8818L1ZQ"}`,
    midX,
    26.5,
    { align: "center" }
  );

  const addressLines = doc.splitTextToSize(
    company.address || DEFAULT_COMPANY.address,
    width - 10
  );
  doc.text(addressLines, midX, 30.5, { align: "center" });
  doc.line(left, 34, right, 34);

  // 3. Document Title
  doc.setFillColor(242, 242, 242);
  doc.rect(left, 34, width, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("TAX INVOICE", midX, 38, { align: "center" });
  doc.line(left, 39.5, right, 39.5);

  // 4. Recipient & Invoice Meta Section
  doc.line(midX, 39.5, midX, 80);

  // Left: Recipient
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("NAME & ADDRESS OF RECIPIENT (BILLED TO):", left + 2, 43.5);

  doc.setFontSize(8.5);
  doc.text(invoice.customerName || "Customer", left + 2, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const custAddr = doc.splitTextToSize(invoice.billingAddress || "", 90);
  doc.text(custAddr, left + 2, 52);

  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: ${invoice.customerGstin || "N/A"}`, left + 2, 77);

  // Right: Invoice Meta
  const metaRows = [
    { label: "Invoice No:", val: String(invoice.invoiceNo || "") },
    { label: "Invoice Date:", val: formatDateIndian(invoice.invoiceDate) },
    { label: "Transport Mode:", val: invoice.transportMode || "ROADWAYS" },
    { label: "Vehicle No:", val: invoice.vehicleNo || "" },
    { label: "Date of Supply:", val: formatDateIndian(invoice.dateOfSupply) },
    { label: "Place of Supply:", val: (invoice.placeOfSupply || "SILVASSA").toUpperCase() },
    { label: "L.R. No:", val: invoice.lrNo || "—" },
  ];

  let metaY = 39.5;
  const metaRowH = (80 - 39.5) / metaRows.length;
  metaRows.forEach((row, i) => {
    const yTop = metaY + i * metaRowH;
    const yBaseline = yTop + metaRowH * 0.7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(row.label, midX + 2, yBaseline);
    doc.setFont("helvetica", "bold");
    doc.text(row.val, right - 2, yBaseline, { align: "right" });
    if (i < metaRows.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(midX, yTop + metaRowH, right, yTop + metaRowH);
      doc.setDrawColor(0, 0, 0);
    }
  });

  doc.line(left, 80, right, 80);

  // 5. Item Particulars Table
  doc.setFillColor(242, 242, 242);
  doc.rect(left, 80, width, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);

  doc.text("Sr.", left + 2, 84);
  doc.text("Description of Goods / Services", left + 12, 84);
  doc.text("HSN/SAC", left + 92, 84);
  doc.text("Rolls", left + 115, 84);
  doc.text("Qty (KG)", left + 138, 84, { align: "right" });
  doc.text("Rate", left + 160, 84, { align: "right" });
  doc.text("Amount (Rs.)", right - 2, 84, { align: "right" });

  doc.line(left, 86, right, 86);

  // Main Item Row
  const itemTop = 86;
  const itemHeight = 35;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  doc.text("1", left + 3, itemTop + 6);
  const descLines = doc.splitTextToSize(
    invoice.description || "JOB WORK OF KNITTING GREY FABRIC",
    75
  );
  doc.text(descLines, left + 12, itemTop + 6);
  doc.text(invoice.hsnSac || "998821", left + 92, itemTop + 6);
  doc.text(String(invoice.noOfRolls || 0), left + 115, itemTop + 6);
  doc.text(Number(invoice.quantityKg).toFixed(2), left + 138, itemTop + 6, { align: "right" });
  doc.text(Number(invoice.ratePerKg).toFixed(2), left + 160, itemTop + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(formatIndianCurrency(invoice.taxableAmount), right - 2, itemTop + 6, { align: "right" });

  // Column vertical lines for particulars table
  const colX = [left + 8, left + 88, left + 108, left + 124, left + 144, left + 166];
  colX.forEach((cx) => doc.line(cx, 80, cx, itemTop + itemHeight));

  doc.line(left, itemTop + itemHeight, right, itemTop + itemHeight);

  // 6. GST Tax Summary Table
  const gstTop = itemTop + itemHeight; // 121 mm
  doc.setFillColor(242, 242, 242);
  doc.rect(left, gstTop, width, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);

  doc.text("HSN/SAC", left + 2, gstTop + 3.5);
  doc.text("Taxable Value", left + 35, gstTop + 3.5, { align: "right" });
  doc.text("CGST Rate", left + 52, gstTop + 3.5);
  doc.text("CGST Amt", left + 75, gstTop + 3.5, { align: "right" });
  doc.text("UTGST Rate", left + 92, gstTop + 3.5);
  doc.text("UTGST Amt", left + 117, gstTop + 3.5, { align: "right" });
  doc.text("IGST Rate", left + 134, gstTop + 3.5);
  doc.text("IGST Amt", left + 158, gstTop + 3.5, { align: "right" });
  doc.text("Total Tax", right - 2, gstTop + 3.5, { align: "right" });

  doc.line(left, gstTop + 5, right, gstTop + 5);

  // GST Values Row
  const totalGst =
    Number(invoice.cgstAmount || 0) +
    Number(invoice.utgstAmount || 0) +
    Number(invoice.igstAmount || 0);

  const cgstRateStr = !invoice.isInterState && Number(invoice.cgstAmount || 0) > 0 ? `${invoice.cgstRate}%` : "-";
  const cgstAmtStr = !invoice.isInterState && Number(invoice.cgstAmount || 0) > 0 ? formatIndianCurrency(invoice.cgstAmount) : "-";
  const utgstRateStr = !invoice.isInterState && Number(invoice.utgstAmount || 0) > 0 ? `${invoice.utgstRate}%` : "-";
  const utgstAmtStr = !invoice.isInterState && Number(invoice.utgstAmount || 0) > 0 ? formatIndianCurrency(invoice.utgstAmount) : "-";
  const igstRateStr = invoice.isInterState && Number(invoice.igstAmount || 0) > 0 ? `${invoice.igstRate}%` : "-";
  const igstAmtStr = invoice.isInterState && Number(invoice.igstAmount || 0) > 0 ? formatIndianCurrency(invoice.igstAmount) : "-";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const gstRowY = gstTop + 9.5;
  doc.text(invoice.hsnSac || "998821", left + 2, gstRowY);
  doc.text(formatIndianCurrency(invoice.taxableAmount), left + 35, gstRowY, { align: "right" });
  doc.text(cgstRateStr, left + 52, gstRowY);
  doc.text(cgstAmtStr, left + 75, gstRowY, { align: "right" });
  doc.text(utgstRateStr, left + 92, gstRowY);
  doc.text(utgstAmtStr, left + 117, gstRowY, { align: "right" });
  doc.text(igstRateStr, left + 134, gstRowY);
  doc.text(igstAmtStr, left + 158, gstRowY, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(formatIndianCurrency(totalGst), right - 2, gstRowY, { align: "right" });

  doc.line(left, gstTop + 13, right, gstTop + 13);

  // 7. Bank Details & Grand Total Calculations
  const splitY = gstTop + 13; // 134 mm
  const midSplitX = left + 115; // 125 mm
  doc.line(midSplitX, splitY, midSplitX, 240);

  // Left side: Bank Details & Amount in words
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Bank Details:", left + 3, splitY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`Bank Name: ${invoice.bankDetails?.bankName || company.bankName || DEFAULT_COMPANY.bankName}`, left + 3, splitY + 10);
  doc.text(`BRANCH: ${invoice.bankDetails?.branch || company.bankBranch || DEFAULT_COMPANY.bankBranch}`, left + 3, splitY + 14);
  doc.text(`A/C: ${invoice.bankDetails?.accountNo || company.bankAccountNo || DEFAULT_COMPANY.bankAccountNo}`, left + 3, splitY + 18);
  doc.text(`IFSC CODE: ${invoice.bankDetails?.ifsc || company.bankIfsc || DEFAULT_COMPANY.bankIfsc}`, left + 3, splitY + 22);

  doc.line(left, splitY + 26, midSplitX, splitY + 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Amount in Words:", left + 3, splitY + 31);
  const words = invoice.amountInWords || numberToWordsIndian(invoice.grandTotal);
  doc.setFontSize(6.5);
  const wordsLines = doc.splitTextToSize(words, 105);
  doc.text(wordsLines, left + 3, splitY + 36);

  // Right side: Financial breakdown
  const taxRows = [
    { label: "TOTAL TAXABLE", val: formatIndianCurrency(invoice.taxableAmount) },
    {
      label: !invoice.isInterState && Number(invoice.cgstAmount || 0) > 0 ? `CGST @ ${invoice.cgstRate}%` : "CGST",
      val: !invoice.isInterState && Number(invoice.cgstAmount || 0) > 0 ? formatIndianCurrency(invoice.cgstAmount) : "-",
    },
    {
      label: !invoice.isInterState && Number(invoice.utgstAmount || 0) > 0 ? `UTGST @ ${invoice.utgstRate}%` : "UTGST",
      val: !invoice.isInterState && Number(invoice.utgstAmount || 0) > 0 ? formatIndianCurrency(invoice.utgstAmount) : "-",
    },
    {
      label: invoice.isInterState && Number(invoice.igstAmount || 0) > 0 ? `IGST @ ${invoice.igstRate}%` : "IGST",
      val: invoice.isInterState && Number(invoice.igstAmount || 0) > 0 ? formatIndianCurrency(invoice.igstAmount) : "-",
    },
    {
      label: "Round OFF",
      val: invoice.roundOff >= 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2),
    },
  ];

  let calcY = splitY;
  const calcRowH = (230 - splitY) / taxRows.length;
  taxRows.forEach((row, idx) => {
    const rowTop = calcY + idx * calcRowH;
    const baseline = rowTop + calcRowH * 0.7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(row.label, midSplitX + 3, baseline);
    doc.setFont("helvetica", "bold");
    doc.text(row.val, right - 3, baseline, { align: "right" });
    doc.setDrawColor(225, 225, 225);
    doc.line(midSplitX, rowTop + calcRowH, right, rowTop + calcRowH);
    doc.setDrawColor(0, 0, 0);
  });

  // Grand Total Bar
  doc.setFillColor(242, 242, 242);
  doc.rect(midSplitX, 230, right - midSplitX, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("GRAND TOTAL", midSplitX + 3, 236.5);
  doc.setFontSize(9);
  doc.text(`Rs. ${formatIndianCurrency(invoice.grandTotal)}`, right - 3, 236.5, { align: "right" });

  doc.line(left, 240, right, 240);

  // 8. Signatures
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Receiver Signatory", left + 4, 280);

  doc.setFont("helvetica", "bold");
  doc.text(`FOR ${(company.name || "A.K. FABRIC").toUpperCase()}`, right - 4, 256, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", right - 4, 280, { align: "right" });

  return doc;
}

/**
 * Downloads the Delivery Challan PDF directly to device
 */
export function downloadChallanPdf(
  challan: DeliveryChallan,
  companyProfile?: CompanyProfile | null
): void {
  const doc = generateChallanPdf(challan, companyProfile);
  const fileName = `Delivery-Challan-${challan.challanNo}-AK-Fabric.pdf`;
  doc.save(fileName);
}

/**
 * Downloads the Tax Invoice PDF directly to device
 */
export function downloadInvoicePdf(
  invoice: TaxInvoice,
  companyProfile?: CompanyProfile | null
): void {
  const doc = generateInvoicePdf(invoice, companyProfile);
  const fileName = `Tax-Invoice-${invoice.invoiceNo}-AK-Fabric.pdf`;
  doc.save(fileName);
}

/**
 * Shares Delivery Challan via native Web Share API (mobile with PDF attached)
 * or downloads PDF and opens WhatsApp Web with instructions (desktop)
 */
export async function shareChallanPdf(
  challan: DeliveryChallan,
  companyProfile?: CompanyProfile | null
): Promise<{ method: "share" | "download"; fileName: string }> {
  const fileName = `Delivery-Challan-${challan.challanNo}-AK-Fabric.pdf`;
  const doc = generateChallanPdf(challan, companyProfile);
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  // 1. Mobile Web Share API: Directly attaches PDF file in WhatsApp
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `Delivery Challan #${challan.challanNo}`,
        text: `*A.K. FABRIC (SILVASSA)*\n*DELIVERY CHALLAN #${challan.challanNo}*\nCustomer: ${challan.customerName}\nRolls: ${challan.totalRolls} (${Number(challan.totalWeight).toFixed(2)} KG)\nPlease find the attached official Delivery Challan PDF document.`,
      });
      return { method: "share", fileName };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        return { method: "share", fileName };
      }
    }
  }

  // 2. Desktop PC Fallback:
  // Automatically trigger PDF download so the user has the file
  doc.save(fileName);

  // Open WhatsApp Web with pre-formatted document text
  const msg = `*A.K. FABRIC (SILVASSA)*\n*DELIVERY CHALLAN #${challan.challanNo}*\n-----------------------------------\n*Customer:* ${challan.customerName}\n*Date:* ${formatDateIndian(challan.challanDate)}\n*Vehicle No:* ${challan.vehicleNo}\n*Transporter:* ${challan.transporter || "ROADWAYS"}\n*Total Rolls:* ${challan.totalRolls} Rolls (${Number(challan.totalWeight).toFixed(2)} KG)\n-----------------------------------\nPlease find the attached Delivery Challan PDF (${fileName}).`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(whatsappUrl, "_blank");

  return { method: "download", fileName };
}

/**
 * Shares Tax Invoice via native Web Share API (mobile with PDF attached)
 * or downloads PDF and opens WhatsApp Web with instructions (desktop)
 */
export async function shareInvoicePdf(
  invoice: TaxInvoice,
  challan?: DeliveryChallan | null,
  companyProfile?: CompanyProfile | null
): Promise<{ method: "share" | "download"; fileName: string }> {
  const fileName = `Tax-Invoice-${invoice.invoiceNo}-AK-Fabric.pdf`;
  const doc = generateInvoicePdf(invoice, companyProfile);
  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  // 1. Mobile Web Share API: Directly attaches PDF file in WhatsApp
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `Tax Invoice #${invoice.invoiceNo}`,
        text: `*A.K. FABRIC (SILVASSA)*\n*TAX INVOICE #${invoice.invoiceNo}*\nCustomer: ${invoice.customerName}\nTotal: Rs. ${formatIndianCurrency(invoice.grandTotal)}\nPlease find the attached official GST Tax Invoice PDF document.`,
      });
      return { method: "share", fileName };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        return { method: "share", fileName };
      }
    }
  }

  // 2. Desktop PC Fallback:
  // Automatically trigger PDF download so the user has the file
  doc.save(fileName);

  // Open WhatsApp Web with pre-formatted document text
  const totalGst =
    Number(invoice.cgstAmount || 0) +
    Number(invoice.utgstAmount || 0) +
    Number(invoice.igstAmount || 0);

  const msg = `*A.K. FABRIC (SILVASSA)*\n*TAX INVOICE #${invoice.invoiceNo}*\n-----------------------------------\n*Customer:* ${invoice.customerName}\n*GSTIN:* ${invoice.customerGstin}\n*Date:* ${formatDateIndian(invoice.invoiceDate)}\n*Quantity:* ${invoice.quantityKg} KG (${invoice.noOfRolls} Rolls)\n*Rate:* Rs. ${Number(invoice.ratePerKg).toFixed(2)}/KG\n*Taxable Value:* Rs. ${formatIndianCurrency(invoice.taxableAmount)}\n*Total GST:* Rs. ${formatIndianCurrency(totalGst)}\n*Grand Total:* Rs. ${formatIndianCurrency(invoice.grandTotal)}\n-----------------------------------\nPlease find the attached GST Tax Invoice PDF (${fileName}).`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(whatsappUrl, "_blank");

  return { method: "download", fileName };
}
