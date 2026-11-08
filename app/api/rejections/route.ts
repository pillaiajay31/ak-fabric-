import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const rejections = await store.getRejections();
    rejections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ success: true, data: rejections });
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
    if (!body.machineCode || body.netWeight === undefined || !body.reason) {
      return NextResponse.json(
        { success: false, error: "Machine, weight, and reason are required" },
        { status: 400 }
      );
    }
    const created = await store.addRejection({
      machineCode: body.machineCode,
      rollNo: body.rollNo || "",
      netWeight: Number(body.netWeight),
      reason: body.reason,
      action: body.action || "Scrap",
      date: body.date || new Date().toISOString().split("T")[0],
      notes: body.notes || "",
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

