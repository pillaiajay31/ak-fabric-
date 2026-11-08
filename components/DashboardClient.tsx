"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Award,
  Box,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Truck,
  CalendarRange,
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

const MACHINE_COLOR_MAP: Record<
  string,
  {
    color: string;
    badge: string;
    barGradient: string;
    pill: string;
    hex: string;
    border: string;
  }
> = {
  A: {
    color: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-600 text-white",
    barGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
    pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60",
    hex: "#2563eb",
    border: "hover:border-blue-400/70",
  },
  M1: {
    color: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-600 text-white",
    barGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
    pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60",
    hex: "#2563eb",
    border: "hover:border-blue-400/70",
  },
  B: {
    color: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-600 text-white",
    barGradient: "bg-gradient-to-r from-purple-500 to-pink-500",
    pill: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-900/60",
    hex: "#9333ea",
    border: "hover:border-purple-400/70",
  },
  M2: {
    color: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-600 text-white",
    barGradient: "bg-gradient-to-r from-purple-500 to-pink-500",
    pill: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-900/60",
    hex: "#9333ea",
    border: "hover:border-purple-400/70",
  },
  C: {
    color: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-600 text-white",
    barGradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60",
    hex: "#059669",
    border: "hover:border-emerald-400/70",
  },
  M3: {
    color: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-600 text-white",
    barGradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60",
    hex: "#059669",
    border: "hover:border-emerald-400/70",
  },
  D: {
    color: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-600 text-white",
    barGradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60",
    hex: "#d97706",
    border: "hover:border-amber-400/70",
  },
  M4: {
    color: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-600 text-white",
    barGradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60",
    hex: "#d97706",
    border: "hover:border-amber-400/70",
  },
};

function getMachineTheme(code: string) {
  return (
    MACHINE_COLOR_MAP[code] || {
      color: "text-blue-600 dark:text-blue-400",
      badge: "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900",
      barGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
      pill: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      hex: "#2563eb",
      border: "hover:border-blue-400/70",
    }
  );
}

type DatePreset = "today" | "yesterday" | "last7" | "thisMonth" | "custom";

interface DashboardData {
  startDate: string;
  endDate: string;
  daysCount: number;
  isRange: boolean;
  today: string;
  periodKg: number;
  periodCount: number;
  bestMachine: {
    code: string;
    name: string;
    rolls: number;
    weight: number;
    target: number;
  } | null;
  machineStats: Array<{
    code: string;
    name: string;
    rolls: number;
    weight: number;
    target: number;
  }>;
  inStock: {
    rolls: number;
    weight: number;
  };
  dispatched: {
    rolls: number;
    weight: number;
  };
  rejection: {
    periodKg: number;
    totalKg: number;
    ratePercent: number;
  };
  trendData: Array<{
    date: string;
    totalKg: number;
    rolls: number;
    A: number;
    B: number;
    C: number;
    D: number;
  }>;
  recentRolls: Array<{
    id: string;
    rollNo: string;
    machineCode: string;
    netWeight: number;
    date: string;
    shift: string;
    operator?: string;
    status: string;
    challanNo?: string;
  }>;
}

