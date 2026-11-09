"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  ShieldCheck,
  Gauge,
  Activity,
} from "lucide-react";
import { Machine } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

export default function MachineMasterPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [rollPrefix, setRollPrefix] = useState("");
  const [dailyTargetKg, setDailyTargetKg] = useState<number | string>(450);
  const [status, setStatus] = useState<"active" | "maintenance" | "idle">("active");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/machines");
      const json = await res.json();
      if (json.success) setMachines(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const resetForm = () => {
    setCode("");
    setName("");
    setModel("");
    setRollPrefix("");
    setDailyTargetKg(450);
    setStatus("active");
    setNotes("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (m: Machine) => {
    setEditingId(m.id);
    setCode(m.code);
    setName(m.name);
    setModel(m.model);
    setRollPrefix(m.rollPrefix);
    setDailyTargetKg(m.dailyTargetKg);
    setStatus(m.status);
    setNotes(m.notes || "");
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !rollPrefix) {
      setMessage({ type: "error", text: "Please enter code, name, and roll prefix." });
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/machines/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            model: model.trim(),
            rollPrefix: rollPrefix.trim().toUpperCase(),
            dailyTargetKg: Number(dailyTargetKg),
            status,
            notes,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: "success", text: "Machine updated successfully." });
          setMachines(machines.map((m) => (m.id === editingId ? json.data : m)));
          resetForm();
        } else {
          setMessage({ type: "error", text: json.error || "Update failed." });
        }
      } else {
        const res = await fetch("/api/machines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            model: model.trim(),
            rollPrefix: rollPrefix.trim().toUpperCase(),
            dailyTargetKg: Number(dailyTargetKg),
            status,
            notes,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: "success", text: "New machine added to fleet." });
          setMachines([...machines, json.data]);
          resetForm();
        } else {
          setMessage({ type: "error", text: json.error || "Addition failed." });
        }
      }
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    }
  };

  const handleDelete = async (id: string, machineCode: string) => {
    if (!confirm(`Are you sure you want to remove Machine ${machineCode}?`)) return;
    try {
      const res = await fetch(`/api/machines/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setMachines(machines.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!authLoading && !hasPermission("masterMachines")) {
    return (
      <AccessDenied
        requiredPermission="masterMachines"
        moduleName="Machine Master"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Machine Master
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Documentation and operational parameters of company knitting machines
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Machine</span>
          </button>
        )}
      </div>

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

      {/* Machine Form (Collapsible / Modal state) */}
      {isAdding && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              {editingId ? "Edit Machine Parameters" : "Register New Machine"}
            </h2>
            <button
              onClick={resetForm}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                  Machine Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                  Machine Name / Description
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Knitting Machine A"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                  Roll Prefix
                </label>
                <input
                  type="text"
                  required
                  value={rollPrefix}
                  onChange={(e) => setRollPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. A."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Model & Gauge / Diameter
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder='e.g. Circular Single Jersey 24G 30"'
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Daily Target (KG)
                </label>
                <input
                  type="number"
                  value={dailyTargetKg}
                  onChange={(e) => setDailyTargetKg(e.target.value)}
                  onBlur={() => {
                    if (dailyTargetKg === "" || Number(dailyTargetKg) < 0) {
                      setDailyTargetKg(0);
                    } else {
                      setDailyTargetKg(Number(dailyTargetKg));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "active" | "maintenance" | "idle")
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-medium"
                >
                  <option value="active">Active (In Production)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="idle">Idle</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Technical Notes / Fabric Compatibility
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 44/10 Nylon continuous filament grey fabric line"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 shadow-sm"
              >
                {editingId ? "Save Changes" : "Save Machine"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4 Machines Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-base">
                  {m.code}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-950 dark:text-white">
                    {m.name}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Roll Prefix: {m.rollPrefix}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    m.status === "active"
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {m.status}
                </span>

                <button
                  onClick={() => handleEditClick(m)}
                  className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  title="Edit Machine"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-neutral-500 block text-[11px]">
                  Model / Specifications
                </span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {m.model || "Circular Knitting"}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">
                  Daily Production Target
                </span>
                <span className="font-semibold text-neutral-950 dark:text-white">
                  {m.dailyTargetKg} KG / Day
                </span>
              </div>
            </div>

            {m.notes && (
              <div className="text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded border border-neutral-100 dark:border-neutral-800">
                {m.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
