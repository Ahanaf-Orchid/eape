import { NextRequest, NextResponse } from "next/server";

// This catch-all API has been permanently deprecated.
// All functionality has been moved to dedicated endpoints with proper auth guards.
// See /api/config/public, /api/user/*, /api/admin/*, /api/campaign/*, /api/form/*

export async function GET() {
  return NextResponse.json(
    { error: "Gone", message: "This deprecated API has been removed. Use dedicated endpoints." },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Gone", message: "This deprecated API has been removed. Use dedicated endpoints." },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Gone", message: "This deprecated API has been removed. Use dedicated endpoints." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Gone", message: "This deprecated API has been removed. Use dedicated endpoints." },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Gone", message: "This deprecated API has been removed. Use dedicated endpoints." },
    { status: 410 }
  );
}
