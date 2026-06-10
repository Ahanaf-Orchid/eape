import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/db";
import Database from "better-sqlite3";
import path from "path";

function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "eape.db");
  return new Database(dbPath);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const id = generateId();
    const now = Date.now();

    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO contacts (id, data) VALUES (?, ?)").run(id, JSON.stringify({
      name,
      email,
      subject: subject || "",
      message,
      status: "open",
      createdAt: now,
      replies: [],
    }));
    db.close();

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Contact submit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
