import { NextResponse } from "next/server";
import { configGet } from "@/lib/db";

const PUBLIC_CONFIG_PATHS = [
  "homepage",
  "campaign",
  "pageRuntime",
  "images",
  "checknfts",
];

export async function GET() {
  const result: Record<string, unknown> = {};
  for (const path of PUBLIC_CONFIG_PATHS) {
    const value = configGet(path);
    if (value !== null) {
      result[path] = value;
    }
  }
  return NextResponse.json(result);
}
