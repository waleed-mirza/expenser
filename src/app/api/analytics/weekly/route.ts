import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const tz = searchParams.get("tz") || "Asia/Karachi";
  const start =
    searchParams.get("start") ||
    new Date(new Date().setDate(new Date().getDate() - 84)).toISOString();
  const end = searchParams.get("end") || new Date().toISOString();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT date_trunc('week', "occurredAt" AT TIME ZONE $3) AS week_start,
            SUM("amountCents") AS expense_cents
     FROM "Transaction"
     WHERE "userId" = $1 AND "isDeleted" = false
       AND "type" = 'expense'
       AND "occurredAt" >= $2::timestamptz AND "occurredAt" < $4::timestamptz
     GROUP BY 1
     ORDER BY 1`,
    userId,
    start,
    tz,
    end
  );

  return NextResponse.json({ tz, start, end, weeks: rows });
}
