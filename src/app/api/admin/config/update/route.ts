import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { configSet, configGet } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { path, value, merge } = body;

    if (!path) {
      return NextResponse.json({ error: "Config path is required" }, { status: 400 });
    }

    if (merge) {
      const existing = (configGet(path) as Record<string, unknown>) || {};
      configSet(path, { ...existing, ...value });
    } else {
      configSet(path, value);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Config update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
