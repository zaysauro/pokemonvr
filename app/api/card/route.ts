import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cardId = request.nextUrl.searchParams.get("id");

  if (!cardId) {
    return NextResponse.json({ error: "Card id is required." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`,
    { next: { revalidate: 86400 } }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not load card details." },
      { status: response.status === 404 ? 404 : 502 }
    );
  }

  const card = await response.json();

  return NextResponse.json(card, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
