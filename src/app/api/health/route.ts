import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "quiz-platform",
    timestamp: new Date().toISOString(),
  });
}
