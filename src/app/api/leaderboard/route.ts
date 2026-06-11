import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { usersGetAll } from "@/lib/db";

export async function GET(req: NextRequest) {
  const limit = checkRateLimit(req, "leaderboard", 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "referrers";

    const allUsers = usersGetAll();
    const userArray: { id: string; username: string; referrals: number; mxp: number }[] = [];

    Object.entries(allUsers).forEach(([key, value]) => {
      const user = value as any;
      if (user && user.username) {
        userArray.push({
          id: key,
          username: user.username,
          referrals: Number(user.referrals) || 0,
          mxp: Number(user.mxp) || 0,
        });
      }
    });

    const sorted = userArray.sort((a, b) => {
      if (tab === "referrers") {
        return b.referrals - a.referrals;
      } else {
        return b.mxp - a.mxp;
      }
    });

    const top15 = sorted.slice(0, 15).map((user, index) => ({
      rank: index + 1,
      username: user.username,
      value: tab === "referrers" ? user.referrals : user.mxp,
    }));

    return NextResponse.json({ success: true, data: top15 });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
