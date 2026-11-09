"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Download,
  Check,
} from "lucide-react";
import { DeliveryChallan, CompanyProfile } from "@/lib/types";
import { formatIndianCurrency, formatDateIndian } from "@/lib/utils";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";

const COPY_TYPES = [
  "Original for Recipient",
  "Duplicate for Transporter",
  "Triplicate for supplier",
  "Extra Copy",
];

export default function DeliveryChallanViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [challan, setChallan] = useState<DeliveryChallan | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCopy, setSelectedCopy] = useState<string>("Original for Recipient");

  useEffect(() => {
    async function fetchChallan() {
      try {
        setLoading(true);
        const res = await fetch(`/api/challans/${resolvedParams.id}`);
        const json = await res.json();
        if (json.success) {
          setChallan(json.data.challan);
          setCompany(json.data.company);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchChallan();
  }, [resolvedParams.id]);

  // Organize rolls into 3 balanced columns for the print layout
  const columns = useMemo(() => {
    if (!challan || !challan.rolls) return [[], [], []];
    const total = challan.rolls.length;
    const perCol = Math.ceil(total / 3);

    const col1 = challan.rolls.slice(0, perCol).map((r, i) => ({ sr: i + 1, ...r }));
    const col2 = challan.rolls
      .slice(perCol, perCol * 2)
      .map((r, i) => ({ sr: perCol + i + 1, ...r }));
    const col3 = challan.rolls
      .slice(perCol * 2)
      .map((r, i) => ({ sr: perCol * 2 + i + 1, ...r }));

    // Find max rows across the 3 columns so lines align
    const maxRows = Math.max(col1.length, col2.length, col3.length);

    return { col1, col2, col3, maxRows };
  }, [challan]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-xs text-neutral-500 font-medium">
          Loading Delivery Challan...
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Challan #{resolvedParams.id} not found.
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

  const { col1, col2, col3, maxRows } = columns as {
    col1: Array<{ sr: number; rollNo: string; netWeight: number }>;
    col2: Array<{ sr: number; rollNo: string; netWeight: number }>;
    col3: Array<{ sr: number; rollNo: string; netWeight: number }>;
    maxRows: number;
  };

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
                Delivery Challan
              </span>
              <h1 className="text-lg font-bold text-neutral-950 dark:text-white">
                Challan #{challan.challanNo}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customer: {challan.customerName} · {challan.totalRolls} rolls (
              {challan.totalWeight.toFixed(2)} KG)
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

          {/* Switch to Invoice */}
          <Link
            href={`/dispatch/invoice/${challan.challanNo}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Switch to Tax Invoice</span>
          </Link>

          {/* Share on WhatsApp as PDF */}
          <WhatsAppShareButton
            elementId="printable-challan"
            fileName={`Delivery-Challan-${challan.challanNo}-AK-Fabric`}
            shareTitle={`Delivery Challan #${challan.challanNo} - A.K. Fabric`}
            shareMessage={`*A.K. FABRIC (SILVASSA)*\n*DELIVERY CHALLAN #${challan.challanNo}*\n-----------------------------------\n*Customer:* ${challan.customerName}\n*Date:* ${formatDateIndian(challan.challanDate)}\n*Vehicle No:* ${challan.vehicleNo}\n*Transporter:* ${challan.transporter || "ROADWAYS"}\n*Total Rolls:* ${challan.totalRolls} Rolls (${challan.totalWeight.toFixed(2)} KG)\n*Quality:* ${challan.fabricQuality || "Grey Fabric"}\n-----------------------------------\nPlease find the official Delivery Challan attached as PDF.`}
            label="Share Challan PDF"
          />

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Challan</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE DELIVERY CHALLAN SHEET (A4 Pixel-Perfect Document) */}
      <div className="w-full overflow-x-auto pb-6">
        <div className="text-[11px] text-neutral-400 text-center mb-2 sm:hidden">
          Swipe sideways to view full A4 Challan document
        </div>
        <div
          id="printable-challan"
          className="min-w-[720px] sm:min-w-0 bg-white text-black p-6 sm:p-10 border border-neutral-300 rounded-lg shadow-sm mx-auto max-w-[850px] print:border-none print:shadow-none print:p-0 print:max-w-none text-[11px] font-sans leading-tight select-text"
        >
        {/* Jurisdiction & Copy Status */}
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
          DELIVERY CHALLAN
        </div>

        {/* Delivery Address & Transport Meta Table */}
        <div className="grid grid-cols-2 border-b border-black">
          {/* Left: Shipped To */}
          <div className="p-2 border-r border-black space-y-1">
            <span className="font-bold uppercase text-[10px] block text-neutral-700">
              Address of Delivery / Shipped To:
            </span>
            <div className="font-bold text-xs">{challan.customerName}</div>
            <div className="text-[10px] whitespace-pre-line leading-snug">
              {challan.shippingAddress}
            </div>
            <div className="font-bold text-[10px] pt-1">
              GSTIN: {challan.customerGstin}
            </div>
          </div>

          {/* Right: Challan Meta */}
          <div className="p-2 space-y-1 divide-y divide-neutral-200">
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Challan No:</span>
              <span className="font-black text-xs">{challan.challanNo}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Date of Supply:</span>
              <span className="font-bold">{formatDateIndian(challan.challanDate)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Transport:</span>
              <span className="font-medium">{challan.transporter}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Transport Mode:</span>
              <span className="font-medium">{challan.transportMode}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Vehicle No:</span>
              <span className="font-bold">{challan.vehicleNo}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">Place of Supply:</span>
              <span className="font-bold uppercase">{challan.placeOfSupply}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-semibold text-neutral-700">L.R. No:</span>
              <span className="font-medium">{challan.lrNo || "—"}</span>
            </div>
          </div>
        </div>

        {/* 3-Column Balanced Roll Grid */}
        <div className="border-b border-black">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-neutral-100 font-bold text-center">
                <th className="py-1 px-1 border-r border-black w-7">Sr No</th>
                <th className="py-1 px-1 border-r border-black">Roll No</th>
                <th className="py-1 px-1 border-r-2 border-black">Net Wt</th>

                <th className="py-1 px-1 border-r border-black w-7">Sr No</th>
                <th className="py-1 px-1 border-r border-black">Roll No</th>
                <th className="py-1 px-1 border-r-2 border-black">Net Wt</th>

                <th className="py-1 px-1 border-r border-black w-7">Sr No</th>
                <th className="py-1 px-1 border-r border-black">Roll No</th>
                <th className="py-1 px-1">Net Wt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {Array.from({ length: maxRows }).map((_, idx) => {
                const r1 = col1[idx];
                const r2 = col2[idx];
                const r3 = col3[idx];

                return (
                  <tr key={idx} className="text-center font-mono">
                    {/* Col 1 */}
                    <td className="py-0.5 px-1 border-r border-black text-neutral-600">
                      {r1 ? r1.sr : ""}
                    </td>
                    <td className="py-0.5 px-1 border-r border-black font-semibold">
                      {r1 ? r1.rollNo : ""}
                    </td>
                    <td className="py-0.5 px-1 border-r-2 border-black text-right pr-2">
                      {r1 ? r1.netWeight.toFixed(2) : ""}
                    </td>

                    {/* Col 2 */}
                    <td className="py-0.5 px-1 border-r border-black text-neutral-600">
                      {r2 ? r2.sr : ""}
                    </td>
                    <td className="py-0.5 px-1 border-r border-black font-semibold">
                      {r2 ? r2.rollNo : ""}
                    </td>
                    <td className="py-0.5 px-1 border-r-2 border-black text-right pr-2">
                      {r2 ? r2.netWeight.toFixed(2) : ""}
                    </td>

                    {/* Col 3 */}
                    <td className="py-0.5 px-1 border-r border-black text-neutral-600">
                      {r3 ? r3.sr : ""}
                    </td>
                    <td className="py-0.5 px-1 border-r border-black font-semibold">
                      {r3 ? r3.rollNo : ""}
                    </td>
                    <td className="py-0.5 px-1 text-right pr-2">
                      {r3 ? r3.netWeight.toFixed(2) : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary (Matching Excel Sample) */}
        <div className="p-3 border-b border-black space-y-1.5 text-[11px]">
          <div className="flex justify-between font-bold">
            <div>
              <span>NO OF ROLLS : {challan.totalRolls}</span>
              <span className="ml-6">NO OF BAGS: {challan.noOfBags}</span>
            </div>
            <div className="text-right">
              TOTAL WEIGHT: {challan.totalWeight.toFixed(2)} KG
            </div>
          </div>

          {/* Machine breakdown string */}
          <div className="font-bold text-[10px] tracking-tight uppercase py-1 border-y border-neutral-300">
            {challan.machineSummaryText}
          </div>

          <div className="font-bold uppercase text-[10px]">
            {challan.fabricQuality}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 pt-10 pb-2 text-[10px]">
          <div className="flex flex-col justify-end">
            <span className="font-semibold text-neutral-600">
              Receiver&apos;s Signature
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
