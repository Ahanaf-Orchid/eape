import { NextRequest, NextResponse } from "next/server";
import { claimGet, userGet } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";

  if (!username) {
    return NextResponse.json({ error: "username parameter required" }, { status: 400 });
  }

  const normalizedUsername = username.replace(/^@/, "").toLowerCase();
  const userId = claimGet("usernames", normalizedUsername);

  if (!userId) {
    return NextResponse.json({ found: false });
  }

  const userData = userGet(userId) as Record<string, unknown> | null;
  if (!userData) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    userId,
    username: userData.username,
    mxp: userData.mxp || 0,
    mxpFromUsername: userData.mxpFromUsername || 0,
    mxpFromInvitee: userData.mxpFromInvitee || 0,
    mxpFromReferrals: userData.mxpFromReferrals || 0,
    mxpFromTasks: userData.mxpFromTasks || 0,
    status: userData.status || "BOT",
    referrals: userData.referrals || 0,
    reviewStatus: userData.reviewStatus || userData.verificationStatus || "PENDING",
    verificationStatus: userData.verificationStatus || "pending",
    campaignCompletedTasks: userData.campaignCompletedTasks || [],
    campaignInputs: userData.campaignInputs || {},
    campaignVersion: userData.campaignVersion || 1,
  });
}
