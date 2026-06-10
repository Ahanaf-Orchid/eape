import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { userGet, userUpdate } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const existing = userGet(userId);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = userUpdate(userId, { ...updates, adminUpdatedAt: Date.now(), adminUpdatedBy: auth.email });
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
