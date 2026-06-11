import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { claimGet, userGet, userUpdate, configGet, dailyClaimCheck, dailyClaimCreate } from "@/lib/db";

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, "claim-daily-reward", 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const rawUsername = (body.username || "").replace(/^@/, "").toLowerCase();

    if (!rawUsername) {
      return NextResponse.json({ success: false, message: "Username is required" }, { status: 400 });
    }

    const userId = claimGet("usernames", rawUsername);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = userGet(userId) as Record<string, unknown> | null;
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const campaignConfig = (configGet("campaign") || {}) as Record<string, unknown>;
    const dailyRewardEnabled = campaignConfig.dailyRewardEnabled !== false;

    if (!dailyRewardEnabled) {
      return NextResponse.json({ success: false, message: "Daily reward is currently disabled" }, { status: 400 });
    }

    const dailyRewardMxp = Number(campaignConfig.dailyRewardMxp) || 20;

    const today = new Date().toISOString().split("T")[0];

    const existing = dailyClaimCheck(userId, today, "daily-reward");
    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Already claimed today",
        alreadyClaimed: true,
        claimedAt: existing.claimedAt,
      });
    }

    const now = Date.now();
    dailyClaimCreate(userId, rawUsername, "daily-reward", today, dailyRewardMxp, now);

    const currentMxp = Number(user.mxp) || 0;
    const currentMxpFromTasks = Number(user.mxpFromTasks) || 0;

    userUpdate(userId, {
      mxp: currentMxp + dailyRewardMxp,
      mxpFromTasks: currentMxpFromTasks + dailyRewardMxp,
    });

    return NextResponse.json({
      success: true,
      rewardMxp: dailyRewardMxp,
      totalMxp: currentMxp + dailyRewardMxp,
      nextClaimAt: "tomorrow",
    });
  } catch (err) {
    console.error("Claim daily reward error:", err);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}
