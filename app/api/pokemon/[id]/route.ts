import { NextResponse } from "next/server";

const API_URL =
  process.env.POKEMON_3D_API_URL ??
  "https://pokemon-3d-api.onrender.com/v1/pokemon";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!/^\\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid Pokémon ID" }, { status: 400 });
  }

  try {
    const response = await fetch(API_URL, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Pokémon 3D API unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const pokemon = Array.isArray(data?.pokemon)
      ? data.pokemon.find((item: { id?: number }) => item.id === Number(id))
      : null;

    if (!pokemon) {
      return NextResponse.json({ error: "Pokémon not found" }, { status: 404 });
    }

    return NextResponse.json(pokemon);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch Pokémon data" },
      { status: 500 }
    );
  }
}
