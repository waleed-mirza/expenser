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
  const start =
    searchParams.get("start") ||
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
  const end = searchParams.get("end") || new Date().toISOString();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE(c."name", 'Uncategorized') AS category,
            COALESCE(c."color", '#94a3b8') AS color,
            SUM(t."amountCents") AS total_cents
     FROM "Transaction" t
     LEFT JOIN "Category" c ON c."id" = t."categoryId"
     WHERE t."userId" = $1 AND t."isDeleted" = false AND t."type" = 'expense'
       AND t."occurredAt" >= $2::timestamptz AND t."occurredAt" < $3::timestamptz
     GROUP BY 1,2
     ORDER BY total_cents DESC`,
    userId,
    start,
    end
  );

  return NextResponse.json({ start, end, type: "expense", rows });
}
