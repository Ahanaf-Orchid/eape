import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import Database from "better-sqlite3";
import path from "path";

function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "eape.db");
  return new Database(dbPath);
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all"; // all | open | closed

    const db = getDb();
    const rows = db.prepare("SELECT id, data FROM contacts ORDER BY id DESC LIMIT 500").all() as { id: string; data: string }[];

    const messages = rows.map((r) => ({
      id: r.id,
      ...JSON.parse(r.data),
    }));

    const filtered = filter === "all"
      ? messages
      : messages.filter((m: any) => m.status === filter);

    db.close();

    return NextResponse.json({ messages: filtered });
  } catch (err) {
    console.error("Contacts list error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
