import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CLIENT_ID = process.env.TCGPLAYER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.TCGPLAYER_CLIENT_SECRET || "";

async function getAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);

  const res = await axios.post("https://api.tcgplayer.com/token", params);
  return res.data.access_token;
}

async function getProductId(cardCode: string, token: string) {
  const { data } = await axios.get(
    "https://api.tcgplayer.com/catalog/products",
    {
      headers: { Authorization: `bearer ${token}` },
      params: {
        productLineName: "One Piece Card Game",
        productName: cardCode,
      },
    }
  );
  return data.results?.[0]?.productId || null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deckString } = body;

  if (!deckString) {
    return NextResponse.json({ error: "Missing deck string" }, { status: 400 });
  }

  try {
    const token = await getAccessToken();
    const lines = deckString.trim().split("\n");

    const parts = [];
    for (const line of lines) {
      const match = line.match(/^(\d+)x(\S+)/);
      if (!match) continue;

      const qty = match[1];
      const code = match[2];
      const productId = await getProductId(code, token);

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
