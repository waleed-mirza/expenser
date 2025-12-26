import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  currencyCode: z.string().length(3).optional(),
  timezone: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  return NextResponse.json({
    id: user?.id,
    email: user?.email,
    timezone: user?.timezone,
    settings: user?.settings,
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { currencyCode, timezone } = parsed.data;

  const data: any = {};
  if (timezone) data.timezone = timezone;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { settings: true },
  });

  if (currencyCode) {
    await prisma.userSetting.upsert({
      where: { userId },
      update: { currencyCode, timezone: timezone ?? user.timezone },
      create: {
        userId,
        currencyCode,
        timezone: timezone ?? user.timezone,
        weekStart: "monday",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
