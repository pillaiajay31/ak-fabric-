import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const defaultStart = `${year}-${month}-01`;
    const defaultEnd = `${year}-${month}-${day}`;

    let startDate = startDateParam || defaultStart;
    let endDate = endDateParam || defaultEnd;

    // Ensure startDate <= endDate
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    // Calculate number of calendar days in range
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const invoices = await store.getInvoices();

    // Filter invoices within range
    const periodInvoices = invoices.filter((inv) => {
      const invDate =
        inv.invoiceDate ||
        (inv.createdAt ? inv.createdAt.split("T")[0] : "");
      return invDate >= startDate && invDate <= endDate;
    });

    // Summary totals for selected period
    let periodTotalAmount = 0;
    let periodTaxableAmount = 0;
    let periodGstAmount = 0;
    let periodCgstAmount = 0;
    let periodUtgstAmount = 0;
    let periodIgstAmount = 0;
    let periodDispatchedKg = 0;
    let periodTotalRolls = 0;

    periodInvoices.forEach((inv) => {
      periodTotalAmount += Number(inv.grandTotal || 0);
      periodTaxableAmount += Number(inv.taxableAmount || 0);
      const cgst = Number(inv.cgstAmount || 0);
      const utgst = Number(inv.utgstAmount || 0);
      const igst = Number(inv.igstAmount || 0);
      periodCgstAmount += cgst;
      periodUtgstAmount += utgst;
      periodIgstAmount += igst;
      periodGstAmount += cgst + utgst + igst;
      periodDispatchedKg += Number(inv.quantityKg || 0);
      periodTotalRolls += Number(inv.noOfRolls || 0);
    });

    periodTotalAmount = Number(periodTotalAmount.toFixed(2));
    periodTaxableAmount = Number(periodTaxableAmount.toFixed(2));
    periodGstAmount = Number(periodGstAmount.toFixed(2));
    periodCgstAmount = Number(periodCgstAmount.toFixed(2));
    periodUtgstAmount = Number(periodUtgstAmount.toFixed(2));
    periodIgstAmount = Number(periodIgstAmount.toFixed(2));
    periodDispatchedKg = Number(periodDispatchedKg.toFixed(2));

    const periodInvoiceCount = periodInvoices.length;
    const averageInvoiceValue =
      periodInvoiceCount > 0
        ? Number((periodTotalAmount / periodInvoiceCount).toFixed(2))
        : 0;
    const averageRatePerKg =
      periodDispatchedKg > 0
        ? Number((periodTaxableAmount / periodDispatchedKg).toFixed(2))
        : 42;

    // Daily Trend generation
    const dailyMap: Record<
      string,
      {
        date: string;
        dateLabel: string;
        taxableAmount: number;
        gstAmount: number;
        grandTotal: number;
        quantityKg: number;
        invoiceCount: number;
      }
    > = {};

    // Initialize all days in range (up to 35 days for clean display)
    if (daysCount <= 45) {
      const cursor = new Date(startDate);
      while (cursor <= endObj) {
        const dStr = cursor.toISOString().split("T")[0];
        const dayNum = String(cursor.getDate()).padStart(2, "0");
        const monthShort = cursor.toLocaleDateString("en-US", { month: "short" });
        dailyMap[dStr] = {
          date: dStr,
          dateLabel: `${dayNum} ${monthShort}`,
          taxableAmount: 0,
          gstAmount: 0,
          grandTotal: 0,
          quantityKg: 0,
          invoiceCount: 0,
        };
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    periodInvoices.forEach((inv) => {
      const dStr =
        inv.invoiceDate ||
        (inv.createdAt ? inv.createdAt.split("T")[0] : "");
      if (!dailyMap[dStr]) {
        const invDateObj = new Date(dStr);
        const dayNum = isNaN(invDateObj.getTime())
          ? dStr
          : String(invDateObj.getDate()).padStart(2, "0");
        const monthShort = isNaN(invDateObj.getTime())
          ? ""
          : invDateObj.toLocaleDateString("en-US", { month: "short" });
        dailyMap[dStr] = {
          date: dStr,
          dateLabel: `${dayNum} ${monthShort}`,
          taxableAmount: 0,
          gstAmount: 0,
          grandTotal: 0,
          quantityKg: 0,
          invoiceCount: 0,
        };
      }
      dailyMap[dStr].taxableAmount = Number(
        (dailyMap[dStr].taxableAmount + Number(inv.taxableAmount || 0)).toFixed(2)
      );
      const gst =
        Number(inv.cgstAmount || 0) +
        Number(inv.utgstAmount || 0) +
        Number(inv.igstAmount || 0);
      dailyMap[dStr].gstAmount = Number(
        (dailyMap[dStr].gstAmount + gst).toFixed(2)
      );
      dailyMap[dStr].grandTotal = Number(
        (dailyMap[dStr].grandTotal + Number(inv.grandTotal || 0)).toFixed(2)
      );
      dailyMap[dStr].quantityKg = Number(
        (dailyMap[dStr].quantityKg + Number(inv.quantityKg || 0)).toFixed(2)
      );
      dailyMap[dStr].invoiceCount += 1;
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Customer Breakdown
    const customerMap: Record<
      string,
      {
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
    > = {};

    periodInvoices.forEach((inv) => {
      const cId = inv.customerId || inv.customerName || "other";
      if (!customerMap[cId]) {
        customerMap[cId] = {
          customerId: inv.customerId,
          customerName: inv.customerName || "Customer",
          customerGstin: inv.customerGstin || "-",
          invoiceCount: 0,
          quantityKg: 0,
          taxableAmount: 0,
          gstAmount: 0,
          grandTotal: 0,
          percentage: 0,
        };
      }
      customerMap[cId].invoiceCount += 1;
      customerMap[cId].quantityKg = Number(
        (customerMap[cId].quantityKg + Number(inv.quantityKg || 0)).toFixed(2)
      );
      customerMap[cId].taxableAmount = Number(
        (customerMap[cId].taxableAmount + Number(inv.taxableAmount || 0)).toFixed(2)
      );
      const gst =
        Number(inv.cgstAmount || 0) +
        Number(inv.utgstAmount || 0) +
        Number(inv.igstAmount || 0);
      customerMap[cId].gstAmount = Number(
        (customerMap[cId].gstAmount + gst).toFixed(2)
      );
      customerMap[cId].grandTotal = Number(
        (customerMap[cId].grandTotal + Number(inv.grandTotal || 0)).toFixed(2)
      );
    });

    const customerBreakdown = Object.values(customerMap)
      .map((c) => ({
        ...c,
        percentage:
          periodTotalAmount > 0
            ? Number(((c.grandTotal / periodTotalAmount) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.grandTotal - a.grandTotal);

    // Lifetime figures
    let allTimeTotalAmount = 0;
    let allTimeDispatchedKg = 0;
    invoices.forEach((inv) => {
      allTimeTotalAmount += Number(inv.grandTotal || 0);
      allTimeDispatchedKg += Number(inv.quantityKg || 0);
    });

    // Invoices list sorted descending
    const sortedInvoices = [...periodInvoices].sort((a, b) => {
      const dateA = a.invoiceDate || a.createdAt || "";
      const dateB = b.invoiceDate || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    return NextResponse.json({
      success: true,
      data: {
        startDate,
        endDate,
        daysCount,
        isCurrentMonth: startDate === defaultStart && endDate === defaultEnd,
        periodTotalAmount,
        periodTaxableAmount,
        periodGstAmount,
        periodCgstAmount,
        periodUtgstAmount,
        periodIgstAmount,
        periodDispatchedKg,
        periodTotalRolls,
        periodInvoiceCount,
        averageInvoiceValue,
        averageRatePerKg,
        dailyTrend,
        customerBreakdown,
        invoices: sortedInvoices,
        allTimeTotalAmount: Number(allTimeTotalAmount.toFixed(2)),
        allTimeInvoiceCount: invoices.length,
        allTimeDispatchedKg: Number(allTimeDispatchedKg.toFixed(2)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
