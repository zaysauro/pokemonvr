export type PokemonForm = {
  name: string;
  model: string;
  formName: string;
};

export type PokemonRecord = {
  id: number;
  forms: PokemonForm[];
};

export const starterPokemon: PokemonRecord[] = [
  {
    id: 25,
    forms: [
      {
        name: "Pikachu",
        model:
          "https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/25.glb",
        formName: "regular"
      }
    ]
  },
  {
    id: 6,
    forms: [
      {
        name: "Charizard",
        model:
          "https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/6.glb",
        formName: "regular"
      }
    ]
  },
  {
    id: 1,
    forms: [
      {
        name: "Bulbasaur",
        model:
          "https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/1.glb",
        formName: "regular"
      }
    ]
  }
];
