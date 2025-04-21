import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cards = await prisma.card.findMany({
    select: { id: true, name: true, cardId: true },
  });
  return NextResponse.json(cards);
}
