import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const customers = await store.getCustomers();
    return NextResponse.json({ success: true, data: customers });
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
    if (!body.name || !body.gstin || !body.shippingAddress) {
      return NextResponse.json(
        { success: false, error: "Customer name, GSTIN, and address are required" },
        { status: 400 }
      );
    }
    const created = await store.addCustomer({
      name: body.name,
      gstin: body.gstin.trim().toUpperCase(),
      billingAddress: body.billingAddress || body.shippingAddress,
      shippingAddress: body.shippingAddress,
      city: body.city || "Bhiwandi",
      state: body.state || "Maharashtra",
      stateCode: body.stateCode || (body.gstin ? body.gstin.substring(0, 2) : "27"),
      pincode: body.pincode || "421303",
      preferredTransport: body.preferredTransport || "ROADWAYS",
      defaultVehicleNo: body.defaultVehicleNo || "",
      placeOfSupply: body.placeOfSupply || (body.city ? body.city.toUpperCase() : "BHIWANDI"),
      phone: body.phone || "",
      email: body.email || "",
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

