import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import Database from "better-sqlite3";
import path from "path";

function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "eape.db");
  return new Database(dbPath);
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, action } = body; // action: "close" | "delete"

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }

    const db = getDb();

    if (action === "delete") {
      db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
      db.close();
      return NextResponse.json({ success: true });
    }

    const row = db.prepare("SELECT data FROM contacts WHERE id = ?").get(id) as { data: string } | undefined;
    if (!row) {
      db.close();
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const data = JSON.parse(row.data);

    if (action === "close") {
      data.status = "closed";
      data.closedAt = Date.now();
    }

    db.prepare("UPDATE contacts SET data = ? WHERE id = ?").run(JSON.stringify(data), id);
    db.close();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contacts update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
