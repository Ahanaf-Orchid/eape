import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { usersGetAll } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("perPage")) || 50));
    const search = url.searchParams.get("search")?.toLowerCase();
    const status = url.searchParams.get("status");

    const allUsers = usersGetAll();
    let entries = Object.entries(allUsers);

    if (search) {
      entries = entries.filter(([_, u]) => {
        const user = u as Record<string, unknown>;
        return (
          (typeof user.username === "string" && user.username.toLowerCase().includes(search)) ||
          (typeof user.wallet === "string" && user.wallet.toLowerCase().includes(search))
        );
      });
    }

    if (status) {
      entries = entries.filter(([_, u]) => {
        const user = u as Record<string, unknown>;
        return user.verificationStatus === status;
      });
    }

    entries.sort((a, b) => {
      const tsA = Number((a[1] as Record<string, unknown>).timestamp) || 0;
      const tsB = Number((b[1] as Record<string, unknown>).timestamp) || 0;
      return tsB - tsA;
    });

    const total = entries.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const paginated = entries.slice(start, start + perPage);

    const users = Object.fromEntries(paginated);

    return NextResponse.json({ users, total, page, totalPages });
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
