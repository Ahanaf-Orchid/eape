import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/db";
import Database from "better-sqlite3";
import path from "path";

function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "eape.db");
  return new Database(dbPath);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function containsUrls(text: string): boolean {
  return /https?:\/\/|www\./i.test(text);
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, "contact", 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const { name, email, subject, message, _hp } = body;

    // Honeypot - hidden field that bots fill in
    if (_hp && _hp.trim().length > 0) {
      return NextResponse.json({ success: true }); // silently accept
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = (subject || "").trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (trimmedMessage.length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });
    }

    if (trimmedMessage.length > 2000) {
      return NextResponse.json({ error: "Message is too long (max 2000 characters)" }, { status: 400 });
    }

    if (trimmedSubject.length > 200) {
      return NextResponse.json({ error: "Subject is too long" }, { status: 400 });
    }

    // Reject obvious spam - URLs in name field
    if (containsUrls(trimmedName)) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const id = generateId();
    const now = Date.now();

    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO contacts (id, data) VALUES (?, ?)").run(id, JSON.stringify({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
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
