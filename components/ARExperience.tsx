"use client";

import { useEffect, useRef, useState } from "react";

const MINDAR_VERSION = "1.2.5";
const MINDAR_CORE_SCRIPT = `https://cdn.jsdelivr.net/npm/mind-ar@${MINDAR_VERSION}/dist/mindar-image.prod.js`;
const MINDAR_SCRIPT = `https://cdn.jsdelivr.net/npm/mind-ar@${MINDAR_VERSION}/dist/mindar-image-aframe.prod.js`;
const AFRAME_SCRIPT = "https://aframe.io/releases/1.6.0/aframe.min.js";
const EXTRAS_SCRIPT =
  "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.7.0/dist/aframe-extras.min.js";

const CATALOG_URL = "/api/pokemon-151";
const CACHE_DB = "pokemonvr-ar-cache";
const CACHE_STORE = "targets";
const CACHE_KEY = "pokemon-151-mind-v3";

type TargetEntry = {
  targetIndex: number;
  dexNumber: number;
  name: string;
  cardId: string;
  imageUrl: string;
  modelUrl: string;
};

type Catalog = {
  targets: TargetEntry[];
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
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(CACHE_STORE);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedMind(): Promise<Blob | null> {
  try {
    const db = await openCache();

    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(CACHE_STORE, "readonly")
        .objectStore(CACHE_STORE)
        .get(CACHE_KEY);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function saveCachedMind(blob: Blob) {
  try {
    const db = await openCache();

    await new Promise<void>((resolve, reject) => {
      const request = db
        .transaction(CACHE_STORE, "readwrite")
        .objectStore(CACHE_STORE)
        .put(blob, CACHE_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Cache is only an optimization. AR can still work without it.
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    const timeout = window.setTimeout(() => {
      reject(new Error(`Timeout carregando imagem da carta: ${url}`));
    }, 20000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };

    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error(`Não consegui carregar a imagem da carta: ${url}`));
    };

    image.src = url;
  });
}

async function buildMindFile(
  targets: TargetEntry[],
  onProgress: (value: number) => void
): Promise<Blob> {
  const mindar = (window as any).MINDAR;

  if (!mindar?.Compiler) {
    throw new Error(
      "O compilador MindAR não foi carregado. Recarregue a página."
    );
  }

  const compiler = new mindar.Compiler();
  const images: HTMLImageElement[] = [];

  for (let i = 0; i < targets.length; i++) {
    onProgress(Math.round((i / targets.length) * 30));

    const image = await loadImage(targets[i].imageUrl);
    images.push(image);
  }

  onProgress(32);

  await compiler.compileImageTargets(images, (progress: number) => {
    onProgress(32 + Math.round(progress * 0.68));
  });

  const buffer = await compiler.exportData();
  return new Blob([buffer], { type: "application/octet-stream" });
}

function setMindar(scene: HTMLElement, imageTargetSrc: string) {
  scene.setAttribute(
    "mindar-image",
    `imageTargetSrc: ${imageTargetSrc}; autoStart: true; maxTrack: 1; uiLoading: no; uiScanning: no; uiError: no;`
  );
}

export default function ARExperience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLElement | null>(null);
  const activePokemonRef = useRef<HTMLElement | null>(null);
  const activeTargetRef = useRef<number | null>(null);

  const [status, setStatus] = useState("Preparando AR…");
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [pokemonName, setPokemonName] = useState<string | null>(null);
  const [targetCount, setTargetCount] = useState(0);
  const [cardDetails, setCardDetails] = useState<any | null>(null);

  useEffect(() => {
    let disposed = false;
    let mindUrl: string | null = null;

    async function start() {
      try {
        setError(null);
        setStatus("Carregando catálogo Pokémon 151…");

        const catalogResponse = await fetch(CATALOG_URL, {
          cache: "no-store",
        });

        if (!catalogResponse.ok) {
          throw new Error("Não consegui carregar o catálogo Pokémon 151.");
        }

        const catalog = (await catalogResponse.json()) as Catalog;
        const targets = catalog.targets;

        if (targets.length < 151) {
          throw new Error(
            `O catálogo retornou apenas ${targets.length}/151 cartas Pokémon.`
          );
        }

        setTargetCount(targets.length);

        setStatus("Carregando núcleo MindAR…");
        await loadScript(MINDAR_CORE_SCRIPT);

        setStatus("Carregando A-Frame…");
        await loadScript(AFRAME_SCRIPT);

        setStatus("Carregando suporte de animação…");
        await loadScript(EXTRAS_SCRIPT);

        setStatus("Carregando MindAR…");
        await loadScript(MINDAR_SCRIPT);

        if (disposed || !stageRef.current) return;

        let mindBlob = await getCachedMind();

        if (mindBlob) {
          setStatus("Target bank 151 encontrado no cache. Inicializando câmera…");
        } else {
          setStatus(
            "Primeiro acesso: preparando as 151 cartas… isso pode levar alguns minutos."
          );

          mindBlob = await buildMindFile(targets, (progress) => {
            if (!disposed) {
              setStatus(`Preparando banco AR: ${progress}%`);
            }
          });

          await saveCachedMind(mindBlob);
        }

        if (disposed || !stageRef.current) return;

        mindUrl = URL.createObjectURL(mindBlob);

        const scene = document.createElement("a-scene");
        setMindar(scene, mindUrl);
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

        const camera = document.createElement("a-camera");
        camera.setAttribute("position", "0 0 0");
        camera.setAttribute("look-controls", "enabled: false");
        scene.appendChild(camera);

        for (const entry of targets) {
          const targetEntity = document.createElement("a-entity");

          targetEntity.setAttribute(
            "mindar-image-target",
            `targetIndex: ${entry.targetIndex}`
          );
          targetEntity.setAttribute("data-dex", String(entry.dexNumber));
          targetEntity.setAttribute("data-name", entry.name);

          const pokemon = document.createElement("a-gltf-model");
          pokemon.setAttribute(
            "position",
            "0 0.12 0.15"
          );
          pokemon.setAttribute("rotation", "0 0 0");
          pokemon.setAttribute("scale", "0.35 0.35 0.35");
          pokemon.setAttribute("visible", "false");

          targetEntity.appendChild(pokemon);
          scene.appendChild(targetEntity);

          targetEntity.addEventListener("targetFound", async () => {
            activeTargetRef.current = entry.targetIndex;
            activePokemonRef.current = pokemon;

            if (!pokemon.getAttribute("src")) {
              pokemon.setAttribute("src", entry.modelUrl);
              pokemon.setAttribute(
                "animation-mixer",
                "clip: *; loop: repeat; timeScale: 1"
              );
            }

            pokemon.setAttribute("visible", "true");

            setFound(true);
            setPokemonName(entry.name);
            setCardDetails(null);
            setStatus(`${entry.name} encontrado — carregando dados da carta…`);

            try {
              const detailsResponse = await fetch(
                `/api/card?id=${encodeURIComponent(entry.cardId)}`,
                { cache: "force-cache" }
              );

              if (detailsResponse.ok) {
                const details = await detailsResponse.json();
                if (activeTargetRef.current === entry.targetIndex) {
                  setCardDetails(details);
                  setStatus(`${entry.name} encontrado — AR ativo.`);
                }
              }
            } catch (detailsError) {
              console.warn("TCGdex card details", detailsError);
              if (activeTargetRef.current === entry.targetIndex) {
                setStatus(`${entry.name} encontrado — AR ativo.`);
              }
            }
          });

          targetEntity.addEventListener("targetLost", () => {
            if (activeTargetRef.current === entry.targetIndex) {
              setFound(false);
              activePokemonRef.current = null;
              activeTargetRef.current = null;
              setPokemonName(null);
              setCardDetails(null);
              setStatus("Carta perdida. Aponte novamente para uma carta.");
            }

            pokemon.setAttribute("visible", "false");
          });
        }

        scene.addEventListener("arReady", () => {
          if (!disposed) {
            setStatus(
              `AR pronto — procurando qualquer uma das ${targets.length} cartas Pokémon 151.`
            );
          }
        });

        scene.addEventListener("arError", (event) => {
          console.error("MindAR arError", event);
          setError(
            "O MindAR não conseguiu iniciar. Verifique a câmera, HTTPS e o navegador."
          );
        });

        stageRef.current.replaceChildren(scene);
        sceneRef.current = scene;

        setStatus(
          `Câmera iniciando — ${targets.length} cartas carregadas no reconhecimento.`
        );
      } catch (err) {
        console.error(err);

        if (!disposed) {
          setError(err instanceof Error ? err.message : "Erro desconhecido no AR.");
          setStatus("Não foi possível iniciar o AR.");
        }
      }
    }

    start();

    return () => {
      disposed = true;

      try {
        const scene = sceneRef.current as any;
        if (scene?.systems?.["mindar-image"]) {
          scene.systems["mindar-image-system"].stop();
        }
      } catch {
        // Ignore teardown errors.
      }

      stageRef.current?.replaceChildren();

      if (mindUrl) {
        URL.revokeObjectURL(mindUrl);
      }
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
              : `Aponte para uma carta Pokémon. Reconhecimento configurado para os 151 Pokémon do set 151.`}
          </div>

          {found && cardDetails && (
            <div className="card-info">
              <strong>
                {cardDetails.name ?? pokemonName}
                {cardDetails.localId ? ` #${cardDetails.localId}` : ""}
              </strong>

              <div className="card-info-grid">
                {cardDetails.rarity && <span>Raridade: {cardDetails.rarity}</span>}
                {cardDetails.hp && <span>HP: {cardDetails.hp}</span>}
                {cardDetails.types?.length > 0 && (
                  <span>Tipo: {cardDetails.types.join(" / ")}</span>
                )}
                {cardDetails.stage && <span>Estágio: {cardDetails.stage}</span>}
              </div>

              {cardDetails.abilities?.length > 0 && (
                <div>
                  <b>Habilidades:</b>{" "}
                  {cardDetails.abilities.map((a: any) => a.name).join(", ")}
                </div>
              )}

              {cardDetails.attacks?.length > 0 && (
                <div>
                  <b>Ataques:</b>{" "}
                  {cardDetails.attacks.map((a: any) => a.name).join(", ")}
                </div>
              )}
            </div>
          )}

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
