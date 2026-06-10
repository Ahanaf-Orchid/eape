import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/admin-auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Admin credentials not configured" }, { status: 500 });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = createSession(email);
      return NextResponse.json({ ok: true, token });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
