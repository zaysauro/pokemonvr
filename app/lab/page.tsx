"use client";

import { useEffect, useRef, useState } from "react";

const PIKACHU_MODEL =
  "https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular/25.glb";

export default function LabPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const existing = document.querySelector("script[src*='model-viewer']");
      if (!existing) {
        const script = document.createElement("script");
        script.type = "module";
        script.src =
          "https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js";
        document.head.appendChild(script);
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
          script.onerror = () => resolve();
        });
      }

      if (!alive || !hostRef.current) return;

      const viewer = document.createElement("model-viewer");
      viewer.setAttribute("src", PIKACHU_MODEL);
      viewer.setAttribute("camera-controls", "");
      viewer.setAttribute("auto-rotate", "");
      viewer.setAttribute("shadow-intensity", "1");
      viewer.setAttribute("ar", "");
      viewer.setAttribute("ar-modes", "webxr scene-viewer quick-look");
      viewer.setAttribute("alt", "Pikachu 3D model");
      viewer.style.width = "100%";
      viewer.style.height = "70svh";
      viewer.style.background = "#10121a";
      hostRef.current.replaceChildren(viewer);
      setReady(true);
    }

    load();

    return () => {
      alive = false;
      hostRef.current?.replaceChildren();
    };
  }, []);

  return (
    <main className="home">
      <section className="card" style={{ maxWidth: 1100 }}>
        <div className="eyebrow">3D / WebXR lab</div>
        <h2>Pokémon model test</h2>
        <p>
          This route is independent from image tracking. It is useful for
          testing GLB loading, model-viewer AR and device capabilities.
        </p>
        <div ref={hostRef} style={{ borderRadius: 20, overflow: "hidden" }} />
        {!ready && <p>Loading model viewer…</p>}
      </section>
    </main>
  );
}
