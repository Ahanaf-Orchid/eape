import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { userGet, userUpdate, generateId } from "@/lib/db";
import Database from "better-sqlite3";
import path from "path";
import { checkRateLimit } from "@/lib/rate-limit";

function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "eape.db");
  return new Database(dbPath);
}

function logAudit(userId: string, adminEmail: string, field: string, oldValue: unknown, newValue: unknown, note?: string) {
  const db = getDb();
  const id = generateId();
  db.prepare("INSERT INTO admin_audit_log (id, userId, adminEmail, field, oldValue, newValue, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, userId, adminEmail, field, String(oldValue ?? ""), String(newValue ?? ""), note || null, Date.now());
  db.close();
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const limit = checkRateLimit(req, "admin-update-user", 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  try {
    const body = await req.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const existing = userGet(userId) as Record<string, unknown> | null;
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sync verificationStatus ↔ reviewStatus for dual-field compat
    const syncUpdates: Record<string, unknown> = { ...updates };
    if ("reviewStatus" in updates) {
      const rs = (updates.reviewStatus as string).toUpperCase();
      if (rs === "VERIFIED" || rs === "APPROVED") syncUpdates.verificationStatus = "verified";
      if (rs === "DISQUALIFIED" || rs === "REJECTED") syncUpdates.verificationStatus = "disqualified";
      if (rs === "NEEDS_IMPROVEMENT") syncUpdates.verificationStatus = "pending";
    }
    if ("verificationStatus" in updates) {
      const vs = updates.verificationStatus as string;
      if (vs === "verified") syncUpdates.reviewStatus = "VERIFIED";
      if (vs === "disqualified") syncUpdates.reviewStatus = "DISQUALIFIED";
      if (vs === "pending") syncUpdates.reviewStatus = "PENDING";
    }

    // Validate MXP adjustments
    if ("mxp" in syncUpdates) {
      const newMxp = Number(syncUpdates.mxp);
      if (isNaN(newMxp) || newMxp < 0) {
        return NextResponse.json({ error: "MXP must be a positive number" }, { status: 400 });
      }
      if (newMxp > 1000000) {
        return NextResponse.json({ error: "MXP cannot exceed 1,000,000" }, { status: 400 });
      }
      const oldMxp = Number(existing.mxp) || 0;
      const diff = newMxp - oldMxp;
      if (Math.abs(diff) > 10000) {
        return NextResponse.json({ error: "Maximum adjustment is ±10,000 per operation" }, { status: 400 });
      }

      // Log to audit trail
      logAudit(userId, auth.email, "mxp", oldMxp, newMxp, (syncUpdates.adminNote as string) || undefined);
    }

    const updated = userUpdate(userId, { ...syncUpdates, adminUpdatedAt: Date.now(), adminUpdatedBy: auth.email });
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
