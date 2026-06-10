import { NextResponse } from "next/server";

const SESSIONS = new Map<string, { email: string; createdAt: number }>();
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours

function generateToken(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createSession(email: string): string {
  const token = generateToken();
  SESSIONS.set(token, { email, createdAt: Date.now() });
  return token;
}

export function validateSession(token: string): { email: string } | null {
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    SESSIONS.delete(token);
    return null;
  }
  return { email: session.email };
}

export function requireAdmin(req: Request): NextResponse | { email: string } {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = validateSession(auth.slice(7));
  if (!session) {
    return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
  }
  return session;
}
