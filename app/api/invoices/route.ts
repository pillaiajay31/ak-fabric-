import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const invoices = await store.getInvoices();
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, data: invoices });
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
    if (!body.customerId || !body.taxableAmount || !body.grandTotal) {
      return NextResponse.json(
        { success: false, error: "Customer, taxable amount, and total are required" },
        { status: 400 }
      );
    }
    const created = await store.createInvoice(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

