import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { userGet, userUpdate } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { userIds, action } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required" }, { status: 400 });
    }

    if (action !== "verify" && action !== "disqualify") {
      return NextResponse.json({ error: "action must be 'verify' or 'disqualify'" }, { status: 400 });
    }

    const verifiedUsers: string[] = [];
    const failedUsers: { userId: string; reason: string }[] = [];

    for (const userId of userIds) {
      const user = userGet(userId) as Record<string, unknown> | null;
      if (!user) {
        failedUsers.push({ userId, reason: "User not found" });
        continue;
      }

      if (action === "verify") {
        if (user.verificationStatus === "disqualified" || user.reviewStatus === "DISQUALIFIED") {
          failedUsers.push({ userId, reason: "User has been disqualified" });
          continue;
        }
        userUpdate(userId, {
          verificationStatus: "verified",
          reviewStatus: "VERIFIED",
          verifiedAt: Date.now(),
          verifiedBy: auth.email,
          reviewedAt: new Date().toISOString(),
        });
        verifiedUsers.push(userId);
      } else {
        userUpdate(userId, {
          verificationStatus: "disqualified",
          reviewStatus: "DISQUALIFIED",
          disqualifiedAt: Date.now(),
          disqualifiedBy: auth.email,
          reviewedAt: new Date().toISOString(),
        });
        verifiedUsers.push(userId);
      }
    }

    return NextResponse.json({
      success: failedUsers.length === 0,
      verifiedUsers,
      failedUsers: failedUsers.length > 0 ? failedUsers : undefined,
    });
  } catch (err) {
    console.error("User verify error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
