"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Filter,
  ArrowRight,
  ListPlus,
  Scale,
} from "lucide-react";
import { ProductionRoll, Machine } from "@/lib/types";
import { formatIndianCurrency } from "@/lib/utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

export default function ProductionPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [rolls, setRolls] = useState<ProductionRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single Roll Form State
  const [selectedMachine, setSelectedMachine] = useState<string>("A");
  const [rollNo, setRollNo] = useState<string>("");
  const [netWeight, setNetWeight] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [shift, setShift] = useState<"Day" | "Night">("Day");
  const [operator, setOperator] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Batch Mode State
  const [batchMachine, setBatchMachine] = useState<string>("A");
  const [batchStartNumber, setBatchStartNumber] = useState<number>(1001);
  const [batchDate, setBatchDate] = useState<string>("");
  const [batchShift, setBatchShift] = useState<"Day" | "Night">("Day");
  const [batchRows, setBatchRows] = useState<Array<{ id: number; weight: string }>>([
    { id: 1, weight: "" },
    { id: 2, weight: "" },
    { id: 3, weight: "" },
    { id: 4, weight: "" },
    { id: 5, weight: "" },
  ]);

  // Filtering State
  const [filterMachine, setFilterMachine] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSearch, setFilterSearch] = useState<string>("");

  // Editing State
  const [editingRollId, setEditingRollId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mcRes, rollsRes] = await Promise.all([
        fetch("/api/machines"),
        fetch("/api/rolls"),
      ]);
      const mcJson = await mcRes.json();
      const rollsJson = await rollsRes.json();

      if (mcJson.success) {
        setMachines(mcJson.data);
        if (mcJson.data.length > 0) {
          const firstCode = mcJson.data[0].code;
          setSelectedMachine(firstCode);
          setBatchMachine(firstCode);
        }
      }
      if (rollsJson.success) {
        setRolls(rollsJson.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    setBatchDate(today);
    fetchData();
  }, []);

  // Compute next suggested roll number whenever machine changes
  useEffect(() => {
    if (!rolls.length) {
      setRollNo(`${selectedMachine}.1001`);
      setBatchStartNumber(1001);
      return;
    }

    const machineRolls = rolls.filter((r) => r.machineCode === selectedMachine);
    let maxNum = 1000;
    for (const r of machineRolls) {
      const parts = r.rollNo.split(".");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    setRollNo(`${selectedMachine}.${nextNum}`);
    setBatchStartNumber(nextNum);
  }, [selectedMachine, rolls]);

  // Handle Single Roll Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo || !netWeight || isNaN(Number(netWeight)) || Number(netWeight) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid weight in KG." });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch("/api/rolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: rollNo.trim().toUpperCase(),
          machineCode: selectedMachine,
          netWeight: Number(netWeight),
          fabricQuality: "Nylon 44/10 knitted grey fabric",
          date,
          shift,
          operator,
          notes,
          status: "in_stock",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Roll ${rollNo} (${Number(netWeight).toFixed(2)} KG) logged successfully.`,
        });
        setRolls([json.data, ...rolls]);
        setNetWeight("");
        setNotes("");

        // Prime the next roll number
        const parts = rollNo.split(".");
        if (parts.length > 1) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num)) {
            setRollNo(`${selectedMachine}.${num + 1}`);
          }
        }
      } else {
        setMessage({ type: "error", text: json.error || "Failed to log roll" });
      }
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Batch Submit
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter(
      (r) => r.weight.trim() !== "" && !isNaN(Number(r.weight)) && Number(r.weight) > 0
    );

    if (validRows.length === 0) {
      setMessage({ type: "error", text: "Please enter at least one valid roll weight." });
      return;
    }

    const payload = validRows.map((r, index) => ({
      rollNo: `${batchMachine}.${batchStartNumber + index}`,
      machineCode: batchMachine,
      netWeight: Number(r.weight),
      fabricQuality: "Nylon 44/10 knitted grey fabric",
      date: batchDate,
      shift: batchShift,
      notes: "Batch floor weigh-in",
    }));

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch("/api/rolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolls: payload }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Successfully logged batch of ${payload.length} rolls!`,
        });
        setRolls([...json.data, ...rolls]);
        // Reset rows
        setBatchRows([
          { id: 1, weight: "" },
          { id: 2, weight: "" },
          { id: 3, weight: "" },
          { id: 4, weight: "" },
          { id: 5, weight: "" },
        ]);
        setBatchStartNumber(batchStartNumber + payload.length);
      } else {
        setMessage({ type: "error", text: json.error || "Batch submission failed" });
      }
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  // Roll Edit
  const handleSaveEdit = async (id: string) => {
    if (!editWeight || isNaN(Number(editWeight)) || Number(editWeight) <= 0) return;
    try {
      const res = await fetch(`/api/rolls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ netWeight: Number(editWeight) }),
      });
      const json = await res.json();
      if (json.success) {
        setRolls(rolls.map((r) => (r.id === id ? json.data : r)));
        setEditingRollId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Roll Delete
  const handleDeleteRoll = async (id: string, rollNumber: string) => {
    if (!confirm(`Are you sure you want to delete roll ${rollNumber}?`)) return;
    try {
      const res = await fetch(`/api/rolls/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setRolls(rolls.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Rolls list
  const filteredRolls = useMemo(() => {
    return rolls.filter((r) => {
      const matchesMachine =
        filterMachine === "ALL" || r.machineCode === filterMachine;
      const matchesStatus =
        filterStatus === "ALL" || r.status === filterStatus;
      const matchesSearch =
        !filterSearch ||
        r.rollNo.toLowerCase().includes(filterSearch.toLowerCase());
      return matchesMachine && matchesStatus && matchesSearch;
    });
  }, [rolls, filterMachine, filterStatus, filterSearch]);

  const totalFilteredWeight = useMemo(() => {
    return Number(
      filteredRolls.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2)
    );
  }, [filteredRolls]);

  if (!authLoading && !hasPermission("productionRollEntry")) {
    return (
      <AccessDenied
        requiredPermission="productionRollEntry"
        moduleName="Roll Production Entry"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Production Entry
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Log knitted fabric rolls with machine assignment and certified net weight
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "single"
                ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Single Roll Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "batch"
                ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <ListPlus className="h-3.5 w-3.5" />
            <span>Batch Weigh-In</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
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

      {/* MODE 1: SINGLE ROLL ENTRY */}
      {mode === "single" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white mb-4">
            New Fabric Roll Entry
          </h2>

          <form onSubmit={handleSingleSubmit} className="space-y-6">
            {/* Machine Selector Buttons (Large & Accessible) */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Select Knitting Machine
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {machines.map((mc) => {
                  const isSelected = selectedMachine === mc.code;
                  return (
                    <button
                      key={mc.code}
                      type="button"
                      onClick={() => setSelectedMachine(mc.code)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                      }`}
                    >
                      <span className="text-lg font-bold tracking-tight">
                        Machine {mc.code}
                      </span>
                      <span
                        className={`text-[11px] mt-0.5 ${
                          isSelected
                            ? "text-neutral-300 dark:text-neutral-600"
                            : "text-neutral-500"
                        }`}
                      >
                        Prefix: {mc.rollPrefix}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Roll Number */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                  placeholder="e.g. C.1665"
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-sm font-semibold tracking-wide focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Auto-incremented from latest Machine {selectedMachine} roll
                </span>
              </div>

              {/* Net Weight in KG (Prominent Box) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                  Net Weight (in KG)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="100"
                    inputMode="decimal"
                    required
                    autoFocus
                    value={netWeight}
                    onChange={(e) => setNetWeight(e.target.value)}
                    placeholder="e.g. 18.15"
                    className="w-full px-3 py-3 rounded-xl border-2 border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-lg font-bold tracking-tight focus:outline-none"
                  />
                  <span className="absolute right-3 top-3 text-xs font-semibold text-neutral-500">
                    KG
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Standard roll net weight: 17.50 — 18.50 KG
                </span>
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Production Shift
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShift("Day")}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      shift === "Day"
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                    }`}
                  >
                    Day Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift("Night")}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      shift === "Night"
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                    }`}
                  >
                    Night Shift
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <CalendarPicker
                  label="Production Date"
                  value={date}
                  onChange={(val) => setDate(val)}
                  size="sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Operator Name (Optional)
                </label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Fabric Quality
                </label>
                <input
                  type="text"
                  readOnly
                  value="Nylon 44/10 knitted grey fabric"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
              >
                {submitting ? "Logging Roll..." : "Save Roll to Inventory"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 2: BATCH WEIGH-IN */}
      {mode === "batch" && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                Rapid Batch Weigh-In Mode
              </h2>
              <p className="text-xs text-neutral-500">
                Quickly weigh multiple rolls sequentially for high-volume floor shifts
              </p>
            </div>
          </div>

          <form onSubmit={handleBatchSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Machine
                </label>
                <select
                  value={batchMachine}
                  onChange={(e) => setBatchMachine(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-medium"
                >
                  {machines.map((mc) => (
                    <option key={mc.code} value={mc.code}>
                      Machine {mc.code} (Prefix: {mc.rollPrefix})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Starting Roll Number
                </label>
                <input
                  type="number"
                  value={batchStartNumber}
                  onChange={(e) => setBatchStartNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
                />
              </div>

              <div>
                <CalendarPicker
                  label="Date"
                  value={batchDate}
                  onChange={(val) => setBatchDate(val)}
                  size="sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Shift
                </label>
                <select
                  value={batchShift}
                  onChange={(e) => setBatchShift(e.target.value as "Day" | "Night")}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-medium"
                >
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
            </div>

            {/* Weigh-in rows table */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Enter Net Weight (KG) for each roll:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {batchRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col gap-1"
                  >
                    <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {batchMachine}.{batchStartNumber + idx}
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 18.15"
                      value={row.weight}
                      onChange={(e) => {
                        const newRows = [...batchRows];
                        newRows[idx].weight = e.target.value;
                        setBatchRows(newRows);
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white text-sm font-bold focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setBatchRows([
                      ...batchRows,
                      { id: batchRows.length + 1, weight: "" },
                      { id: batchRows.length + 2, weight: "" },
                      { id: batchRows.length + 3, weight: "" },
                    ])
                  }
                  className="text-xs font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white border border-dashed border-neutral-300 dark:border-neutral-700 px-3 py-1.5 rounded-md"
                >
                  + Add 3 More Rows
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Filled Rolls:{" "}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {batchRows.filter((r) => r.weight.trim() !== "").length}
                </span>{" "}
                | Total Weight:{" "}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {batchRows
                    .reduce((acc, r) => acc + (parseFloat(r.weight) || 0), 0)
                    .toFixed(2)}{" "}
                  KG
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 shadow-sm disabled:opacity-50"
              >
                {submitting ? "Saving Batch..." : "Submit Batch Rolls"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLLS LOG & INVENTORY TABLE */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              Roll Inventory & Production History
            </h3>
            <p className="text-xs text-neutral-500">
              Showing {filteredRolls.length} rolls ({formatIndianCurrency(totalFilteredWeight)} KG)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search roll no..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Filter Machine */}
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

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-medium text-neutral-900 dark:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="dispatched">Dispatched</option>
            </select>
          </div>
        </div>

        {/* MOBILE VIEW: Compact Roll Cards (md:hidden) */}
        <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
          {filteredRolls.slice(0, 50).map((r) => {
            const isEditing = editingRollId === r.id;
            return (
              <div key={r.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-950 dark:text-white">
                      {r.rollNo}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      M/C {r.machineCode}
                    </span>
                  </div>

                  {r.status === "dispatched" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      Dispatched
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                      In Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.05"
                          inputMode="decimal"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="w-20 px-2 py-1 rounded border border-neutral-950 text-xs font-bold"
                        />
                        <button
                          onClick={() => handleSaveEdit(r.id)}
                          className="p-1 rounded bg-neutral-900 text-white text-xs"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-base font-extrabold text-neutral-950 dark:text-white">
                        {r.netWeight.toFixed(2)} <span className="text-xs font-normal text-neutral-500">KG</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-neutral-500 text-right">
                    <div>{r.date} · {r.shift} Shift</div>
                    {r.challanNo && <div className="font-medium text-neutral-700">Challan #{r.challanNo}</div>}
                  </div>
                </div>

                {r.status !== "dispatched" && !isEditing && (
                  <div className="flex justify-end gap-3 pt-1 text-xs">
                    <button
                      onClick={() => {
                        setEditingRollId(r.id);
                        setEditWeight(r.netWeight.toString());
                      }}
                      className="text-neutral-600 hover:text-neutral-950 font-medium"
                    >
                      Edit Wt
                    </button>
                    <button
                      onClick={() => handleDeleteRoll(r.id, r.rollNo)}
                      className="text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DESKTOP VIEW: Table Content (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-medium">Sr No</th>
                <th className="px-4 py-3 font-medium">Roll No</th>
                <th className="px-4 py-3 font-medium">Machine</th>
                <th className="px-4 py-3 font-medium">Net Wt (KG)</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Shift</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Dispatch Reference</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredRolls.slice(0, 50).map((r, index) => {
                const isEditing = editingRollId === r.id;
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-400">{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">
                      {r.rollNo}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        Machine {r.machineCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.05"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-neutral-950 dark:border-white text-xs font-bold"
                          />
                          <button
                            onClick={() => handleSaveEdit(r.id)}
                            className="p-1 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {r.netWeight.toFixed(2)} KG
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {r.shift}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "dispatched" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          Dispatched
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {r.challanNo ? `Challan #${r.challanNo}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== "dispatched" && (
                          <>
                            <button
                              onClick={() => {
                                setEditingRollId(r.id);
                                setEditWeight(r.netWeight.toString());
                              }}
                              className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                              title="Edit Weight"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoll(r.id, r.rollNo)}
                              className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors"
                              title="Delete Roll"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
