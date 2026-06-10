import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { configSet } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { tasks, version } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "tasks array is required" }, { status: 400 });
    }

    configSet("campaign", {
      tasks,
      version: typeof version === "number" ? version : (version || 0) + 1,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Campaign save error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
