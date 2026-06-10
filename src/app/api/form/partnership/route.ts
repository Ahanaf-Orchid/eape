import { NextRequest, NextResponse } from "next/server";
import { partnershipSubmit } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twitter, email, telegram, message } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const id = partnershipSubmit({ twitter, email, telegram, message });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Partnership submit error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
