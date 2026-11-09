"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  Truck,
  CalendarRange,
  Users,
  Percent,
  CheckCircle2,
  FileText,
  Search,
  ExternalLink,
  DollarSign,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatIndianCurrency, formatDateIndian } from "@/lib/utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";
import { TaxInvoice } from "@/lib/types";

type DatePreset =
  | "thisMonth"
  | "today"
  | "yesterday"
  | "last7"
  | "lastMonth"
  | "custom";

interface DailyTrendItem {
  date: string;
  dateLabel: string;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
  quantityKg: number;
  invoiceCount: number;
}

interface CustomerBreakdownItem {
  customerId: string;
  customerName: string;
  customerGstin: string;
  invoiceCount: number;
  quantityKg: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
  percentage: number;
}

interface FinanceDashboardData {
  startDate: string;
  endDate: string;
  daysCount: number;
  isCurrentMonth: boolean;
  periodTotalAmount: number;
  periodTaxableAmount: number;
  periodGstAmount: number;
  periodCgstAmount: number;
  periodUtgstAmount: number;
  periodIgstAmount: number;
  periodDispatchedKg: number;
  periodTotalRolls: number;
  periodInvoiceCount: number;
  averageInvoiceValue: number;
  averageRatePerKg: number;
  dailyTrend: DailyTrendItem[];
  customerBreakdown: CustomerBreakdownItem[];
  invoices: TaxInvoice[];
  allTimeTotalAmount: number;
  allTimeInvoiceCount: number;
  allTimeDispatchedKg: number;
}

