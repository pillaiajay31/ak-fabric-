"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  CheckSquare,
  Square,
  FileCheck,
  Building,
  Info,
} from "lucide-react";
import { Customer, ProductionRoll, Machine } from "@/lib/types";
import { formatIndianCurrency } from "@/lib/utils";
import { CalendarPicker } from "@/components/CalendarPicker";

export default function NewDispatchPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [rolls, setRolls] = useState<ProductionRoll[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [customerId, setCustomerId] = useState<string>("");
  const [challanNo, setChallanNo] = useState<string>("");
  const [challanDate, setChallanDate] = useState<string>("");
  const [transportMode, setTransportMode] = useState<string>("ROADWAYS");
  const [vehicleNo, setVehicleNo] = useState<string>("DD.01.J.9713");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("BHIWANDI");
  const [lrNo, setLrNo] = useState<string>("");
  const [transporter, setTransporter] = useState<string>("SHIV TRANSPORT");
  const [noOfBags, setNoOfBags] = useState<number>(49);
  const [ratePerKg, setRatePerKg] = useState<number>(42);
  const [fabricQuality, setFabricQuality] = useState<string>(
    "NYLON 44/10 KNITTED GREY FABRIC"
  );
  const [shippingAddress, setShippingAddress] = useState<string>("");

  // Selected roll IDs
  const [selectedRollIds, setSelectedRollIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChallanDate(new Date().toISOString().split("T")[0]);
    async function loadData() {
      try {
        setLoading(true);
        const [cRes, mRes, rRes, chRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/machines"),
          fetch("/api/rolls?status=in_stock"),
          fetch("/api/challans"),
        ]);
        const cJson = await cRes.json();
        const mJson = await mRes.json();
        const rJson = await rRes.json();
        const chJson = await chRes.json();

        if (cJson.success) {
          setCustomers(cJson.data);
          if (cJson.data.length > 0) {
            const firstCust = cJson.data[0];
            setCustomerId(firstCust.id);
            setShippingAddress(firstCust.shippingAddress);
            if (firstCust.defaultVehicleNo) setVehicleNo(firstCust.defaultVehicleNo);
            if (firstCust.placeOfSupply) setPlaceOfSupply(firstCust.placeOfSupply);
            if (firstCust.preferredTransport) setTransporter(firstCust.preferredTransport);
          }
        }
        if (mJson.success) setMachines(mJson.data);
        if (rJson.success) setRolls(rJson.data);

        // Next Challan number
        if (chJson.success && chJson.data.length > 0) {
          const numbers = chJson.data
            .map((c: { challanNo: string }) => parseInt(c.challanNo, 10))
            .filter((n: number) => !isNaN(n));
          const max = numbers.length > 0 ? Math.max(...numbers) : 0;
          setChallanNo(String(max + 1));
        } else {
          setChallanNo("1");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const selected = customers.find((c) => c.id === id);
    if (selected) {
      setShippingAddress(selected.shippingAddress);
      if (selected.defaultVehicleNo) setVehicleNo(selected.defaultVehicleNo);
      if (selected.placeOfSupply) setPlaceOfSupply(selected.placeOfSupply);
      if (selected.preferredTransport) setTransporter(selected.preferredTransport);
    }
  };

  // Roll Selection helpers
  const toggleRoll = (id: string) => {
    const next = new Set(selectedRollIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRollIds(next);
  };

  const selectAllMachine = (machineCode: string) => {
    const next = new Set(selectedRollIds);
    const machineRolls = rolls.filter((r) => r.machineCode === machineCode);
    const allSelected = machineRolls.every((r) => next.has(r.id));
    machineRolls.forEach((r) => {
      if (allSelected) next.delete(r.id);
      else next.add(r.id);
    });
    setSelectedRollIds(next);
  };

  const selectAll = () => {
    if (selectedRollIds.size === rolls.length) {
      setSelectedRollIds(new Set());
    } else {
      setSelectedRollIds(new Set(rolls.map((r) => r.id)));
    }
  };

  // Computations
  const selectedRollsList = useMemo(() => {
    return rolls.filter((r) => selectedRollIds.has(r.id));
  }, [rolls, selectedRollIds]);

  const totalSelectedRolls = selectedRollsList.length;
  const totalSelectedWeight = useMemo(() => {
    return Number(
      selectedRollsList.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2)
    );
  }, [selectedRollsList]);

  // Machine breakdown for summary
  const machineBreakdown = useMemo(() => {
    const map: Record<string, { rolls: number; weight: number }> = {};
    for (const r of selectedRollsList) {
      if (!map[r.machineCode]) map[r.machineCode] = { rolls: 0, weight: 0 };
      map[r.machineCode].rolls += 1;
      map[r.machineCode].weight = Number(
        (map[r.machineCode].weight + r.netWeight).toFixed(2)
      );
    }
    return map;
  }, [selectedRollsList]);

  const machineSummaryPreview = useMemo(() => {
    if (totalSelectedRolls === 0) return "No rolls selected yet.";
    const parts = Object.entries(machineBreakdown).map(
      ([mc, val]) => `WEIGHT (${mc}) ${val.weight.toFixed(2)} KG`
    );
    return `TOTAL ${parts.join(" + ")} = ${totalSelectedWeight.toFixed(2)} KG`;
  }, [machineBreakdown, totalSelectedWeight, totalSelectedRolls]);

  // Financial calculations
  const taxableAmount = Number((totalSelectedWeight * ratePerKg).toFixed(2));
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const isInterState =
    selectedCustomer?.stateCode !== "26"; // 26 = Dadra & Nagar Haveli
  const igstAmount = isInterState
    ? Number(((taxableAmount * 5) / 100).toFixed(2))
    : 0;
  const cgstAmount = !isInterState
    ? Number(((taxableAmount * 2.5) / 100).toFixed(2))
    : 0;
  const utgstAmount = !isInterState
    ? Number(((taxableAmount * 2.5) / 100).toFixed(2))
    : 0;
  const grandTotal = Math.round(
    taxableAmount + (isInterState ? igstAmount : cgstAmount + utgstAmount)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (!vehicleNo.trim()) {
      setError("Please enter the vehicle number.");
      return;
    }
    if (!placeOfSupply.trim()) {
      setError("Please enter place of supply.");
      return;
    }
    if (selectedRollsList.length === 0) {
      setError("Please select at least 1 roll from available inventory.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        customerId,
        challanNo: challanNo.trim(),
        challanDate,
        transportMode: transportMode.trim().toUpperCase(),
        vehicleNo: vehicleNo.trim().toUpperCase(),
        placeOfSupply: placeOfSupply.trim().toUpperCase(),
        lrNo: lrNo.trim(),
        transporter: transporter.trim().toUpperCase(),
        noOfBags: Number(noOfBags),
        ratePerKg: Number(ratePerKg),
        fabricQuality,
        shippingAddress,
        rolls: selectedRollsList.map((r) => ({
          rollNo: r.rollNo,
          netWeight: r.netWeight,
          machineCode: r.machineCode,
        })),
        autoGenerateInvoice: true,
      };

      const res = await fetch("/api/challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        // Redirect to the newly generated Delivery Challan
        router.push(`/dispatch/challan/${json.data.challan.challanNo}`);
      } else {
        setError(json.error || "Failed to create dispatch.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dispatch"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Create Delivery Challan & Tax Invoice
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select customer, vehicle & transport details, and assign knitted fabric rolls
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Customer & Document Info */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <Building className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              1. Customer & Challan Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Customer Dropdown */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                Recipient Customer (Billed To / Shipped To)
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-medium focus:ring-1 focus:ring-neutral-950"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — GSTIN: {c.gstin} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Challan No */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                Challan & Invoice No
              </label>
              <input
                type="text"
                required
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                placeholder="e.g. 23"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-sm font-bold"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Address of Delivery / Shipped To
            </label>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <CalendarPicker
                label="Challan / Supply Date"
                value={challanDate}
                onChange={(val) => setChallanDate(val)}
                size="sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Number of Bags
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={noOfBags}
                onChange={(e) => setNoOfBags(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Job Work Rate (Rs. / KG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs font-bold"
                />
                <span className="absolute right-3 top-3 sm:top-2 text-xs text-neutral-500 font-semibold">
                  Rs.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Transport Details (Explicitly requested) */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <Truck className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              2. Vehicle & Transport Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Transport Mode */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                Transport Mode
              </label>
              <input
                type="text"
                required
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value.toUpperCase())}
                placeholder="e.g. ROADWAYS"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-semibold"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Default: ROADWAYS
              </span>
            </div>

            {/* Vehicle No */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                Vehicle No
              </label>
              <input
                type="text"
                required
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                placeholder="e.g. DD.01.J.9713"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-bold tracking-wide"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                e.g. DD.01.J.9713
              </span>
            </div>

            {/* Place of Supply */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                Place of Supply
              </label>
              <input
                type="text"
                required
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value.toUpperCase())}
                placeholder="e.g. BHIWANDI"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-base sm:text-xs font-semibold"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Destination hub (e.g. BHIWANDI)
              </span>
            </div>

            {/* L.R. No (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                L.R. No (Optional)
              </label>
              <input
                type="text"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value)}
                placeholder="Optional lorry receipt no"
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Leave blank if pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Transporter Name
              </label>
              <input
                type="text"
                value={transporter}
                onChange={(e) => setTransporter(e.target.value.toUpperCase())}
                placeholder="e.g. SHIV TRANSPORT"
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Fabric Quality Description
              </label>
              <input
                type="text"
                value={fabricQuality}
                onChange={(e) => setFabricQuality(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-base sm:text-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Roll Selection */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                3. Assign Fabric Rolls from In-Stock Inventory
              </h2>
              <p className="text-xs text-neutral-500">
                Select rolls to pack in this delivery. Click machine badges to select by line.
              </p>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-[11px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {selectedRollIds.size === rolls.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              {machines.map((m) => {
                const count = rolls.filter((r) => r.machineCode === m.code).length;
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => selectAllMachine(m.code)}
                    className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-[11px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    + Machine {m.code} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Roll Checklist Grid */}
          {rolls.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No available rolls in stock. Please log new rolls in Production Entry first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-80 overflow-y-auto p-1 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              {rolls.map((r) => {
                const isChecked = selectedRollIds.has(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRoll(r.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded border text-left transition-all ${
                      isChecked
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-sm"
                        : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
                    }`}
                  >
                    <span className="text-[11px] font-bold">{r.rollNo}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isChecked
                          ? "text-neutral-300 dark:text-neutral-700 font-semibold"
                          : "text-neutral-500"
                      }`}
                    >
                      {r.netWeight.toFixed(2)} KG
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Machine Summary Breakdown Bar */}
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-neutral-900 dark:text-white">
              <span>Selected for Dispatch:</span>
              <span>
                {totalSelectedRolls} Rolls · {totalSelectedWeight.toFixed(2)} KG
              </span>
            </div>

            <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2.5 rounded border border-neutral-200 dark:border-neutral-800">
              {machineSummaryPreview}
            </div>

            {/* Financial estimate */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">
                  Taxable Value (@ Rs. {ratePerKg}/KG)
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  Rs. {formatIndianCurrency(taxableAmount)}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px]">
                  {isInterState ? "IGST @ 5.0%" : "CGST + UTGST @ 5%"}
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  Rs. {formatIndianCurrency(isInterState ? igstAmount : cgstAmount + utgstAmount)}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px]">
                  Estimated Bags
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {noOfBags} Bags
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px]">
                  Grand Total
                </span>
                <span className="font-extrabold text-neutral-950 dark:text-white">
                  Rs. {formatIndianCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <Link
            href="/dispatch"
            className="w-full sm:w-auto text-center px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || totalSelectedRolls === 0}
            className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm sm:text-xs font-semibold hover:opacity-90 shadow-sm disabled:opacity-50"
          >
            {submitting
              ? "Generating Documents..."
              : `Create Challan & Tax Invoice #${challanNo}`}
          </button>
        </div>
      </form>
    </div>
  );
}
