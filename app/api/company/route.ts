import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const company = await store.getCompany();
    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await store.updateCompany(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