export function FinanceDashboardClient() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DatePreset>("thisMonth");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const toIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchDashboard = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      let url = "/api/finance/dashboard";
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setStartDate(json.data.startDate);
        setEndDate(json.data.endDate);
      }
    } catch (e) {
      console.error("Failed to load finance dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // Default to Month-To-Date (MTD): 1st of current month to today
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const s = toIsoDate(firstDay);
    const e = toIsoDate(now);
    setStartDate(s);
    setEndDate(e);
    fetchDashboard(s, e);
  }, []);

  const applyPreset = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const now = new Date();
    let s = toIsoDate(now);
    let e = toIsoDate(now);

    if (newPreset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      s = toIsoDate(firstDay);
      e = toIsoDate(now);
    } else if (newPreset === "today") {
      s = toIsoDate(now);
      e = toIsoDate(now);
    } else if (newPreset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      s = toIsoDate(y);
      e = toIsoDate(y);
    } else if (newPreset === "last7") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      s = toIsoDate(past7);
      e = toIsoDate(now);
    } else if (newPreset === "lastMonth") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      s = toIsoDate(firstDayLastMonth);
      e = toIsoDate(lastDayLastMonth);
    }

    if (newPreset !== "custom") {
      setStartDate(s);
      setEndDate(e);
      fetchDashboard(s, e);
    }
  };

  const shareInvoiceOnWhatsApp = (inv: TaxInvoice) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ak-fabric.vercel.app";
    const invoiceUrl = `${origin}/dispatch/invoice/${inv.invoiceNo}`;
    const challanUrl = inv.challanNo ? `\n*Challan Ref:* #${inv.challanNo}` : "";
    const totalGst = Number(inv.cgstAmount || 0) + Number(inv.utgstAmount || 0) + Number(inv.igstAmount || 0);
    const msg = `*A.K. FABRIC (SILVASSA)*\n*TAX INVOICE #${inv.invoiceNo}*\n-----------------------------------\n*Customer:* ${inv.customerName}\n*GSTIN:* ${inv.customerGstin}\n*Date:* ${formatDateIndian(inv.invoiceDate)}${challanUrl}\n*Quantity:* ${inv.quantityKg} KG (${inv.noOfRolls} Rolls)\n*Rate:* Rs. ${Number(inv.ratePerKg).toFixed(2)}/KG\n*Taxable Value:* Rs. ${formatIndianCurrency(inv.taxableAmount)}\n*Total GST:* Rs. ${formatIndianCurrency(totalGst)}\n*Grand Total:* Rs. ${formatIndianCurrency(inv.grandTotal)}\n-----------------------------------\nView & Print Tax Invoice PDF:\n${invoiceUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleStartDateChange = (newStart: string) => {
    if (!newStart) return;
    setStartDate(newStart);
    setPreset("custom");
    const currentEnd = endDate || newStart;
    const end = currentEnd < newStart ? newStart : currentEnd;
    if (currentEnd < newStart) {
      setEndDate(newStart);
    }
    fetchDashboard(newStart, end);
  };

  const handleEndDateChange = (newEnd: string) => {
    if (!newEnd) return;
    setEndDate(newEnd);
    setPreset("custom");
    const currentStart = startDate || newEnd;
    const start = currentStart > newEnd ? newEnd : currentStart;
    if (currentStart > newEnd) {
      setStartDate(newEnd);
    }
    fetchDashboard(start, newEnd);
  };

  const filteredInvoices = useMemo(() => {
    if (!data?.invoices) return [];
    if (!searchQuery.trim()) return data.invoices;
    const q = searchQuery.toLowerCase();
    return data.invoices.filter((inv) => {
      return (
        inv.invoiceNo.toLowerCase().includes(q) ||
        (inv.challanNo && inv.challanNo.toLowerCase().includes(q)) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerGstin.toLowerCase().includes(q) ||
        (inv.vehicleNo && inv.vehicleNo.toLowerCase().includes(q))
      );
    });
  }, [data?.invoices, searchQuery]);

  if (!authLoading && !hasPermission("financeView")) {
    return (
      <AccessDenied
        requiredPermission="financeView"
        moduleName="Finance Dashboard"
      />
    );
  }

  if (!data && loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
        <span className="text-xs text-neutral-500 font-medium">
          Loading Finance Dashboard...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const isRange = startDate !== endDate;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                Finance & Tax Invoice Dashboard
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Real-time GST tax invoices, job work charges, and delivery challan billing for A.K. Fabric
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dispatch"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>All Challans</span>
            </Link>

            <Link
              href="/dispatch/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Dispatch</span>
            </Link>
          </div>
        </div>

        {/* Date Range Selector Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-500 mr-1 flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Range:</span>
            </span>

            {(
              [
                { id: "thisMonth", label: "This Month (MTD)" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last7", label: "Last 7 Days" },
                { id: "lastMonth", label: "Last Month" },
                { id: "custom", label: "Custom Range" },
              ] as const
            ).map((p) => {
              const isSelected = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                      : "bg-white text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <CalendarPicker
                value={startDate}
                onChange={handleStartDateChange}
                placeholder="From Date"
                size="sm"
                align="left"
              />
            </div>
            <span className="text-xs text-neutral-400 font-medium">to</span>
            <div className="w-36">
              <CalendarPicker
                value={endDate}
                onChange={handleEndDateChange}
                placeholder="To Date"
                size="sm"
                align="right"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchDashboard(startDate, endDate)}
              disabled={loading}
              title="Refresh Finance Data"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
              />
              <span>
                {data.daysCount} {data.daysCount === 1 ? "Day" : "Days"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoiced Amount (Emerald / Accent) */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-emerald-400/60 dark:hover:border-emerald-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-90" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Invoiced (Grand Total)
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-neutral-400">Rs.</span>
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.periodTotalAmount)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>{data.periodInvoiceCount} Tax Invoices</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              GST Inclusive
            </span>
          </div>
        </div>

        {/* Card 2: Taxable Job Work Value */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-blue-400/60 dark:hover:border-blue-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Taxable Job Work
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-neutral-400">Rs.</span>
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.periodTaxableAmount)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Rate / KG</span>
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              Rs. {data.averageRatePerKg.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 3: Total GST Output */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-purple-400/60 dark:hover:border-purple-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-90" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total GST Liability
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-neutral-400">Rs.</span>
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.periodGstAmount)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>IGST 5%</span>
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              Rs. {formatIndianCurrency(data.periodIgstAmount)}
            </span>
          </div>
        </div>

        {/* Card 4: Dispatched Volume */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-amber-400/60 dark:hover:border-amber-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-90" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Fabric Dispatched
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.periodDispatchedKg)}
            </span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              KG
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Rolls Dispatched</span>
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {data.periodTotalRolls} rolls
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Daily Revenue Trend (Area Chart) */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
                Daily Invoiced Revenue Trend
              </h2>
              <p className="text-[11px] text-neutral-500">
                Gross tax invoice totals and taxable job work charges over {data.daysCount} days
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  Grand Total
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                  Taxable
                </span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {data.dailyTrend.length === 0 ||
            data.dailyTrend.every((d) => d.grandTotal === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Receipt className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <span className="text-xs font-semibold text-neutral-500">
                  No invoices generated in this date range
                </span>
                <span className="text-[11px] text-neutral-400 mt-0.5">
                  Change the date range or issue a new dispatch challan
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.dailyTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGrandTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#88888820"
                  />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 10, fill: "#888888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#888888" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `Rs. ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as DailyTrendItem;
                        return (
                          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
                            <div className="font-bold text-neutral-950 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1">
                              {formatDateIndian(item.date)}
                            </div>
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span>Grand Total:</span>
                              <span>Rs. {formatIndianCurrency(item.grandTotal)}</span>
                            </div>
                            <div className="flex justify-between text-blue-600 dark:text-blue-400">
                              <span>Taxable Amount:</span>
                              <span>Rs. {formatIndianCurrency(item.taxableAmount)}</span>
                            </div>
                            <div className="flex justify-between text-purple-600 dark:text-purple-400">
                              <span>GST Amount:</span>
                              <span>Rs. {formatIndianCurrency(item.gstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                              <span>Quantity Dispatched:</span>
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {item.quantityKg} KG ({item.invoiceCount} inv)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="grandTotal"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGrandTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="taxableAmount"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorTaxable)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: GST & Tax Compliance Breakdown Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
                  GST Compliance Breakdown
                </h2>
                <p className="text-[11px] text-neutral-500">
                  SAC 998821 · Job Work on Textile Fabrics
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                GSTIN: 26AGHPP8818L1ZQ
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-500">Taxable Value (A)</span>
                <span className="font-semibold text-neutral-950 dark:text-white">
                  Rs. {formatIndianCurrency(data.periodTaxableAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-500 flex items-center gap-1">
                  <span>IGST (5.00%)</span>
                  <span className="text-[10px] text-neutral-400">(Inter-state)</span>
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  Rs. {formatIndianCurrency(data.periodIgstAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-500 flex items-center gap-1">
                  <span>CGST (2.50%)</span>
                  <span className="text-[10px] text-neutral-400">(Intra-state)</span>
                </span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Rs. {formatIndianCurrency(data.periodCgstAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-neutral-500 flex items-center gap-1">
                  <span>UTGST / SGST (2.50%)</span>
                  <span className="text-[10px] text-neutral-400">(Silvassa)</span>
                </span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Rs. {formatIndianCurrency(data.periodUtgstAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 bg-neutral-50 dark:bg-neutral-950 px-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Total Tax Payable (B)
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  Rs. {formatIndianCurrency(data.periodGstAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Net Invoice Value (A + B)
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Rs. {formatIndianCurrency(data.periodTotalAmount)}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">
              All deliveries issued with legal e-way compatible Tax Invoices.
            </div>
          </div>
        </div>
      </div>

      {/* Customer Breakdown Section */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Customer Billing & Dispatch Share
            </h2>
            <p className="text-[11px] text-neutral-500">
              Breakdown of invoiced amounts, fabric weight, and revenue contribution by customer
            </p>
          </div>
          <span className="text-xs text-neutral-400">
            {data.customerBreakdown.length} Active {data.customerBreakdown.length === 1 ? "Client" : "Clients"}
          </span>
        </div>

        {data.customerBreakdown.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            No customer billing in this period.
          </div>
        ) : (
          <div className="space-y-3">
            {data.customerBreakdown.map((cust) => (
              <div
                key={cust.customerId}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-950 dark:text-white">
                      {cust.customerName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500">
                      GSTIN: {cust.customerGstin}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 flex items-center gap-3">
                    <span>{cust.invoiceCount} Invoices</span>
                    <span>·</span>
                    <span>{cust.quantityKg} KG Dispatched</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                  {/* Progress bar visual */}
                  <div className="hidden sm:flex flex-col items-end w-32">
                    <span className="text-[10px] font-semibold text-neutral-500">
                      {cust.percentage}% Share
                    </span>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, cust.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-neutral-950 dark:text-white">
                      Rs. {formatIndianCurrency(cust.grandTotal)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Taxable: Rs. {formatIndianCurrency(cust.taxableAmount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices Register for Selected Period */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Tax Invoices Register ({filteredInvoices.length})
            </h2>
            <p className="text-[11px] text-neutral-500">
              Tax invoices issued between {formatDateIndian(startDate)} and {formatDateIndian(endDate)}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice, customer, challan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Challan Ref</th>
                <th className="py-3 px-4 text-right">Quantity (KG)</th>
                <th className="py-3 px-4 text-right">Taxable (Rs.)</th>
                <th className="py-3 px-4 text-right">GST (Rs.)</th>
                <th className="py-3 px-4 text-right">Grand Total (Rs.)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredInvoices.map((inv) => {
                const totalGst =
                  Number(inv.cgstAmount || 0) +
                  Number(inv.utgstAmount || 0) +
                  Number(inv.igstAmount || 0);

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-neutral-950 dark:text-white">
                      #{inv.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {formatDateIndian(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {inv.customerName}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {inv.customerGstin}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {inv.challanNo ? (
                        <Link
                          href={`/dispatch/challan/${inv.challanNo}`}
                          className="inline-flex items-center gap-1 font-mono text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <span>Challan #{inv.challanNo}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-neutral-900 dark:text-white">
                      {inv.quantityKg} KG
                      <span className="block text-[10px] text-neutral-400">
                        {inv.noOfRolls} rolls
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-700 dark:text-neutral-300">
                      {formatIndianCurrency(inv.taxableAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400 font-medium">
                      {formatIndianCurrency(totalGst)}
                      <span className="block text-[9px] text-neutral-400">
                        {inv.isInterState ? "IGST 5%" : "CGST+UTGST 5%"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatIndianCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => shareInvoiceOnWhatsApp(inv)}
                          title="Share Tax Invoice on WhatsApp"
                          className="inline-flex items-center justify-center p-1.5 rounded-md bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors"
                        >
                          <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.153.57 4.17 1.564 5.91l-1.664 6.074 6.244-1.637c1.7 1.01 3.684 1.653 5.856 1.653 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                          </svg>
                        </button>

                        <Link
                          href={`/dispatch/invoice/${inv.invoiceNo}`}
                          className="px-2.5 py-1 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-semibold hover:opacity-90 transition-opacity"
                        >
                          Invoice
                        </Link>
                        {inv.challanNo && (
                          <Link
                            href={`/dispatch/challan/${inv.challanNo}`}
                            className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            Challan
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-xs text-neutral-400"
                  >
                    No tax invoices found in the selected range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Touch Cards */}
        <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredInvoices.map((inv) => {
            const totalGst =
              Number(inv.cgstAmount || 0) +
              Number(inv.utgstAmount || 0) +
              Number(inv.igstAmount || 0);

            return (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-950 dark:text-white">
                      Invoice #{inv.invoiceNo}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-600 dark:text-neutral-400">
                      {formatDateIndian(inv.invoiceDate)}
                    </span>
                  </div>

                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    Rs. {formatIndianCurrency(inv.grandTotal)}
                  </span>
                </div>

                <div>
                  <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                    {inv.customerName}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    GSTIN: {inv.customerGstin}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">
                      Weight & Rolls
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {inv.quantityKg} KG
                    </span>
                    <span className="text-neutral-500 text-[10px] block">
                      {inv.noOfRolls} rolls
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[10px]">
                      Taxable & GST
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      Rs. {formatIndianCurrency(inv.taxableAmount)}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 text-[10px] block font-medium">
                      + Rs. {formatIndianCurrency(totalGst)} GST
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <Link
                    href={`/dispatch/invoice/${inv.invoiceNo}`}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Invoice</span>
                  </Link>

                  {inv.challanNo ? (
                    <Link
                      href={`/dispatch/challan/${inv.challanNo}`}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Challan</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center py-2 text-neutral-400 text-xs">
                      No Challan
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => shareInvoiceOnWhatsApp(inv)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold shadow-sm"
                  >
                    <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.153.57 4.17 1.564 5.91l-1.664 6.074 6.244-1.637c1.7 1.01 3.684 1.653 5.856 1.653 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-400">
              No tax invoices found in the selected range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

