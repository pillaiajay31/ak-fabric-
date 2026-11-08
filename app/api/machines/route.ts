import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const machines = await store.getMachines();
    return NextResponse.json({ success: true, data: machines });
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
    if (!body.code || !body.name || !body.rollPrefix) {
      return NextResponse.json(
        { success: false, error: "Machine code, name, and roll prefix are required." },
        { status: 400 }
      );
    }
    const created = await store.addMachine(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

