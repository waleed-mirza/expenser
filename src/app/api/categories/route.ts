import { prisma } from "@/lib/prisma";
import { categoryInputSchema } from "@/lib/validators";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const items = await prisma.category.findMany({
    where: { userId, isDeleted: false },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const payload = parsed.data;
  const saved = await prisma.category.upsert({
    where: { userId_clientId: { userId, clientId: payload.clientId } },
    update: {
      name: payload.name,
      type: payload.type,
      color: payload.color,
      clientUpdatedAt: payload.clientUpdatedAt,
      isDeleted: false,
    },
    create: {
      userId,
      clientId: payload.clientId,
      name: payload.name,
      type: payload.type,
      color: payload.color,
      clientUpdatedAt: payload.clientUpdatedAt,
    },
  });
  return NextResponse.json({ item: saved });
}
