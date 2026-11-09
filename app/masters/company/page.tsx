"use client";

import { useEffect, useState } from "react";
import { Building2, Save, Check } from "lucide-react";
import { CompanyProfile } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

export default function CompanyMasterPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        const res = await fetch("/api/company");
        const json = await res.json();
        if (json.success) setProfile(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setMessage(null);
        const payload = {
          ...profile,
          defaultRate: parseFloat(String(profile.defaultRate)) || 0,
        };
        const res = await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setMessage({ type: "success", text: "Company profile updated successfully." });
      } else {
        setMessage({ type: "error", text: json.error || "Update failed." });
      }
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !hasPermission("masterCompany")) {
    return (
      <AccessDenied
        requiredPermission="masterCompany"
        moduleName="Company Profile"
      />
    );
  }

  if (loading || !profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-xs text-neutral-500 font-medium">
          Loading Company Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Company Profile & Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure legal entity details, Silvassa jurisdiction, bank account, and tax parameters
          </p>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Business Details */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
            Company Identification & Registration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                required
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Jurisdiction
              </label>
              <input
                type="text"
                value={profile.jurisdiction}
                onChange={(e) => setProfile({ ...profile, jurisdiction: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Mill / Registered Address
            </label>
            <textarea
              rows={2}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
            />
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
            Bank Details (Printed on Invoices)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={profile.bankName}
                onChange={(e) => setProfile({ ...profile, bankName: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Branch
              </label>
              <input
                type="text"
                value={profile.bankBranch}
                onChange={(e) => setProfile({ ...profile, bankBranch: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={profile.bankAccountNo}
                onChange={(e) => setProfile({ ...profile, bankAccountNo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={profile.bankIfsc}
                onChange={(e) => setProfile({ ...profile, bankIfsc: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Invoice Default Rates */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">
            Default Product & Tax Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Default Job Work Description
              </label>
              <input
                type="text"
                value={profile.defaultDescription}
                onChange={(e) => setProfile({ ...profile, defaultDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                HSN/SAC Code
              </label>
              <input
                type="text"
                value={profile.defaultHsn}
                onChange={(e) => setProfile({ ...profile, defaultHsn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div className="w-full sm:w-1/3">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Default Rate (Rs. / KG)
            </label>
            <input
              type="number"
              step="any"
              value={profile.defaultRate ?? ""}
              onChange={(e) => setProfile({ ...profile, defaultRate: e.target.value as any })}
              onBlur={() => setProfile({ ...profile, defaultRate: parseFloat(String(profile.defaultRate)) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-bold"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl sm:rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm sm:text-xs font-semibold hover:opacity-90 shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

