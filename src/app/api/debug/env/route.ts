import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  return NextResponse.json({
    DATABASE_URL_present: hasDbUrl,
    NODE_ENV: process.env.NODE_ENV,
  });
}
