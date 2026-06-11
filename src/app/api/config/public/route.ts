import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { configGet } from "@/lib/db";

const PUBLIC_CONFIG_PATHS = [
  "homepage",
  "campaign",
  "images",
  "checknfts",
];

export async function GET(req: NextRequest) {
  const limit = checkRateLimit(req, "config-public", 120, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const result: Record<string, unknown> = {};
  for (const path of PUBLIC_CONFIG_PATHS) {
    const value = configGet(path);
    if (value !== null) {
      result[path] = value;
    }
  }
  return NextResponse.json(result);
}
