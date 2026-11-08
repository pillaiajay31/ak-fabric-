"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building,
  MapPin,
  Truck,
  Phone,
  Mail,
} from "lucide-react";
import { Customer } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { AccessDenied } from "@/components/AccessDenied";

export default function CustomerMasterPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState("Bhiwandi");
  const [state, setState] = useState("Maharashtra");
  const [stateCode, setStateCode] = useState("27");
  const [pincode, setPincode] = useState("421303");
  const [placeOfSupply, setPlaceOfSupply] = useState("BHIWANDI");
  const [preferredTransport, setPreferredTransport] = useState("SHIV TRANSPORT");
  const [defaultVehicleNo, setDefaultVehicleNo] = useState("DD.01.J.9713");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const resetForm = () => {
    setName("");
    setGstin("");
    setBillingAddress("");
    setShippingAddress("");
    setCity("Bhiwandi");
    setState("Maharashtra");
    setStateCode("27");
    setPincode("421303");
    setPlaceOfSupply("BHIWANDI");
    setPreferredTransport("SHIV TRANSPORT");
    setDefaultVehicleNo("");
    setPhone("");
    setEmail("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setGstin(c.gstin);
    setBillingAddress(c.billingAddress);
    setShippingAddress(c.shippingAddress);
    setCity(c.city);
    setState(c.state);
    setStateCode(c.stateCode);
    setPincode(c.pincode);
    setPlaceOfSupply(c.placeOfSupply || c.city.toUpperCase());
    setPreferredTransport(c.preferredTransport || "ROADWAYS");
    setDefaultVehicleNo(c.defaultVehicleNo || "");
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gstin.trim() || !shippingAddress.trim()) {
      setMessage({ type: "error", text: "Customer name, GSTIN, and address are required." });
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        gstin: gstin.trim().toUpperCase(),
        billingAddress: billingAddress.trim() || shippingAddress.trim(),
        shippingAddress: shippingAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        stateCode: stateCode.trim() || gstin.trim().substring(0, 2),
        pincode: pincode.trim(),
        placeOfSupply: placeOfSupply.trim().toUpperCase(),
        preferredTransport: preferredTransport.trim().toUpperCase(),
        defaultVehicleNo: defaultVehicleNo.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim(),
      };

      if (editingId) {
        const res = await fetch(`/api/customers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: "success", text: "Customer details updated." });
          setCustomers(customers.map((c) => (c.id === editingId ? json.data : c)));
          resetForm();
        } else {
          setMessage({ type: "error", text: json.error || "Update failed." });
        }
      } else {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: "success", text: "Customer created successfully." });
          setCustomers([...customers, json.data]);
          resetForm();
        } else {
          setMessage({ type: "error", text: json.error || "Addition failed." });
        }
      }
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to remove customer ${customerName}?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCustomers(customers.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.gstin.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  if (!authLoading && !hasPermission("masterCustomers")) {
    return (
      <AccessDenied
        requiredPermission="masterCustomers"
        moduleName="Customer Master"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Customer Master
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Document customer billing details, GSTIN, delivery addresses, and transport settings
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
            <span>Add Customer</span>
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

      {/* Form (Modal/Collapsible) */}
      {isAdding && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              {editingId ? "Edit Customer Profile" : "Register New Customer"}
            </h2>
            <button
              onClick={resetForm}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                  Customer / Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. M/S Pooja Shree Silk & Synthetic"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                  GSTIN (15 Digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setGstin(val);
                    if (val.length >= 2) setStateCode(val.substring(0, 2));
                  }}
                  placeholder="e.g. 27AUBPS4559D1ZH"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Billing Address (Billed To)
                </label>
                <textarea
                  rows={2}
                  required
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Jayaraj Warehouse Cum textile PARK, Bidg No E-1..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Shipping Address (Shipped To)
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Jayaraj Warehouse Cum textile PARK, Bidg No E-1..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPlaceOfSupply(e.target.value.toUpperCase());
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="27"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Default Place of Supply
                </label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value.toUpperCase())}
                  placeholder="BHIWANDI"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Preferred Transporter
                </label>
                <input
                  type="text"
                  value={preferredTransport}
                  onChange={(e) => setPreferredTransport(e.target.value.toUpperCase())}
                  placeholder="SHIV TRANSPORT"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Default Vehicle No
                </label>
                <input
                  type="text"
                  value={defaultVehicleNo}
                  onChange={(e) => setDefaultVehicleNo(e.target.value.toUpperCase())}
                  placeholder="DD.01.J.9713"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs font-mono font-semibold"
                />
              </div>
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
                {editingId ? "Save Customer" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Search & Cards */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, GSTIN..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:outline-none"
          />
        </div>
        <div className="text-xs text-neutral-500">
          {filteredCustomers.length} registered customers
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-neutral-950 dark:text-white leading-snug">
                    {c.name}
                  </h3>
                  <div className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mt-1">
                    GSTIN: {c.gstin}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    title="Edit Customer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1 rounded text-neutral-400 hover:text-red-600 transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{c.shippingAddress}</span>
                </div>
                <div className="text-[11px] text-neutral-500 pl-5">
                  {c.city}, {c.state} (Code: {c.stateCode})
                </div>
              </div>

              {/* Transport Defaults */}
              <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[11px] space-y-1 text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Place of Supply:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {c.placeOfSupply || c.city.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Default Vehicle:</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {c.defaultVehicleNo || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Preferred Transport:</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {c.preferredTransport || "ROADWAYS"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

