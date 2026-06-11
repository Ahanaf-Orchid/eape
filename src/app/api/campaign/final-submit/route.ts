import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { claimGet, configGet, userGet, userUpdate } from "@/lib/db";

interface CampaignTask {
  label?: string;
  url?: string;
  points?: number;
  inputType?: string;
  required?: boolean;
}

interface SubmitTask {
  taskId: string;
  proofValue?: string;
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, "final-submit", 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const rawUsername = (body.username || "").replace(/^@/, "").toLowerCase();
    const tasks: SubmitTask[] = body.tasks || [];

    if (!rawUsername) {
      return NextResponse.json({ success: false, message: "Username is required" }, { status: 400 });
    }

    if (!tasks.length) {
      return NextResponse.json({ success: false, message: "No tasks to submit" }, { status: 400 });
    }

    const userId = claimGet("usernames", rawUsername);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = userGet(userId) as Record<string, unknown> | null;
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const campaign = configGet("campaign") as Record<string, unknown> | null;
    const campaignTasks = (campaign?.tasks || campaign) as Record<string, CampaignTask> | null;
    if (!campaignTasks) {
      return NextResponse.json({ success: false, message: "No active campaign found" }, { status: 404 });
    }

    const completedTasks: string[] = Array.isArray(user.campaignCompletedTasks) ? user.campaignCompletedTasks : [];
    const campaignInputs: Record<string, string> = (user.campaignInputs as Record<string, string>) || {};

    const errors: { taskId: string; message: string }[] = [];
    let totalReward = 0;
    const newCompleted: string[] = [];
    const seenTaskIds = new Set<string>();

    for (const submitted of tasks) {
      // Deduplicate within the request
      if (seenTaskIds.has(submitted.taskId)) continue;
      seenTaskIds.add(submitted.taskId);

      const task = campaignTasks[submitted.taskId] as CampaignTask | undefined;

      if (!task) {
        errors.push({ taskId: submitted.taskId, message: "Task not found in current campaign" });
        continue;
      }

      if (completedTasks.includes(submitted.taskId)) {
        errors.push({ taskId: submitted.taskId, message: "Task already completed" });
        continue;
      }

      if (newCompleted.includes(submitted.taskId)) {
        continue;
      }

      // Proof required for link/email/text types, not for click type
      const needsProof = task.inputType && task.inputType !== "click";
      if (needsProof) {
        if (!submitted.proofValue || !submitted.proofValue.trim()) {
          errors.push({ taskId: submitted.taskId, message: "Proof is required for this task" });
          continue;
        }
        campaignInputs[submitted.taskId] = submitted.proofValue.trim();
      }

      // Use task.points as reward (not rewardXp)
      const reward = Number(task.points) || 0;
      totalReward += reward;
      newCompleted.push(submitted.taskId);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: "Some tasks failed validation", failedTasks: errors },
        { status: 400 }
      );
    }

    if (newCompleted.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid tasks to complete" },
        { status: 400 }
      );
    }

    const allCompleted = [...completedTasks, ...newCompleted];
    const currentMxp = Number(user.mxp) || 0;
    const currentTaskMxp = Number(user.mxpFromTasks) || 0;

    const updated = userUpdate(userId, {
      mxp: currentMxp + totalReward,
      mxpFromTasks: currentTaskMxp + totalReward,
      campaignCompletedTasks: allCompleted,
      campaignInputs,
      campaignVersion: campaign?.version || 0,
    });

    return NextResponse.json({
      success: true,
      totalReward,
      completedTasks: allCompleted,
      user: updated,
    });
  } catch (err) {
    console.error("Final submit error:", err);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}
