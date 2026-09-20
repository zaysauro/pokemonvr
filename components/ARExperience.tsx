"use client";

import { useEffect, useRef, useState } from "react";

const DEMO_TARGET =
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind";

const DEMO_CARD =
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png";

const PIKACHU_MODEL =
  "https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/25.glb";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export default function ARExperience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLElement | null>(null);
  const pokemonRef = useRef<HTMLElement | null>(null);

  const [status, setStatus] = useState("Loading AR engine…");
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function start() {
      try {
        setStatus("Loading A-Frame…");
        await loadScript("https://aframe.io/releases/1.8.0/aframe.min.js");

        setStatus("Loading animation support…");
        await loadScript(
          "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.7.0/dist/aframe-extras.min.js"
        );

        setStatus("Loading MindAR…");
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"
        );

        if (disposed || !stageRef.current) return;

        const targetMode =
          process.env.NEXT_PUBLIC_AR_TARGET_MODE === "local"
            ? "local"
            : "demo";

        const target =
          targetMode === "local" ? "/targets/pokemon-cards.mind" : DEMO_TARGET;

        const scene = document.createElement("a-scene");
        scene.setAttribute(
          "mindar-image",
          `imageTargetSrc: ${target}; autoStart: true;`
        );
        scene.setAttribute(
          "renderer",
          "colorManagement: true; physicallyCorrectLights: true; antialias: true"
        );
        scene.setAttribute("color-space", "sRGB");
        scene.setAttribute("vr-mode-ui", "enabled: false");
        scene.setAttribute(
          "device-orientation-permission-ui",
          "enabled: false"
        );
        scene.setAttribute("embedded", "");

        const assets = document.createElement("a-assets");

        const card = document.createElement("img");
        card.id = "reference-card";
        card.crossOrigin = "anonymous";
        card.src = targetMode === "local" ? "/targets/card.jpg" : DEMO_CARD;

        const model = document.createElement("a-asset-item");
        model.id = "pikachu-model";
        model.setAttribute("src", PIKACHU_MODEL);

        assets.appendChild(card);
        assets.appendChild(model);

        const camera = document.createElement("a-camera");
        camera.setAttribute("position", "0 0 0");
        camera.setAttribute("look-controls", "enabled: false");

        const targetEntity = document.createElement("a-entity");
        targetEntity.setAttribute("mindar-image-target", "targetIndex: 0");

        const cardPlane = document.createElement("a-plane");
        cardPlane.setAttribute("src", "#reference-card");
        cardPlane.setAttribute("position", "0 0 0");
        cardPlane.setAttribute("rotation", "0 0 0");
        cardPlane.setAttribute("width", "1");
        cardPlane.setAttribute("height", "1.4");
        cardPlane.setAttribute("material", "transparent: true; opacity: 0");

        const pokemon = document.createElement("a-gltf-model");
        pokemon.setAttribute("id", "pokemon");
        pokemon.setAttribute("src", "#pikachu-model");
        pokemon.setAttribute("position", "0 0.12 0.15");
        pokemon.setAttribute("rotation", "0 0 0");
        pokemon.setAttribute("scale", "0.35 0.35 0.35");
        pokemon.setAttribute(
          "animation-mixer",
          "clip: *; loop: repeat; timeScale: 1"
        );

        targetEntity.appendChild(cardPlane);
        targetEntity.appendChild(pokemon);
        scene.appendChild(assets);
        scene.appendChild(camera);
        scene.appendChild(targetEntity);
        stageRef.current.replaceChildren(scene);

        sceneRef.current = scene;
        pokemonRef.current = pokemon;

        targetEntity.addEventListener("targetFound", () => {
          setFound(true);
          setStatus("Card detected — Pikachu is ready!");
        });

        targetEntity.addEventListener("targetLost", () => {
          setFound(false);
          setStatus("Point the camera at the card…");
        });

        scene.addEventListener("arReady", () => {
          setStatus(
            targetMode === "local"
              ? "AR ready — scan your Pokémon card."
              : "AR demo ready — scan the MindAR demo card."
          );
        });

        scene.addEventListener("arError", () => {
          setError(
            "The camera/AR engine could not start. Check HTTPS, camera permission and browser compatibility."
          );
        });

        setStatus(
          targetMode === "local"
            ? "Starting camera…"
            : "Demo mode: scan the on-screen demo card."
        );
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : "Unknown AR error");
          setStatus("AR failed to start");
        }
      }
    }

    start();

    return () => {
      disposed = true;
      try {
        const scene = sceneRef.current as any;
        if (scene?.systems?.["mindar-image"]) {
          scene.systems["mindar-image"].stop();
        }
      } catch {
        // Ignore teardown errors from WebAR libraries.
      }
      stageRef.current?.replaceChildren();
    };
  }, []);

  function playAnimation(clip: string) {
    const pokemon = pokemonRef.current;
    if (!pokemon) return;

    pokemon.setAttribute(
      "animation-mixer",
      `clip: ${clip}; loop: once; clampWhenFinished: true; timeScale: 1`
    );

    window.setTimeout(() => {
      if (pokemon.isConnected) {
        pokemon.setAttribute(
          "animation-mixer",
          "clip: *; loop: repeat; timeScale: 1"
        );
      }
    }, 1800);
  }

  return (
    <main className="ar-shell">
      <div ref={stageRef} className="ar-stage" />

      <div className="ar-ui">
        <div className="ar-top">
          <div className={`status ${error ? "error" : ""}`}>
            {error ?? status}
          </div>
          <button
            className="secondary"
            onClick={() => window.history.back()}
          >
            Exit
          </button>
        </div>

        <div className="ar-bottom">
          <div className="help">
            {found
              ? "Pikachu encontrado. Teste as animações abaixo."
              : "Permita a câmera e aponte para a imagem-alvo."}
          </div>

          <button
            className="ar-button"
            disabled={!found}
            onClick={() => playAnimation("Attack")}
          >
            ⚡ Attack
          </button>

          <button
            className="secondary"
            disabled={!found}
            onClick={() => playAnimation("Idle")}
          >
            Idle
          </button>
        </div>
      </div>
    </main>
  );
}
