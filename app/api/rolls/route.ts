import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const machine = searchParams.get("machine");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    let rolls = await store.getRolls();

    if (machine && machine !== "ALL") {
      rolls = rolls.filter((r) => r.machineCode === machine);
    }
    if (status && status !== "ALL") {
      rolls = rolls.filter((r) => r.status === status);
    }
    if (date) {
      rolls = rolls.filter((r) => r.date === date);
    }

    // Sort descending by creation date or roll number
    rolls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: rolls });
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

    // Batch entry check
    if (Array.isArray(body.rolls) && body.rolls.length > 0) {
      const createdBatch = await store.addBatchRolls(
        body.rolls.map((r: {
          rollNo: string;
          machineCode: string;
          netWeight: number | string;
          fabricQuality?: string;
          date?: string;
          shift?: "Day" | "Night";
          operator?: string;
          notes?: string;
        }) => ({
          rollNo: r.rollNo.trim(),
          machineCode: r.machineCode,
          netWeight: Number(r.netWeight),
          fabricQuality: r.fabricQuality || "Nylon 44/10 knitted grey fabric",
          date: r.date || new Date().toISOString().split("T")[0],
          shift: r.shift || "Day",
          operator: r.operator || "",
          status: "in_stock" as const,
          notes: r.notes || "",
        }))
      );
      return NextResponse.json({ success: true, data: createdBatch }, { status: 201 });
    }

    // Single entry
    if (!body.rollNo || !body.machineCode || body.netWeight === undefined) {
      return NextResponse.json(
        { success: false, error: "Roll number, machine, and net weight are required." },
        { status: 400 }
      );
    }

    const created = await store.addRoll({
      rollNo: body.rollNo.trim(),
      machineCode: body.machineCode,
      netWeight: Number(body.netWeight),
      fabricQuality: body.fabricQuality || "Nylon 44/10 knitted grey fabric",
      date: body.date || new Date().toISOString().split("T")[0],
      shift: body.shift || "Day",
      operator: body.operator || "",
      status: (body.status as "in_stock" | "dispatched" | "rejected") || "in_stock",
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

