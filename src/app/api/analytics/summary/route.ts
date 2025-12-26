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
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
  const end = searchParams.get("end") || new Date().toISOString();

  const where = {
    userId,
    isDeleted: false,
    occurredAt: {
      gte: new Date(start),
      lt: new Date(end),
    },
  } as const;

  const expenseAgg = await prisma.transaction.aggregate({
    where: { ...where, type: "expense" },
    _sum: { amountCents: true },
    _count: { _all: true },
    _max: { amountCents: true, occurredAt: true },
  });

  const topExpense = await prisma.transaction.findFirst({
    where: { ...where, type: "expense" },
    orderBy: { amountCents: "desc" },
    select: {
      amountCents: true,
      note: true,
      occurredAt: true,
      currencyCode: true,
    },
  });

  const expenseSum = Number(expenseAgg._sum.amountCents ?? 0);

  const startDate = new Date(start);
  const endDate = new Date(end);
  const ms = endDate.getTime() - startDate.getTime();
  const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  const avgDaily = Math.floor(expenseSum / days);

  // Previous period comparison
  const prevEnd = startDate;
  const prevStart = new Date(startDate.getTime() - ms);
  const [prev] = (await prisma.$queryRawUnsafe<any[]>(
    `SELECT
      COALESCE(SUM("amountCents"), 0) AS expense_cents
     FROM "Transaction"
     WHERE "userId" = $1
       AND "isDeleted" = false
       AND "type" = 'expense'
       AND "occurredAt" >= $2::timestamptz
       AND "occurredAt" < $3::timestamptz`,
    userId,
    prevStart.toISOString(),
    prevEnd.toISOString()
  )) ?? [{ expense_cents: 0 }];

  return NextResponse.json({
    range: { start, end, tz },
    expenseCents: expenseSum,
    avgDailyExpenseCents: avgDaily,
    expenseCount: expenseAgg._count._all,
    topExpense: topExpense
      ? {
          amountCents: topExpense.amountCents,
          note: topExpense.note,
          occurredAt: topExpense.occurredAt,
          currencyCode: topExpense.currencyCode,
        }
      : null,
    previous: {
      expenseCents: Number(prev.expense_cents),
    },
    days,
  });
}
