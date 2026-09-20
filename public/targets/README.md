# AR image targets

The production AR flow expects:

- `public/targets/pokemon-cards.mind` — compiled MindAR target database
- `public/targets/card.jpg` — reference image used only for the transparent alignment plane

## Generate the target

1. Photograph or scan the real Pokémon card you want to recognize.
2. Crop it tightly and use a high-resolution image.
3. Open the MindAR Image Target Compiler:
   https://hiukim.github.io/mind-ar-js-doc/tools/compile/
4. Upload the card image.
5. Download the generated `.mind` file.
6. Put it here as `pokemon-cards.mind`.
7. Put the same card image here as `card.jpg`.
8. Set `NEXT_PUBLIC_AR_TARGET_MODE=local` in Vercel.

For the first test, the app defaults to the public MindAR demo target so deployment can be verified before adding a real card target.
