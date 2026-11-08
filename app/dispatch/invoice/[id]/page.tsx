"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Building,
} from "lucide-react";
import { TaxInvoice, CompanyProfile } from "@/lib/types";
import {
  formatIndianCurrency,
  formatDateIndian,
  numberToWordsIndian,
} from "@/lib/utils";

const COPY_TYPES = [
  "Original for Recipient",
  "Duplicate for Transporter",
  "Triplicate for supplier",
  "Extra Copy",
];

export default function TaxInvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [invoice, setInvoice] = useState<TaxInvoice | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCopy, setSelectedCopy] = useState<string>("Original for Recipient");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${resolvedParams.id}`);
        const json = await res.json();
        if (json.success) {
          setInvoice(json.data.invoice);
          setCompany(json.data.company);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-xs text-neutral-500 font-medium">
          Loading Tax Invoice...
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Invoice #{resolvedParams.id} not found.
        </p>
        <Link
          href="/dispatch"
          className="text-xs text-neutral-600 underline hover:text-neutral-950"
        >
          Return to Dispatch Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Control Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dispatch"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                Tax Invoice
              </span>
              <h1 className="text-lg font-bold text-neutral-950 dark:text-white">
                Invoice #{invoice.invoiceNo}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customer: {invoice.customerName} · Total: Rs.{" "}
              {formatIndianCurrency(invoice.grandTotal)}
            </p>
          </div>
        </div>

        {/* Copy Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Selector */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            {COPY_TYPES.map((copy) => (
              <button
                key={copy}
                onClick={() => setSelectedCopy(copy)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  selectedCopy === copy
                    ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm font-semibold"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {copy.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Switch to Challan */}
          <Link
            href={`/dispatch/challan/${invoice.challanNo || invoice.invoiceNo}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Switch to Delivery Challan</span>
          </Link>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Invoice / PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE TAX INVOICE SHEET (A4 Pixel-Perfect Document) */}
      <div className="w-full overflow-x-auto pb-6">
        <div className="text-[11px] text-neutral-400 text-center mb-2 sm:hidden">
          Swipe sideways to view full A4 Tax Invoice document
        </div>
        <div
          id="printable-invoice"
          className="min-w-[720px] sm:min-w-0 bg-white text-black p-6 sm:p-10 border border-neutral-300 rounded-lg shadow-sm mx-auto max-w-[850px] print:border-none print:shadow-none print:p-0 print:max-w-none text-[11px] font-sans leading-tight select-text"
        >
        {/* Top line: Jurisdiction & Copy check list */}
        <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase border-b border-black pb-1 mb-2">
          <span>SUBJECT TO SILVASSA JURISDICTION</span>
          <div className="flex items-center gap-3 text-[9px] font-medium">
            {COPY_TYPES.map((t) => (
              <span
                key={t}
                className={selectedCopy === t ? "font-bold underline" : "opacity-40"}
              >
                [{selectedCopy === t ? "X" : " "}] {t}
              </span>
            ))}
          </div>
        </div>

        {/* Company Header */}
        <div className="text-center py-2 border-b-2 border-black">
          <h2 className="text-2xl font-black tracking-tight uppercase">
            {company?.name || "A.K. FABRIC"}
          </h2>
          <p className="text-[10px] font-medium mt-0.5">
            Email: {company?.email || "akfabric17@gmail.com"} | GSTIN:{" "}
            {company?.gstin || "26AGHPP8818L1ZQ"}
          </p>
          <p className="text-[10px] mt-0.5 text-neutral-800">
            {company?.address ||
              "Balaji Industrial Estate, Gala No 110, Survey No 113/2/7, Amli, Silvassa-396230, Dadra & Nagar Haveli"}
          </p>
        </div>

        {/* Title */}
        <div className="text-center py-1.5 border-b border-black bg-neutral-100 font-bold uppercase tracking-wider text-xs">
          TAX INVOICE
        </div>

        {/* Recipient & Meta Section */}
        <div className="grid grid-cols-2 border-b border-black">
          {/* Left: Recipient (Billed To) */}
          <div className="p-2 border-r border-black space-y-1">
            <span className="font-bold uppercase text-[10px] block text-neutral-700">
              NAME & ADDRESS OF RECIPIENT (BILLED TO):
            </span>
            <div className="font-bold text-xs">{invoice.customerName}</div>
            <div className="text-[10px] whitespace-pre-line leading-snug">
              {invoice.billingAddress}
            </div>
            <div className="font-bold text-[10px] pt-1">
              GSTIN: {invoice.customerGstin}
            </div>
          </div>

          {/* Right: Invoice details */}
          <div className="p-2 space-y-1 divide-y divide-neutral-200">
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Invoice No:</span>
              <span className="font-black text-xs">{invoice.invoiceNo}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Invoice Date:</span>
              <span className="font-bold">{formatDateIndian(invoice.invoiceDate)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Transport Mode:</span>
              <span className="font-medium">{invoice.transportMode}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Vehicle No:</span>
              <span className="font-bold">{invoice.vehicleNo}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Date of Supply:</span>
              <span className="font-medium">{formatDateIndian(invoice.dateOfSupply)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Place of Supply:</span>
              <span className="font-bold uppercase">{invoice.placeOfSupply}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">L.R. No:</span>
              <span className="font-medium">{invoice.lrNo || "—"}</span>
            </div>
          </div>
        </div>

        {/* Item Particulars Table */}
        <div className="border-b border-black">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-neutral-100 font-bold text-center">
                <th className="py-2 px-1 border-r border-black w-8">Sr. No.</th>
                <th className="py-2 px-2 border-r border-black text-left">
                  Description of Goods / Services
                </th>
                <th className="py-2 px-1 border-r border-black w-16">HSN/SAC</th>
                <th className="py-2 px-1 border-r border-black w-14">No. of roll</th>
                <th className="py-2 px-2 border-r border-black w-20 text-right">
                  Quantity (KG)
                </th>
                <th className="py-2 px-2 border-r border-black w-14 text-right">
                  Rate
                </th>
                <th className="py-2 px-2 text-right w-24">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: The Main Job Work Item */}
              <tr className="align-top font-mono">
                <td className="py-3 px-1 border-r border-black text-center text-neutral-600">
                  1
                </td>
                <td className="py-3 px-2 border-r border-black font-sans font-medium whitespace-pre-line leading-relaxed">
                  {invoice.description}
                </td>
                <td className="py-3 px-1 border-r border-black text-center">
                  {invoice.hsnSac}
                </td>
                <td className="py-3 px-1 border-r border-black text-center font-bold">
                  {invoice.noOfRolls}
                </td>
                <td className="py-3 px-2 border-r border-black text-right font-bold">
                  {invoice.quantityKg.toFixed(2)}
                </td>
                <td className="py-3 px-2 border-r border-black text-right font-medium">
                  {invoice.ratePerKg.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right font-bold text-xs">
                  {formatIndianCurrency(invoice.taxableAmount)}
                </td>
              </tr>

              {/* Extra spacing rows to give full height like paper invoice */}
              <tr className="h-32">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bank Details & Tax Calculations */}
        <div className="grid grid-cols-12 border-b border-black">
          {/* Left: Bank Details & Amount in Words (7 Cols) */}
          <div className="col-span-7 p-3 border-r border-black flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-[10px] block uppercase text-neutral-800">
                Bank Details:
              </span>
              <div className="font-mono text-[9px] leading-relaxed bg-neutral-50 p-2 rounded border border-neutral-200">
                <div>Bank Name: {invoice.bankDetails?.bankName || company?.bankName}</div>
                <div>BRANCH: {invoice.bankDetails?.branch || company?.bankBranch}</div>
                <div>A/C: {invoice.bankDetails?.accountNo || company?.bankAccountNo}</div>
                <div>IFSC CODE: {invoice.bankDetails?.ifsc || company?.bankIfsc}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="font-bold text-[10px] block uppercase text-neutral-700">
                Amount in Words:
              </span>
              <span className="font-bold text-xs leading-snug uppercase block">
                {invoice.amountInWords || numberToWordsIndian(invoice.grandTotal)}
              </span>
            </div>
          </div>

          {/* Right: Taxes and Grand Total (5 Cols) */}
          <div className="col-span-5 divide-y divide-neutral-300 text-[10px] font-mono">
            <div className="p-1.5 flex justify-between">
              <span className="font-medium text-neutral-700">TOTAL</span>
              <span className="font-bold">{formatIndianCurrency(invoice.taxableAmount)}</span>
            </div>

            {invoice.isInterState ? (
              <div className="p-1.5 flex justify-between">
                <span className="font-medium text-neutral-700">
                  IGST @ {invoice.igstRate}%
                </span>
                <span className="font-bold">
                  {formatIndianCurrency(invoice.igstAmount)}
                </span>
              </div>
            ) : (
              <>
                <div className="p-1.5 flex justify-between">
                  <span className="font-medium text-neutral-700">
                    CGST @ {invoice.cgstRate}%
                  </span>
                  <span className="font-bold">
                    {formatIndianCurrency(invoice.cgstAmount)}
                  </span>
                </div>
                <div className="p-1.5 flex justify-between">
                  <span className="font-medium text-neutral-700">
                    UT GST @ {invoice.utgstRate}%
                  </span>
                  <span className="font-bold">
                    {formatIndianCurrency(invoice.utgstAmount)}
                  </span>
                </div>
              </>
            )}

            <div className="p-1.5 flex justify-between">
              <span className="font-medium text-neutral-700">Round OFF</span>
              <span className="font-bold">
                {invoice.roundOff >= 0
                  ? `+${invoice.roundOff.toFixed(2)}`
                  : invoice.roundOff.toFixed(2)}
              </span>
            </div>

            <div className="p-2 flex justify-between bg-neutral-100 font-bold text-xs">
              <span className="uppercase tracking-wider">GRAND TOTAL</span>
              <span className="font-black text-sm">
                Rs. {formatIndianCurrency(invoice.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 pt-10 pb-2 text-[10px]">
          <div className="flex flex-col justify-end">
            <span className="font-semibold text-neutral-600">
              Receiver Signatory
            </span>
          </div>

          <div className="text-right space-y-12">
            <span className="font-bold block uppercase">
              FOR {company?.name || "A.K. FABRIC"}
            </span>
            <span className="font-semibold block uppercase">
              Authorised Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