export function DashboardClient() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DatePreset>("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Helper to format date as YYYY-MM-DD
  const toIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchDashboard = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      let url = "/api/dashboard";
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      } else if (start) {
        url += `?date=${start}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (!startDate) setStartDate(json.data.startDate);
        if (!endDate) setEndDate(json.data.endDate);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const today = toIsoDate(new Date());
    setStartDate(today);
    setEndDate(today);
    fetchDashboard(today, today);
  }, []);

  // Handle Preset Switching
  const applyPreset = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const now = new Date();
    let s = toIsoDate(now);
    let e = toIsoDate(now);

    if (newPreset === "today") {
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
    } else if (newPreset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      s = toIsoDate(firstDay);
      e = toIsoDate(now);
    }

    if (newPreset !== "custom") {
      setStartDate(s);
      setEndDate(e);
      startTransition(() => {
        fetchDashboard(s, e);
      });
    }
  };

  // Handle custom date picker changes
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setPreset("custom");
    const end = endDate < newStart ? newStart : endDate;
    if (endDate < newStart) setEndDate(newStart);
    startTransition(() => {
      fetchDashboard(newStart, end);
    });
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    setPreset("custom");
    const start = startDate > newEnd ? newEnd : startDate;
    if (startDate > newEnd) setStartDate(newEnd);
    startTransition(() => {
      fetchDashboard(start, newEnd);
    });
  };

  if (!authLoading && !hasPermission("productionDashboard")) {
    return (
      <AccessDenied
        requiredPermission="productionDashboard"
        moduleName="Summary Dashboard"
      />
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <span className="text-xs text-neutral-500 font-medium">
            Loading KnitFlow metrics...
          </span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isRange = data.isRange;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Production Overview
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Production analytics across 4 circular knitting machines · A.K. Fabric Silvassa
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(startDate, endDate)}
              title="Refresh metrics"
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 transition-colors shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </button>

            <Link
              href="/production"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/25 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Roll</span>
            </Link>

            <Link
              href="/dispatch/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-500/25 transition-all"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>New Challan</span>
            </Link>
          </div>
        </div>

        {/* Date Range Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-500 mr-1 flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-blue-500" />
              <span>Range:</span>
            </span>

            {(
              [
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last7", label: "Last 7 Days" },
                { id: "thisMonth", label: "This Month" },
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
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-white text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date Pickers (From -> To) */}
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

            <div className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-[11px] font-semibold text-blue-700 dark:text-blue-300 shadow-xs">
              {data.daysCount} {data.daysCount === 1 ? "Day" : "Days"}
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards with Tasteful Color Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Production in Selected Period (Electric Blue) */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-blue-400/60 dark:hover:border-blue-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isRange ? "Production in Period" : "Produced on Date"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.periodKg)}
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">KG</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Rolls Count</span>
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {data.periodCount} rolls
            </span>
          </div>
        </div>

        {/* Best Performing Machine in Period (Warm Amber / Gold) */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-amber-400/60 dark:hover:border-amber-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isRange ? "Top Machine in Period" : "Top Machine Today"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {data.bestMachine ? `Machine ${data.bestMachine.code}` : "None"}
            </span>
            {data.bestMachine && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                Top Line
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Period Output</span>
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {data.bestMachine
                ? `${formatIndianCurrency(data.bestMachine.weight)} KG (${data.bestMachine.rolls} rolls)`
                : "No rolls logged"}
            </span>
          </div>
        </div>

        {/* Warehouse In-Stock Inventory (Emerald Green) */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-emerald-400/60 dark:hover:border-emerald-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              In-Stock Warehouse
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Box className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.inStock.weight)}
            </span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">KG</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready for Challan</span>
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {data.inStock.rolls} rolls ready
            </span>
          </div>
        </div>

        {/* Rejection / Wastage in Period (Coral / Rose) */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:border-rose-400/60 dark:hover:border-rose-700/60 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-red-500 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Rejection Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tracking-tight ${
                data.rejection.ratePercent > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-neutral-950 dark:text-white"
              }`}
            >
              {data.rejection.ratePercent}%
            </span>
            <span className="text-xs font-medium text-neutral-500">
              {data.rejection.ratePercent === 0 ? "Zero Defect" : "of period batch"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Wastage Weight</span>
            <span
              className={`font-semibold ${
                data.rejection.periodKg > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {formatIndianCurrency(data.rejection.periodKg)} KG in range
            </span>
          </div>
        </div>
      </div>

      {/* 4 Machines Performance Cards in Selected Range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
            Knitting Machines (4 Units)
          </h2>
          <span className="text-xs text-neutral-500">
            {isRange
              ? `${formatDateIndian(data.startDate)} to ${formatDateIndian(data.endDate)} (${data.daysCount} days)`
              : `Performance on ${formatDateIndian(data.startDate)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.machineStats.map((mc) => {
            const isBest = data.bestMachine?.code === mc.code && mc.weight > 0;
            const target = mc.target || 450 * data.daysCount;
            const progress = Math.min(100, Math.round((mc.weight / target) * 100));
            const theme = getMachineTheme(mc.code);

            return (
              <div
                key={mc.code}
                className={`rounded-xl border p-4 bg-white dark:bg-neutral-900 transition-all shadow-sm ${
                  isBest
                    ? "border-amber-400 dark:border-amber-500/80 ring-2 ring-amber-400/30 bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-neutral-900 dark:to-neutral-900"
                    : `border-neutral-200/80 dark:border-neutral-800 ${theme.border}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-8 w-8 rounded-lg ${theme.badge} flex items-center justify-center font-bold text-xs shadow-xs`}
                    >
                      {mc.code}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-neutral-950 dark:text-white block">
                        Machine {mc.code}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        Prefix: {mc.code}.
                      </span>
                    </div>
                  </div>

                  {isBest && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                      Best
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                      {formatIndianCurrency(mc.weight)}
                      <span className="text-xs font-semibold text-neutral-500 ml-1">
                        KG
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      {mc.rolls} rolls
                    </span>
                  </div>

                  {/* Target Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1.5">
                      <span>Target: {formatIndianCurrency(target)} KG</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-200">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden p-0.5">
                      <div
                        className={`h-full ${theme.barGradient} rounded-full transition-all duration-500 shadow-xs`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/70 flex items-center justify-between">
                  <Link
                    href={`/production?machine=${mc.code}`}
                    className={`text-xs font-semibold ${theme.color} hover:opacity-80 inline-flex items-center gap-1 transition-opacity`}
                  >
                    <span>Log Roll</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics & Graphs for Selected Range */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Production Trend (Net Weight in KG)</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Daily output curve across the selected date range
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                  className="dark:opacity-20"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-blue-200/60 bg-white/95 backdrop-blur-sm p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/95 text-xs">
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {formatDateIndian(item.date)}
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-1 flex items-center justify-between gap-3">
                            <span>Total Output:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {formatIndianCurrency(item.totalKg)} KG
                            </span>
                          </p>
                          <p className="text-neutral-500 mt-0.5 flex items-center justify-between gap-3">
                            <span>Rolls:</span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                              {item.rolls}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalKg"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Comparison Bar Chart (1 Col) */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                Machine Comparison
              </h3>
              <p className="text-xs text-neutral-500">
                Period output by machine (KG)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.machineStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                  className="dark:opacity-20"
                />
                <XAxis
                  dataKey="code"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => `M/C ${val}`}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const theme = getMachineTheme(item.code);
                      return (
                        <div className="rounded-xl border border-neutral-200 bg-white/95 backdrop-blur-sm p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/95 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: theme.hex }} />
                            <p className="font-bold text-neutral-900 dark:text-white">
                              Machine {item.code}
                            </p>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-1 flex items-center justify-between gap-3">
                            <span>Production:</span>
                            <span className={`font-bold ${theme.color}`}>
                              {formatIndianCurrency(item.weight)} KG
                            </span>
                          </p>
                          <p className="text-neutral-500 mt-0.5 flex items-center justify-between gap-3">
                            <span>Rolls:</span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                              {item.rolls}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="weight"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                >
                  {data.machineStats.map((item, idx) => (
                    <Cell key={`cell-${idx}`} fill={getMachineTheme(item.code).hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Production Entries Table in Selected Range */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              Roll Entries in Selected Range
            </h3>
            <p className="text-xs text-neutral-500">
              {data.recentRolls.length} rolls shown from {formatDateIndian(data.startDate)} to {formatDateIndian(data.endDate)}
            </p>
          </div>
          <Link
            href="/production"
            className="text-xs font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white inline-flex items-center gap-1"
          >
            <span>Production Hub</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-medium">Roll No</th>
                <th className="px-4 py-3 font-medium">Machine</th>
                <th className="px-4 py-3 font-medium">Net Wt (KG)</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Shift</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {data.recentRolls.map((roll) => {
                const theme = getMachineTheme(roll.machineCode);
                return (
                  <tr
                    key={roll.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                      {roll.rollNo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${theme.pill}`}
                      >
                        Machine {roll.machineCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">
                      {roll.netWeight.toFixed(2)} KG
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {formatDateIndian(roll.date)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {roll.shift}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {roll.status === "dispatched" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>Dispatched</span>
                        </span>
                      ) : roll.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>In Stock</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-500">
                      {roll.challanNo ? (
                        <Link
                          href={`/dispatch/challan/${roll.challanNo}`}
                          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          Challan #{roll.challanNo}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.recentRolls.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No production rolls logged in this date range.
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
