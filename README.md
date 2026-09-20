# Pokémon Card AR

Personal, non-commercial WebAR experiment.

Point a phone camera at a real Pokémon trading card and augment it with a 3D Pokémon model, animation and interactive effects.

## Current architecture

- Next.js + TypeScript
- A-Frame 1.8
- MindAR 1.2.5 for image tracking
- A-Frame Extras 7.7 for glTF animation mixing
- model-viewer WebXR/AR lab
- Vercel-ready deployment
- Optional Supabase foundation
- Pokémon 3D API for optimized GLB models

MindAR supports image tracking and has a dedicated A-Frame integration. A-Frame provides WebXR/3D infrastructure, while A-Frame Extras provides the `animation-mixer` component.

## Routes

- `/` — project landing page
- `/ar` — WebAR image-tracking experience
- `/lab` — 3D/WebXR model lab
- `/api/pokemon/:id` — server-side Pokémon 3D API proxy

## First test

The default mode is `demo`, which uses the public MindAR demo image target. This lets us verify:

1. Vercel deployment
2. HTTPS camera permissions
3. MindAR initialization
4. image tracking
5. GLB loading
6. animation mixer
7. mobile rendering

After that, replace the demo target with a real Pokémon card.

## Real Pokémon card

Generate a MindAR target database from a photo/scan of your physical card using the MindAR Image Target Compiler.

Place:

`public/targets/pokemon-cards.mind`

and:

`public/targets/card.jpg`

Then set:

`NEXT_PUBLIC_AR_TARGET_MODE=local`

## Supabase

Supabase is optional for the first AR proof-of-concept. The SQL migration in `supabase/migrations/001_initial.sql` creates:

- `ar_cards`
- `ar_scans`

The intended future architecture is a dynamic card catalog where a target/card ID resolves to a Pokémon, model, animation set and effects.

Do not commit secrets. Use Vercel environment variables.

## Asset credits / legal note

This is a personal fan project and is not affiliated with Nintendo, Creatures, GAME FREAK, The Pokémon Company or any related rights holder.

The Pokémon 3D API provides web-optimized models but explicitly notes that Pokémon models remain property of their rights holders. Open-source code and hosting do not transfer ownership of Pokémon assets.

## Roadmap

### Phase 1 — prove AR
- [x] Next.js shell
- [x] MindAR integration
- [x] demo image target
- [x] GLB loading
- [x] animation controls
- [x] 3D/WebXR lab
- [ ] real Pokémon card target

### Phase 2 — real card
- [ ] photograph/scan card
- [ ] compile .mind target
- [ ] tune scale/position
- [ ] test different lighting
- [ ] test iPhone/Android
- [ ] test Quest 3 browser

### Phase 3 — interaction
- [ ] attack animation detection
- [ ] particle effects
- [ ] sound effects
- [ ] tap/gesture interaction
- [ ] Pokémon-specific configuration

### Phase 4 — catalog
- [ ] Supabase card catalog
- [ ] multiple targets
- [ ] multiple Pokémon
- [ ] dynamic model loading
- [ ] animation metadata
- [ ] admin tools

### Phase 5 — spatial AR
- [ ] Quest 3 passthrough experiments
- [ ] WebXR immersive mode
- [ ] plane detection
- [ ] spatial Pokémon placement
- [ ] hand/controller interaction
- [ ] hybrid card + room experience

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Camera access requires HTTPS or localhost.

## Deployment

Import this repository into Vercel and deploy it as a Next.js project.

Supabase environment variables can be added later:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_AR_TARGET_MODE=demo
```

Never expose `SUPABASE_SECRET_KEY` to the browser.
