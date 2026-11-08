import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { ChallanRollItem, DeliveryChallan, TaxInvoice } from "@/lib/types";
import { numberToWordsIndian } from "@/lib/utils";

export async function GET() {
  try {
    const challans = await store.getChallans();
    challans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, data: challans });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.customerId || !body.vehicleNo || !body.placeOfSupply || !body.rolls || body.rolls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer, Vehicle No, Place of Supply, and at least one roll are required.",
        },
        { status: 400 }
      );
    }

    const customer = await store.getCustomerById(body.customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Selected customer not found." },
        { status: 404 }
      );
    }

    const rolls: ChallanRollItem[] = body.rolls.map((r: ChallanRollItem) => ({
      rollNo: r.rollNo,
      netWeight: Number(r.netWeight),
      machineCode: r.machineCode || r.rollNo.split(".")[0] || "A",
    }));

    const totalRolls = rolls.length;
    const totalWeight = Number(
      rolls.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2)
    );

    // Compute Machine Breakdown
    const breakdown: Record<string, { rolls: number; weight: number }> = {};
    for (const r of rolls) {
      const mc = r.machineCode || "A";
      if (!breakdown[mc]) {
        breakdown[mc] = { rolls: 0, weight: 0 };
      }
      breakdown[mc].rolls += 1;
      breakdown[mc].weight = Number((breakdown[mc].weight + r.netWeight).toFixed(2));
    }

    // Build summary string e.g.:
    // "TOTAL WEIGHT ( C ) 461.10 KG + WEIGHT(D) 436.80 KG + WEIGHT (A) 341.25 KG + WEIGHT 544.05 (B) KG = 1783.20 KG"
    const breakdownParts = Object.entries(breakdown).map(
      ([mc, data]) => `WEIGHT (${mc}) ${data.weight.toFixed(2)} KG`
    );
    const summaryText = `TOTAL ${breakdownParts.join(" + ")} = ${totalWeight.toFixed(2)} KG`;

    // Next challan number if not provided
    const existingChallans = await store.getChallans();
    let nextNo = body.challanNo;
    if (!nextNo) {
      const numbers = existingChallans
        .map((c) => parseInt(c.challanNo, 10))
        .filter((n) => !isNaN(n));
      const maxNo = numbers.length > 0 ? Math.max(...numbers) : 0;
      nextNo = String(maxNo + 1);
    }

    const newChallanData: Omit<DeliveryChallan, "id" | "createdAt"> = {
      challanNo: nextNo,
      challanDate: body.challanDate || new Date().toISOString().split("T")[0],
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin,
      shippingAddress: body.shippingAddress || customer.shippingAddress,
      transportMode: body.transportMode || "ROADWAYS",
      vehicleNo: body.vehicleNo.trim().toUpperCase(),
      placeOfSupply: body.placeOfSupply.trim().toUpperCase(),
      lrNo: body.lrNo || "",
      transporter: body.transporter || customer.preferredTransport || "SHIV TRANSPORT",
      noOfBags: Number(body.noOfBags || Math.ceil(totalRolls / 2)),
      rolls,
      totalRolls,
      totalWeight,
      machineBreakdown: breakdown,
      machineSummaryText: summaryText,
      fabricQuality: body.fabricQuality || "NYLON 44/10 KNITTED GREY FABRIC",
    };

    const createdChallan = await store.createChallan(newChallanData);

    // Auto-generate Tax Invoice if requested or by default
    let createdInvoice: TaxInvoice | null = null;
    if (body.autoGenerateInvoice !== false) {
      const company = await store.getCompany();
      const rate = Number(body.ratePerKg || company.defaultRate || 42);
      const taxable = Number((totalWeight * rate).toFixed(2));

      // GST rule: Company is 26 (Dadra & Nagar Haveli). If customer is also 26 => CGST 2.5% + UTGST 2.5%. If different (e.g. 27 Maharashtra) => IGST 5.0%
      const companyStateCode = company.gstin.substring(0, 2);
      const customerStateCode = customer.gstin.substring(0, 2);
      const isInterState = companyStateCode !== customerStateCode;

      let cgstRate = 0;
      let cgstAmount = 0;
      let utgstRate = 0;
      let utgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (isInterState) {
        igstRate = 5.0;
        igstAmount = Number(((taxable * 5) / 100).toFixed(2));
      } else {
        cgstRate = 2.5;
        cgstAmount = Number(((taxable * 2.5) / 100).toFixed(2));
        utgstRate = 2.5;
        utgstAmount = Number(((taxable * 2.5) / 100).toFixed(2));
      }

      const totalWithTax = taxable + (isInterState ? igstAmount : cgstAmount + utgstAmount);
      const roundedTotal = Math.round(totalWithTax);
      const roundOff = Number((roundedTotal - totalWithTax).toFixed(2));
      const grandTotal = roundedTotal;
      const amountInWords = numberToWordsIndian(grandTotal);

      const invoiceData: Omit<TaxInvoice, "id" | "createdAt"> = {
        invoiceNo: createdChallan.challanNo, // Matching Challan No per textile industry convention
        invoiceDate: createdChallan.challanDate,
        challanId: createdChallan.id,
        challanNo: createdChallan.challanNo,
        customerId: customer.id,
        customerName: customer.name,
        customerGstin: customer.gstin,
        billingAddress: customer.billingAddress,
        shippingAddress: createdChallan.shippingAddress,
        transportMode: createdChallan.transportMode,
        vehicleNo: createdChallan.vehicleNo,
        placeOfSupply: createdChallan.placeOfSupply,
        dateOfSupply: createdChallan.challanDate,
        lrNo: createdChallan.lrNo || "",
        description: `Job work charge for Nylon 44/10\nknitted grey fabric challan no: ${createdChallan.challanNo}`,
        hsnSac: company.defaultHsn || "998821",
        noOfRolls: totalRolls,
        quantityKg: totalWeight,
        ratePerKg: rate,
        taxableAmount: taxable,
        isInterState,
        cgstRate,
        cgstAmount,
        utgstRate,
        utgstAmount,
        igstRate,
        igstAmount,
        roundOff,
        grandTotal,
        amountInWords,
        bankDetails: {
          bankName: company.bankName,
          branch: company.bankBranch,
          accountNo: company.bankAccountNo,
          ifsc: company.bankIfsc,
        },
      };

      createdInvoice = await store.createInvoice(invoiceData);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          challan: createdChallan,
          invoice: createdInvoice,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

