import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
  transactionDeleteSchema,
  transactionInputSchema,
} from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  if (!json || !Array.isArray(json.items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const results: any[] = [];

  for (const item of json.items) {
    const { entity, op } = item as any;
    if (entity === "transaction") {
      if (op === "delete") {
        const parsedDelete = transactionDeleteSchema.safeParse(item.payload);
        if (!parsedDelete.success) {
          results.push({
            clientId: item.clientId,
            status: "error",
            error: "invalid transaction",
          });
          continue;
        }
        const payload = parsedDelete.data;
        await prisma.transaction.updateMany({
          where: { userId, clientId: payload.clientId },
          data: { isDeleted: true, clientUpdatedAt: payload.clientUpdatedAt },
        });
        results.push({ clientId: payload.clientId, status: "synced" });
        continue;
      }
      const parsed = transactionInputSchema.safeParse(item.payload);
      if (!parsed.success) {
        results.push({
          clientId: item.clientId,
          status: "error",
          error: "invalid transaction",
        });
        continue;
      }
      const payload = parsed.data;
      const existing = await prisma.transaction.findFirst({
        where: { userId, clientId: payload.clientId },
      });
      const incomingUpdated = payload.clientUpdatedAt.getTime();
      if (existing && existing.clientUpdatedAt.getTime() > incomingUpdated) {
        results.push({ clientId: payload.clientId, status: "skipped" });
        continue;
      }
      const saved = await prisma.transaction.upsert({
        where: { userId_clientId: { userId, clientId: payload.clientId } },
        update: {
          amountCents: payload.amountCents,
          currencyCode: payload.currencyCode,
          note: payload.note,
          occurredAt: payload.occurredAt,
          clientUpdatedAt: payload.clientUpdatedAt,
          isDeleted: false,
          source: payload.source,
          syncedAt: new Date(),
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
      results.push({
        clientId: payload.clientId,
        serverId: saved.id,
        status: "synced",
      });
    } else {
      results.push({
        clientId: item.clientId,
        status: "error",
        error: "unknown entity",
      });
    }
  }

  return NextResponse.json({ results });
}
