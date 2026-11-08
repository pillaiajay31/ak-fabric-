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
} from "recharts";
import { formatIndianCurrency, formatDateIndian } from "@/lib/utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Roll</span>
            </Link>

            <Link
              href="/dispatch/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
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
              <CalendarRange className="h-3.5 w-3.5" />
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

            <div className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              {data.daysCount} {data.daysCount === 1 ? "Day" : "Days"}
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Production in Selected Period */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              {isRange ? "Production in Period" : "Produced on Date"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.periodKg)}
            </span>
            <span className="text-sm font-medium text-neutral-500">KG</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Rolls Count</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              {data.periodCount} rolls
            </span>
          </div>
        </div>

        {/* Best Performing Machine in Period */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              {isRange ? "Top Machine in Period" : "Top Machine Today"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-neutral-100">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {data.bestMachine ? `Machine ${data.bestMachine.code}` : "None"}
            </span>
            {data.bestMachine && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                Top Line
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Period Output</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              {data.bestMachine
                ? `${formatIndianCurrency(data.bestMachine.weight)} KG (${data.bestMachine.rolls} rolls)`
                : "No rolls logged"}
            </span>
          </div>
        </div>

        {/* Warehouse In-Stock Inventory */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              In-Stock Warehouse
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Box className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(data.inStock.weight)}
            </span>
            <span className="text-sm font-medium text-neutral-500">KG</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Ready for Challan</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              {data.inStock.rolls} rolls available
            </span>
          </div>
        </div>

        {/* Rejection / Wastage in Period */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Rejection Rate
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {data.rejection.ratePercent}%
            </span>
            <span className="text-xs font-medium text-neutral-500">of period batch</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
            <span>Wastage Weight</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
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

            return (
              <div
                key={mc.code}
                className={`rounded-xl border p-4 bg-white dark:bg-neutral-900 transition-all shadow-sm ${
                  isBest
                    ? "border-neutral-950 dark:border-white ring-1 ring-neutral-950 dark:ring-white"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
                      {mc.code}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                        Machine {mc.code}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        Prefix: {mc.code}.
                      </span>
                    </div>
                  </div>

                  {isBest && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                      Best
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                      {formatIndianCurrency(mc.weight)}
                      <span className="text-xs font-normal text-neutral-500 ml-1">
                        KG
                      </span>
                    </span>
                    <span className="text-xs font-medium text-neutral-500">
                      {mc.rolls} rolls
                    </span>
                  </div>

                  {/* Target Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                      <span>Target: {formatIndianCurrency(target)} KG</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <Link
                    href={`/production?machine=${mc.code}`}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white inline-flex items-center gap-1"
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
                <TrendingUp className="h-4 w-4 text-neutral-500" />
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
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e5e5"
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
                        <div className="rounded-lg border border-neutral-200 bg-white p-2.5 shadow-md dark:border-neutral-800 dark:bg-neutral-950 text-xs">
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {formatDateIndian(item.date)}
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                            Total:{" "}
                            <span className="font-semibold text-neutral-950 dark:text-white">
                              {formatIndianCurrency(item.totalKg)} KG
                            </span>
                          </p>
                          <p className="text-neutral-500 mt-0.5">
                            Rolls: {item.rolls}
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
                  stroke="#18181b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Comparison Bar Chart (1 Col) */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
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
                  stroke="#e5e5e5"
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
                      return (
                        <div className="rounded-lg border border-neutral-200 bg-white p-2.5 shadow-md dark:border-neutral-800 dark:bg-neutral-950 text-xs">
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            Machine {item.code}
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                            Production:{" "}
                            <span className="font-semibold text-neutral-950 dark:text-white">
                              {formatIndianCurrency(item.weight)} KG
                            </span>
                          </p>
                          <p className="text-neutral-500 mt-0.5">
                            Rolls: {item.rolls}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="weight"
                  fill="#27272a"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
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
              {data.recentRolls.map((roll) => (
                <tr
                  key={roll.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                    {roll.rollNo}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      Machine {roll.machineCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                    {roll.netWeight.toFixed(2)} KG
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {formatDateIndian(roll.date)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {roll.shift}
                  </td>
                  <td className="px-4 py-3">
                    {roll.status === "dispatched" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        Dispatched
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-500">
                    {roll.challanNo ? (
                      <Link
                        href={`/dispatch/challan/${roll.challanNo}`}
                        className="underline hover:text-neutral-900 dark:hover:text-white"
                      >
                        Challan #{roll.challanNo}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
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
