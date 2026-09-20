import { NextResponse } from "next/server";

const SET_ID = "sv3pt5";

export async function GET() {
  const response = await fetch(
    `https://api.tcgdex.net/v2/en/sets/${SET_ID}`,
    { next: { revalidate: 86400 } }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not load Pokémon 151 card data." },
      { status: 502 }
    );
  }

  const set = await response.json();

  const targets = (set.cards ?? [])
    .filter((card: any) => {
      const number = Number.parseInt(card.localId, 10);
      return (
        card.category === "Pokemon" &&
        Number.isInteger(number) &&
        number >= 1 &&
        number <= 151 &&
        card.image
      );
    })
    .sort(
      (a: any, b: any) =>
        Number.parseInt(a.localId, 10) - Number.parseInt(b.localId, 10)
    )
    .map((card: any) => {
      const dexNumber = Number.parseInt(card.localId, 10);
      return {
        targetIndex: dexNumber - 1,
        dexNumber,
        name: card.name,
        cardId: card.id,
        imageUrl: `${card.image}/high.webp`,
        modelUrl: `https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/${dexNumber}.glb`,
      };
    });

  return NextResponse.json(
    {
      setId: SET_ID,
      setName: "151",
      targets,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    }
  );
}
