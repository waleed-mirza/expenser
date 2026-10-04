import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { DEFAULT_TZ, periodStarts } from "@/lib/time";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** Today / this week / this month spend for the dashboard, in the user's time zone. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const now = new Date();
  let starts: ReturnType<typeof periodStarts>;
  try {
    starts = periodStarts(now, session.user.timezone || DEFAULT_TZ);
  } catch {
    // Stored time zone isn't a valid IANA name.
    starts = periodStarts(now, DEFAULT_TZ);
  }

  const sum = (gte: Date) =>
    prisma.transaction.aggregate({
      where: { userId, isDeleted: false, type: "expense", occurredAt: { gte } },
      _sum: { amountCents: true },
      _count: { _all: true },
    });

  const [today, week, month] = await Promise.all([
    sum(starts.day),
    sum(starts.week),
    sum(starts.month),
  ]);

  return NextResponse.json({
    todayCents: Number(today._sum.amountCents ?? 0),
    todayCount: today._count._all,
    weekCents: Number(week._sum.amountCents ?? 0),
    monthCents: Number(month._sum.amountCents ?? 0),
  });
}
