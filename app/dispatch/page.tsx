"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  FileText,
  Search,
  Truck,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { DeliveryChallan, TaxInvoice } from "@/lib/types";
import { formatIndianCurrency, formatDateIndian } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

export default function DispatchListPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [chRes, invRes] = await Promise.all([
          fetch("/api/challans"),
          fetch("/api/invoices"),
        ]);
        const chJson = await chRes.json();
        const invJson = await invRes.json();
        if (chJson.success) setChallans(chJson.data);
        if (invJson.success) setInvoices(invJson.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredChallans = challans.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.challanNo.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.vehicleNo.toLowerCase().includes(q) ||
      c.placeOfSupply.toLowerCase().includes(q)
    );
  });

  if (!authLoading && !hasPermission("financeView")) {
    return (
      <AccessDenied
        requiredPermission="financeView"
        moduleName="Dispatch & Invoices"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Dispatch & Invoices
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Delivery challans and GST tax invoices formatted for official printing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            href="/finance"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors shadow-xs flex-1 sm:flex-none"
          >
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Finance Dashboard</span>
          </Link>

          <Link
            href="/dispatch/new"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Dispatch</span>
          </Link>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challan, customer, vehicle..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="text-xs text-neutral-500">
          Showing {filteredChallans.length} dispatches
        </div>
      </div>

      {/* MOBILE VIEW: Touch-Friendly Dispatch Cards (md:hidden) */}
      <div className="md:hidden space-y-3">
        {filteredChallans.map((ch) => {
          const inv = invoices.find(
            (i) => i.challanId === ch.id || i.invoiceNo === ch.challanNo
          );

          return (
            <div
              key={ch.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-950 dark:text-white">
                    Challan #{ch.challanNo}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-600 dark:text-neutral-400">
                    {formatDateIndian(ch.challanDate)}
                  </span>
                </div>

                {inv && (
                  <span className="font-bold text-xs text-neutral-950 dark:text-white">
                    Rs. {formatIndianCurrency(inv.grandTotal)}
                  </span>
                )}
              </div>

              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                  {ch.customerName}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  GSTIN: {ch.customerGstin}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-400 block text-[10px]">
                    Vehicle & Transporter
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white block">
                    {ch.vehicleNo}
                  </span>
                  <span className="text-neutral-500 text-[10px] block truncate">
                    {ch.transporter}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[10px]">
                    Net Weight & Rolls
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white block">
                    {ch.totalWeight.toFixed(2)} KG
                  </span>
                  <span className="text-neutral-500 text-[10px] block">
                    {ch.totalRolls} rolls · {ch.noOfBags} bags
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/dispatch/challan/${ch.challanNo}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Challan</span>
                </Link>

                {inv ? (
                  <Link
                    href={`/dispatch/invoice/${inv.invoiceNo}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Tax Invoice</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center py-2 text-neutral-400 text-xs">
                    No Invoice
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredChallans.length === 0 && !loading && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center text-xs text-neutral-500">
            No delivery challans issued yet. Tap &quot;Create New Dispatch&quot; to issue your first challan.
          </div>
        )}
      </div>

      {/* DESKTOP VIEW: Full Data Table (hidden md:block) */}
      <div className="hidden md:block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-medium">Challan / Inv No</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Recipient (Billed To)</th>
                <th className="px-4 py-3 font-medium">Transport & Vehicle</th>
                <th className="px-4 py-3 font-medium">Place of Supply</th>
                <th className="px-4 py-3 font-medium">Rolls & Net Wt</th>
                <th className="px-4 py-3 font-medium">Invoice Value</th>
                <th className="px-4 py-3 font-medium text-right">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredChallans.map((ch) => {
                const inv = invoices.find(
                  (i) => i.challanId === ch.id || i.invoiceNo === ch.challanNo
                );

                return (
                  <tr
                    key={ch.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-sm text-neutral-950 dark:text-white">
                        #{ch.challanNo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600 dark:text-neutral-400">
                      {formatDateIndian(ch.challanDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {ch.customerName}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        GSTIN: {ch.customerGstin}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {ch.vehicleNo}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {ch.transporter} ({ch.transportMode})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-neutral-700 dark:text-neutral-300">
                      {ch.placeOfSupply}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-neutral-950 dark:text-white">
                        {ch.totalWeight.toFixed(2)} KG
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {ch.totalRolls} rolls · {ch.noOfBags} bags
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {inv ? (
                        <div className="font-bold text-neutral-950 dark:text-white">
                          Rs. {formatIndianCurrency(inv.grandTotal)}
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dispatch/challan/${ch.challanNo}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
                        >
                          <FileSpreadsheet className="h-3 w-3" />
                          <span>Challan</span>
                        </Link>

                        {inv && (
                          <Link
                            href={`/dispatch/invoice/${inv.invoiceNo}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-semibold hover:opacity-90 transition-opacity"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Tax Invoice</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredChallans.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    No delivery challans found. Click &quot;Create New Dispatch&quot; to issue your first challan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
