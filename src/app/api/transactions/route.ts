import { prisma } from "@/lib/prisma";
import {
  transactionDeleteSchema,
  transactionInputSchema,
  transactionUpdateSchema,
} from "@/lib/validators";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const take = Number(searchParams.get("take")) || 50;
  const skip = Number(searchParams.get("skip")) || 0;

  const where: any = { userId, isDeleted: false };
  if (start) where.occurredAt = { gte: new Date(start) };
  if (end)
    where.occurredAt = { ...(where.occurredAt ?? {}), lte: new Date(end) };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take,
      skip,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const parsed = transactionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const payload = parsed.data;

  const saved = await prisma.transaction.upsert({
    where: { userId_clientId: { userId, clientId: payload.clientId } },
    update: {
      amountCents: payload.amountCents,
      currencyCode: payload.currencyCode,
      note: payload.note,
      occurredAt: payload.occurredAt,
      clientUpdatedAt: payload.clientUpdatedAt,
      source: payload.source,
      syncedAt: new Date(),
      isDeleted: false,
      type: "expense",
    },
    create: {
      userId,
      clientId: payload.clientId,
      amountCents: payload.amountCents,
      currencyCode: payload.currencyCode,
      note: payload.note,
      occurredAt: payload.occurredAt,
      clientUpdatedAt: payload.clientUpdatedAt,
      source: payload.source,
      syncedAt: new Date(),
      type: "expense",
    },
  });

  return NextResponse.json({ item: saved });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const payload = parsed.data;
  const existing = await prisma.transaction.findUnique({
    where: { userId_clientId: { userId, clientId: payload.clientId } },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.transaction.update({
    where: { userId_clientId: { userId, clientId: payload.clientId } },
    data: {
      amountCents: payload.amountCents ?? existing.amountCents,
      currencyCode: payload.currencyCode ?? existing.currencyCode,
      note: payload.note ?? existing.note,
      occurredAt: payload.occurredAt ?? existing.occurredAt,
      clientUpdatedAt: payload.clientUpdatedAt ?? new Date(),
      syncedAt: new Date(),
      isDeleted: false,
      type: "expense",
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const parsed = transactionDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const payload = parsed.data;

  const existing = await prisma.transaction.findUnique({
    where: { userId_clientId: { userId, clientId: payload.clientId } },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.transaction.update({
    where: { userId_clientId: { userId, clientId: payload.clientId } },
    data: {
      isDeleted: true,
      clientUpdatedAt: payload.clientUpdatedAt,
      syncedAt: new Date(),
      type: "expense",
    },
  });

  return NextResponse.json({ ok: true });
}
