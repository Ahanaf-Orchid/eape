import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateId, userSet, userUpdate, userGet,
  claimGet, claimSet,
  configGet, referralEventSet,
  deviceSubmissionUpdate,
} from "@/lib/db";

interface RegisterBody {
  username?: string;
  wallet?: string;
  solWallet?: string;
  invitee?: string;
  telegram?: string;
  deviceId?: string;
  comment_1?: string;
  comment_2?: string;
  comment_3?: string;
  completedTasks?: string[];
  campaignProofs?: Record<string, string>;
}

interface ValidationError {
  success: false;
  step: number;
  field: string;
  message: string;
}

function error(step: number, field: string, message: string): ValidationError {
  return { success: false, step, field, message };
}

function readMxpRewards(): { usernameBonus: number; inviteeBonus: number; perReferral: number } {
  const homepage = configGet("homepage") as Record<string, unknown> | null;
  const rewards = homepage?.mxpRewards as Record<string, unknown> | null;
  return {
    usernameBonus: Number(rewards?.usernameBonus) || 30,
    inviteeBonus: Number(rewards?.inviteeBonus) || 100,
    perReferral: Number(rewards?.perReferral) || 50,
  };
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, "register", 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, step: 0, field: "rate", message: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body: RegisterBody = await req.json();
    const { username, wallet, solWallet, invitee, telegram, deviceId, comment_1, comment_2, comment_3, completedTasks, campaignProofs } = body;

    if (!username) {
      return NextResponse.json(error(1, "username", "Username is required"), { status: 400 });
    }

    const normalizedUsername = username.startsWith("@") ? username.slice(1) : username;
    const usernameLower = normalizedUsername.toLowerCase();

    if (usernameLower.length < 2) {
      return NextResponse.json(error(1, "username", "Username must be at least 2 characters"), { status: 400 });
    }

    const existingUser = claimGet("usernames", usernameLower);
    if (existingUser) {
      return NextResponse.json(error(1, "username", "This username is already registered"), { status: 409 });
    }

    let inviterKey: string | null = null;
    if (invitee) {
      const normalizedInvitee = invitee.startsWith("@") ? invitee.slice(1) : invitee;
      const inviterId = claimGet("usernames", normalizedInvitee.toLowerCase());
      if (!inviterId) {
        return NextResponse.json(error(1, "invitee", "Inviter not found"), { status: 404 });
      }
      inviterKey = inviterId;
    }

    if (wallet) {
      const existingWallet = claimGet("wallets", wallet.toLowerCase());
      if (existingWallet) {
        return NextResponse.json(error(2, "wallet", "This wallet is already registered"), { status: 409 });
      }
    }

    if (solWallet) {
      const existingSolWallet = claimGet("sol_wallets", solWallet.toLowerCase());
      if (existingSolWallet) {
        return NextResponse.json(error(2, "solWallet", "This Solana wallet is already registered"), { status: 409 });
      }
    }

    const id = generateId();
    const rewards = readMxpRewards();

    const tasks = (completedTasks || []).filter((t) => t && t.length > 0);
    const proofs = (campaignProofs || {}) as Record<string, string>;

    let taskMxp = 0;
    const campaign = configGet("campaign") as Record<string, unknown> | null;
    const campaignTasks = (campaign?.tasks || {}) as Record<string, Record<string, unknown>>;

    for (const taskId of tasks) {
      const taskDef = campaignTasks[taskId];
      if (taskDef) {
        taskMxp += Number(taskDef.points) || Number(taskDef.rewardXp) || 0;
      }
    }

    if (taskMxp === 0) {
      taskMxp = tasks.length * 10;
    }

    const initialMxp = rewards.usernameBonus + (inviterKey ? rewards.inviteeBonus : 0) + taskMxp;

    const now = Date.now();
    const userData: Record<string, unknown> = {
      username: usernameLower,
      wallet: wallet?.toLowerCase() || "",
      sol_wallet: solWallet?.toLowerCase() || "",
      telegram: telegram || "",
      invitee: inviterKey || "",
      device_id: deviceId || "",
      referrals: 0,
      status: "BOT",
      mxp: initialMxp,
      mxpFromUsername: rewards.usernameBonus,
      mxpFromInvitee: inviterKey ? rewards.inviteeBonus : 0,
      mxpFromReferrals: 0,
      mxpFromTasks: taskMxp,
      campaignCompletedTasks: tasks,
      campaignInputs: proofs,
      campaignVersion: Number(campaign?.version) || 0,
      comment_1: comment_1 || "",
      comment_2: comment_2 || "",
      comment_3: comment_3 || "",
      timestamp: now,
      verificationStatus: "pending",
    };

    userSet(id, userData);
    claimSet("usernames", usernameLower, id);

    if (wallet) {
      claimSet("wallets", wallet.toLowerCase(), id);
    }
    if (solWallet) {
      claimSet("sol_wallets", solWallet.toLowerCase(), id);
    }

    if (inviterKey && inviterKey !== id) {
      const inviter = userGet(inviterKey) as Record<string, unknown> | null;
      if (inviter) {
        const currentRefs = Number(inviter.referrals) || 0;
        const currentMxp = Number(inviter.mxp) || 0;
        userUpdate(inviterKey, {
          referrals: currentRefs + 1,
          mxp: currentMxp + rewards.perReferral,
          mxpFromReferrals: (Number(inviter.mxpFromReferrals) || 0) + rewards.perReferral,
        });

        const eventId = generateId();
        referralEventSet(eventId, {
          inviterId: inviterKey,
          referredId: id,
          referredUsername: usernameLower,
          device_id: deviceId || "",
          reward: rewards.perReferral,
          createdAt: now,
        });
      }
    }

    if (deviceId) {
      const existing = (deviceSubmissionUpdate(deviceId, { lastRegistration: now }) as Record<string, unknown>) || {};
      const count = Number(existing.registrationCount) || 0;
      deviceSubmissionUpdate(deviceId, { registrationCount: count + 1, lastRegistration: now });
    }

    return NextResponse.json({ success: true, user: userData });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
