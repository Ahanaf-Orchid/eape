import { NextRequest, NextResponse } from "next/server";
import { investEarlySubmit } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twitter, email, amount, message } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const id = investEarlySubmit({ twitter, email, amount, message });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Invest-early submit error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
