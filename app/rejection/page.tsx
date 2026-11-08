"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertOctagon,
  Plus,
  Trash2,
  Filter,
  BarChart2,
  Scissors,
} from "lucide-react";
import { RejectionLog, Machine } from "@/lib/types";
import { formatIndianCurrency } from "@/lib/utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

const DEFECT_REASONS = [
  "Oil Stain",
  "Yarn Breakage / Missed Loop",
  "Hole / Needle Drop",
  "GSM Variation",
  "Lycra Drop / Streaks",
  "Tension Mark / Barriness",
  "Edge Curl / Selvage Damage",
  "Other Floor Defect",
];

const ACTIONS = ["Scrap", "Recycled", "B-Grade Sale"] as const;

export default function RejectionPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [rejections, setRejections] = useState<RejectionLog[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [machineCode, setMachineCode] = useState<string>("A");
  const [rollNo, setRollNo] = useState<string>("");
  const [netWeight, setNetWeight] = useState<string>("");
  const [reason, setReason] = useState<string>(DEFECT_REASONS[0]);
  const [action, setAction] = useState<"Scrap" | "Recycled" | "B-Grade Sale">("Scrap");
  const [date, setDate] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter
  const [filterMachine, setFilterMachine] = useState<string>("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mcRes, rejRes] = await Promise.all([
        fetch("/api/machines"),
        fetch("/api/rejections"),
      ]);
      const mcJson = await mcRes.json();
      const rejJson = await rejRes.json();

      if (mcJson.success) setMachines(mcJson.data);
      if (rejJson.success) setRejections(rejJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    setTodayStr(today);
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netWeight || isNaN(Number(netWeight)) || Number(netWeight) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid rejected weight in KG." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch("/api/rejections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineCode,
          rollNo: rollNo.trim().toUpperCase(),
          netWeight: Number(netWeight),
          reason,
          action,
          date,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Rejection of ${Number(netWeight).toFixed(2)} KG logged successfully.`,
        });
        setRejections([json.data, ...rejections]);
        setNetWeight("");
        setRollNo("");
        setNotes("");
      } else {
        setMessage({ type: "error", text: json.error || "Failed to log rejection" });
      }
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rejection entry?")) return;
    try {
      const res = await fetch(`/api/rejections/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setRejections(rejections.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const todayRejections = useMemo(
    () => rejections.filter((r) => r.date === todayStr),
    [rejections, todayStr]
  );
  const todayKg = useMemo(
    () => todayRejections.reduce((sum, r) => sum + r.netWeight, 0),
    [todayRejections]
  );
  const totalKg = useMemo(
    () => rejections.reduce((sum, r) => sum + r.netWeight, 0),
    [rejections]
  );

  const filteredRejections = useMemo(() => {
    if (filterMachine === "ALL") return rejections;
    return rejections.filter((r) => r.machineCode === filterMachine);
  }, [rejections, filterMachine]);

  if (!authLoading && !hasPermission("productionRejection")) {
    return (
      <AccessDenied
        requiredPermission="productionRejection"
        moduleName="Fabric Rejection & Defect Log"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Fabric Rejection & Defect Log
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Record off-quality fabric, needle marks, oil stains, and floor wastage
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Rejected Today
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(todayKg)}
            </span>
            <span className="text-sm font-medium text-neutral-500">KG</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {todayRejections.length} entries recorded today
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Cumulative Rejections
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              {formatIndianCurrency(totalKg)}
            </span>
            <span className="text-sm font-medium text-neutral-500">KG</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Across {rejections.length} total logged incidents
          </span>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Primary Defect Cause
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Oil Stain & Yarn Cut
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Action: B-Grade or Salvage
          </span>
        </div>
      </div>

      {/* Entry Form */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white mb-4">
          Log Defective Fabric / Scrap
        </h2>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center justify-between border ${
              message.type === "success"
                ? "bg-neutral-100 border-neutral-300 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Machine */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Knitting Machine
              </label>
              <select
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs font-medium"
              >
                {machines.map((m) => (
                  <option key={m.code} value={m.code}>
                    Machine {m.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Roll Number (Optional) */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Roll No / Piece (Optional)
              </label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                placeholder="e.g. C.1690"
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs"
              />
            </div>

            {/* Rejected Weight */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                Rejected Net Weight (KG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  inputMode="decimal"
                  required
                  value={netWeight}
                  onChange={(e) => setNetWeight(e.target.value)}
                  placeholder="e.g. 12.40"
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-sm font-bold"
                />
                <span className="absolute right-3 top-3 sm:top-2.5 text-xs text-neutral-500 font-semibold">
                  KG
                </span>
              </div>
            </div>

            {/* Date */}
            <div>
              <CalendarPicker
                label="Incident Date"
                value={date}
                onChange={(val) => setDate(val)}
                size="sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Defect Reason */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Defect Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs font-medium"
              >
                {DEFECT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Taken */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Action / Disposition
              </label>
              <select
                value={action}
                onChange={(e) =>
                  setAction(e.target.value as "Scrap" | "Recycled" | "B-Grade Sale")
                }
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs font-medium"
              >
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Root Cause Observation
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Needle broken on track 3"
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl sm:rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm sm:text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Rejection Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* Rejections Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              Defect & Rejection Records
            </h3>
            <p className="text-xs text-neutral-500">
              Showing {filteredRejections.length} rejection logs
            </p>
          </div>

          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-medium text-neutral-900 dark:text-white"
          >
            <option value="ALL">All Machines</option>
            {machines.map((m) => (
              <option key={m.code} value={m.code}>
                Machine {m.code}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
          {filteredRejections.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No defect or rejection entries found.
            </div>
          ) : (
            filteredRejections.map((rej) => (
              <div key={rej.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                      Machine {rej.machineCode}
                    </span>
                    {rej.rollNo && (
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                        {rej.rollNo}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {rej.date}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-semibold text-neutral-950 dark:text-white">
                      {rej.reason}
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      {rej.action}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-neutral-950 dark:text-white">
                      {rej.netWeight.toFixed(2)} KG
                    </div>
                  </div>
                </div>

                {rej.notes && (
                  <p className="text-[11px] text-neutral-500 italic bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded">
                    {rej.notes}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleDelete(rej.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Machine</th>
                <th className="px-4 py-3 font-medium">Roll No</th>
                <th className="px-4 py-3 font-medium">Defect Reason</th>
                <th className="px-4 py-3 font-medium">Weight (KG)</th>
                <th className="px-4 py-3 font-medium">Disposition</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredRejections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    No defect or rejection entries found.
                  </td>
                </tr>
              ) : (
                filteredRejections.map((rej) => (
                  <tr
                    key={rej.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {rej.date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        Machine {rej.machineCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                      {rej.rollNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 dark:text-white font-medium">
                      {rej.reason}
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">
                      {rej.netWeight.toFixed(2)} KG
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {rej.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 max-w-xs truncate">
                      {rej.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(rej.id)}
                        className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
