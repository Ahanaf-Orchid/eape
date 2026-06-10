import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { usersGetAll, deviceLoginsGetAll } from "@/lib/db";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const users = usersGetAll();
    const totalUsers = Object.keys(users).length;

    const verified = Object.values(users).filter(
      (u) => (u as Record<string, unknown>).verificationStatus === "verified"
    ).length;

    const logins = deviceLoginsGetAll();
    const totalLogins = Object.values(logins).reduce((sum, d) => sum + d.count, 0);

    return NextResponse.json({ totalUsers, verifiedUsers: verified, totalLogins });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
