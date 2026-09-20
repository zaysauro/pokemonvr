"use client";

import { useEffect, useRef, useState } from "react";

const DEMO_TARGET =
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind";

const DEMO_CARD =
  "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png";

const TARGET_MANIFEST = "/targets/pokemon-151.json";
const DEFAULT_MODEL =
  "https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/7.glb";

type TargetEntry = {
  targetIndex: number;
  dexNumber: number;
  name: string;
  modelUrl: string;
};

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

async function loadManifest(): Promise<TargetEntry[]> {
  const response = await fetch(TARGET_MANIFEST, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load Pokémon target manifest.");
  const data = await response.json();
  return Array.isArray(data.targets) ? data.targets : [];
}

export default function ARExperience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLElement | null>(null);
  const activePokemonRef = useRef<HTMLElement | null>(null);
  const activeTargetRef = useRef<number | null>(null);

  const [status, setStatus] = useState("Loading AR engine…");
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [pokemonName, setPokemonName] = useState<string | null>(null);
  const [targetCount, setTargetCount] = useState(0);

  useEffect(() => {
    let disposed = false;

    async function start() {
      try {
        setStatus("Loading Pokémon target catalog…");
        const manifest = await loadManifest();
        setTargetCount(manifest.length);

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
          process.env.NEXT_PUBLIC_AR_TARGET_MODE === "local" ? "local" : "demo";

        const target =
          targetMode === "local" ? "/targets/pokemon-151.mind" : DEMO_TARGET;

        const scene = document.createElement("a-scene");
        scene.setAttribute(
          "mindar-image",
          `imageTargetSrc: ${target}; autoStart: true; maxTrack: 1;`
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

        if (targetMode === "demo") {
          const card = document.createElement("img");
          card.id = "reference-card";
          card.crossOrigin = "anonymous";
          card.src = DEMO_CARD;
          assets.appendChild(card);
        }

        for (const entry of manifest) {
          const model = document.createElement("a-asset-item");
          model.id = `pokemon-model-${entry.targetIndex}`;
          model.setAttribute("src", entry.modelUrl);
          assets.appendChild(model);
        }

        const camera = document.createElement("a-camera");
        camera.setAttribute("position", "0 0 0");
        camera.setAttribute("look-controls", "enabled: false");
        scene.appendChild(assets);
        scene.appendChild(camera);

        const targetEntities: HTMLElement[] = [];

        for (const entry of manifest) {
          const targetEntity = document.createElement("a-entity");
          targetEntity.setAttribute(
            "mindar-image-target",
            `targetIndex: ${entry.targetIndex}`
          );
          targetEntity.setAttribute("data-dex", String(entry.dexNumber));

          const pokemon = document.createElement("a-gltf-model");
          pokemon.setAttribute("id", `pokemon-${entry.targetIndex}`);
          pokemon.setAttribute(
            "src",
            `#pokemon-model-${entry.targetIndex}`
          );
          pokemon.setAttribute("position", "0 0.12 0.15");
          pokemon.setAttribute("rotation", "0 0 0");
          pokemon.setAttribute("scale", "0.35 0.35 0.35");
          pokemon.setAttribute(
            "animation-mixer",
            "clip: *; loop: repeat; timeScale: 1"
          );

          targetEntity.appendChild(pokemon);
          scene.appendChild(targetEntity);
          targetEntities.push(targetEntity);

          targetEntity.addEventListener("targetFound", () => {
            activePokemonRef.current = pokemon;
            activeTargetRef.current = entry.targetIndex;
            setFound(true);
            setPokemonName(entry.name);
            setStatus(`${entry.name} encontrado — modelo carregado.`);
          });

          targetEntity.addEventListener("targetLost", () => {
            if (activeTargetRef.current === entry.targetIndex) {
              setFound(false);
              activePokemonRef.current = null;
              activeTargetRef.current = null;
              setPokemonName(null);
              setStatus("Procure outra carta Pokémon…");
            }
          });
        }

        stageRef.current.replaceChildren(scene);
        sceneRef.current = scene;

        scene.addEventListener("arReady", () => {
          setStatus(
            targetMode === "local"
              ? `AR pronto — procurando ${targetCount || manifest.length} Pokémon.`
              : "Modo demo — procure a carta de demonstração do MindAR."
          );
        });

        scene.addEventListener("arError", () => {
          setError(
            "A câmera/AR não conseguiu iniciar. Verifique HTTPS, permissão da câmera e compatibilidade do navegador."
          );
        });

        setStatus(
          targetMode === "local"
            ? `Câmera iniciando — banco com ${manifest.length} targets.`
            : "Modo demo: aponte para a carta de demonstração."
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
        // Ignore teardown errors.
      }
      stageRef.current?.replaceChildren();
    };
  }, []);

  function playAnimation(clip: string) {
    const pokemon = activePokemonRef.current;
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
              ? `${pokemonName ?? "Pokémon"} encontrado. O AR está rastreando esta carta.`
              : `Aponte para uma carta. Banco configurado para os 151 iniciais (${targetCount} targets).`}
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
