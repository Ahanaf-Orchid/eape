import { NextRequest, NextResponse } from "next/server";
import {
  userGet, userSet, userUpdate, userDelete,
  usersGetAll, generateId,
  claimGet, claimSet,
  deviceSubmissionGet, deviceSubmissionUpdate,
  referralEventSet,
  deviceLoginGet, deviceLoginSet, deviceLoginsGetAll,
  configGet, configSet,
} from "@/lib/db";

const DEPRECATED_MSG = "This endpoint is deprecated. Use dedicated endpoints instead.";

function deprecate(res: NextResponse): NextResponse {
  res.headers.set("X-Deprecated", DEPRECATED_MSG);
  return res;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  const { path } = await context.params;
  const parts = path.split("/");

  try {
    if (path.startsWith("config")) {
      const configPath = path.slice(7);
      const value = configGet(configPath || "/");
      return deprecate(NextResponse.json(value));
    }

    if (path === "users") {
      const users = usersGetAll();
      return deprecate(NextResponse.json(users));
    }

    if (path.startsWith("users/")) {
      const id = parts[1];
      const user = userGet(id);
      return deprecate(NextResponse.json(user || null));
    }

    if (path.startsWith("usernames/") || path.startsWith("wallets/") || path.startsWith("sol_wallets/")) {
      const table = parts[0] as "usernames" | "wallets" | "sol_wallets";
      const key = parts.slice(1).join("/");
      const userId = claimGet(table, key);
      return deprecate(NextResponse.json(userId));
    }

    if (path.startsWith("device_submissions/")) {
      const deviceId = parts.slice(1).join("/");
      const data = deviceSubmissionGet(deviceId);
      return deprecate(NextResponse.json(data));
    }

    if (path === "device_logins") {
      const logins = deviceLoginsGetAll();
      return deprecate(NextResponse.json(logins));
    }

    if (path.startsWith("device_logins/")) {
      const deviceId = parts[1];
      const login = deviceLoginGet(deviceId);
      return deprecate(NextResponse.json(login));
    }

    if (path === "adminRuntime/summary") {
      const users = usersGetAll();
      const totalUsers = Object.keys(users).length;
      const logins = deviceLoginsGetAll();
      const totalLogins = Object.values(logins).reduce((sum, d) => sum + d.count, 0);
      return deprecate(NextResponse.json({ totalUsers, totalLogins }));
    }

    return deprecate(NextResponse.json(null));
  } catch (error) {
    console.error("API GET error:", error);
    return deprecate(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  const { path } = await context.params;
  const parts = path.split("/");

  try {
    const body = await req.json();
    const value = body.value ?? body;

    if (path.startsWith("config")) {
      const configPath = path.slice(7);
      configSet(configPath || "/", value);
      return deprecate(NextResponse.json({ ok: true }));
    }

    if (path.startsWith("users/")) {
      const id = parts[1];
      userSet(id, value);
      return deprecate(NextResponse.json({ ok: true }));
    }

    if (path.startsWith("usernames/") || path.startsWith("wallets/") || path.startsWith("sol_wallets/")) {
      const table = parts[0] as "usernames" | "wallets" | "sol_wallets";
      const key = parts.slice(1).join("/");
      const userId = body.userId || value;
      claimSet(table, key, typeof userId === "string" ? userId : "");
      return deprecate(NextResponse.json({ ok: true }));
    }

    if (path.startsWith("device_submissions/")) {
      const deviceId = parts.slice(1).join("/");
      deviceSubmissionUpdate(deviceId, value);
      return deprecate(NextResponse.json({ ok: true }));
    }

    if (path.startsWith("device_logins/")) {
      const deviceId = parts[1];
      deviceLoginSet(deviceId, value.count ?? 1, value.lastLogin ?? Date.now());
      return deprecate(NextResponse.json({ ok: true }));
    }

    return deprecate(NextResponse.json({ ok: true }));
  } catch (error) {
    console.error("API PUT error:", error);
    return deprecate(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  const { path } = await context.params;
  const parts = path.split("/");

  try {
    const body = await req.json();
    const value = (body.value ?? body) as Record<string, unknown>;

    if (path.startsWith("config")) {
      const configPath = path.slice(7);
      const existing = (configGet(configPath || "/") as Record<string, unknown>) || {};
      configSet(configPath || "/", { ...existing, ...value });
      return deprecate(NextResponse.json({ ok: true }));
    }

    if (path.startsWith("users/")) {
      const id = parts[1];
      const updated = userUpdate(id, value);
      return deprecate(NextResponse.json(updated));
    }

    if (path.startsWith("device_submissions/")) {
      const deviceId = parts.slice(1).join("/");
      const updated = deviceSubmissionUpdate(deviceId, value);
      return deprecate(NextResponse.json(updated));
    }

    return deprecate(NextResponse.json({ ok: true }));
  } catch (error) {
    console.error("API PATCH error:", error);
    return deprecate(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  const { path } = await context.params;
  const parts = path.split("/");

  try {
    const body = await req.json();
    const value = body.value ?? body;

    if (path === "users") {
      const id = generateId();
      userSet(id, value);
      return deprecate(NextResponse.json({ id }));
    }

    if (path.startsWith("users/")) {
      const id = parts[1];
      userSet(id, value);
      return deprecate(NextResponse.json({ id }));
    }

    if (path.startsWith("referralEvents/")) {
      const eventId = parts.slice(1).join("/");
      referralEventSet(eventId || generateId(), value);
      return deprecate(NextResponse.json({ ok: true }));
    }

    if (path.startsWith("device_submissions/")) {
      const deviceId = parts.slice(1).join("/");
      deviceSubmissionUpdate(deviceId, value);
      return deprecate(NextResponse.json({ ok: true }));
    }

    const id = generateId();
    if (path.endsWith("/transaction")) {
      return deprecate(NextResponse.json({ committed: true, snapshot: value }));
    }

    return deprecate(NextResponse.json({ id }));
  } catch (error) {
    console.error("API POST error:", error);
    return deprecate(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  const { path } = await context.params;
  const parts = path.split("/");

  try {
    if (path.startsWith("users/")) {
      const id = parts[1];
      userDelete(id);
      return deprecate(NextResponse.json({ ok: true }));
    }

    return deprecate(NextResponse.json({ ok: true }));
  } catch (error) {
    console.error("API DELETE error:", error);
    return deprecate(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
}
