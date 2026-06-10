import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { configGet, userGet, userUpdate } from "@/lib/db";

interface CampaignConfig {
  tasks?: Array<{
    taskId: string;
    title?: string;
    link?: string;
    rewardXp?: number;
    active?: boolean;
    proofType?: string;
    order?: number;
  }>;
  version?: number;
}

interface CompleteTaskBody {
  userId: string;
  taskId: string;
  proof?: string;
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, "complete-task", 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body: CompleteTaskBody = await req.json();
    const { userId, taskId, proof } = body;

    if (!userId || !taskId) {
      return NextResponse.json(
        { success: false, field: "userId", message: "userId and taskId are required" },
        { status: 400 }
      );
    }

    const campaign = configGet("campaign") as CampaignConfig | null;
    if (!campaign || !campaign.tasks) {
      return NextResponse.json(
        { success: false, field: "taskId", message: "No active campaign found" },
        { status: 404 }
      );
    }

    const task = campaign.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, field: "taskId", message: "Task not found in current campaign" },
        { status: 404 }
      );
    }

    if (task.active === false) {
      return NextResponse.json(
        { success: false, field: "taskId", message: "This task is no longer active" },
        { status: 400 }
      );
    }

    if (task.proofType && task.proofType !== "none" && !proof) {
      return NextResponse.json(
        { success: false, field: "proof", message: "Proof is required for this task" },
        { status: 400 }
      );
    }

    const user = userGet(userId) as Record<string, unknown> | null;
    if (!user) {
      return NextResponse.json(
        { success: false, field: "userId", message: "User not found" },
        { status: 404 }
      );
    }

    const completedTasks: string[] = Array.isArray(user.campaignCompletedTasks) ? user.campaignCompletedTasks : [];
    if (completedTasks.includes(taskId)) {
      return NextResponse.json(
        { success: false, field: "taskId", message: "Task already completed" },
        { status: 409 }
      );
    }

    const officialReward = Number(task.rewardXp) || 0;
    const currentMxp = Number(user.mxp) || 0;
    const currentTaskMxp = Number(user.mxpFromTasks) || 0;

    const campaignInputs: Record<string, string> = (user.campaignInputs as Record<string, string>) || {};
    if (proof) {
      campaignInputs[taskId] = proof;
    }

    const updated = userUpdate(userId, {
      mxp: currentMxp + officialReward,
      mxpFromTasks: currentTaskMxp + officialReward,
      campaignCompletedTasks: [...completedTasks, taskId],
      campaignInputs,
      campaignVersion: campaign.version || 0,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Complete task error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
