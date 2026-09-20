"use client";

import dynamic from "next/dynamic";

const ARExperience = dynamic(() => import("@/components/ARExperience"), {
  ssr: false,
  loading: () => (
    <div className="home">
      <section className="card">
        <div className="eyebrow">Pokémon Card AR</div>
        <h2>Loading AR engine…</h2>
        <p>Preparing camera, image tracking and the 3D scene.</p>
      </section>
    </div>
  )
});

export default function ARPage() {
  return <ARExperience />;
}
