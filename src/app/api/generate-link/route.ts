import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getProductId(cardId: string): Promise<string | null> {
  const card = await prisma.card.findFirst({
    where: {
      cardId,
    },
  });

  const productIdAsString = card?.productId.toString() || null;

  return productIdAsString;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deckString } = body;

  if (!deckString) {
    return NextResponse.json({ error: "Missing deck string" }, { status: 400 });
  }

  try {
    const lines = deckString.trim().split("\n");

    const parts = [];
    for (const line of lines) {
      const match = line.match(/^(\d+)x(\S+)/);
      if (!match) continue;

      const qty = match[1];
      const code = match[2];
      const productId = await getProductId(code);

      if (productId) {
        parts.push(`${qty}-${productId}`);
      }
    }

    const finalLink = `https://www.tcgplayer.com/massentry?c=${parts.join(
      "||"
    )}&productline=One%20Piece%20Card%20Game`;
    return NextResponse.json({ link: finalLink });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
