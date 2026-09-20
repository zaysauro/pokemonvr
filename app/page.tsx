import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <section className="card">
        <div className="eyebrow">WebAR experiment</div>
        <h1>Pokémon<br />Card AR</h1>
        <p>
          A personal, non-commercial WebAR experiment: point a phone camera at
          a real Pokémon card and augment it with a 3D Pokémon.
        </p>

        <div className="actions">
          <Link href="/ar">
            <button>Open AR</button>
          </Link>
          <Link href="/lab">
            <button className="secondary">3D / WebXR Lab</button>
          </Link>
        </div>

        <p style={{ marginTop: 24, fontSize: 13 }}>
          The first build uses MindAR image tracking. The production target
          will be generated from your own card image and stored in
          <code> public/targets/pokemon-cards.mind</code>.
        </p>
      </section>
    </main>
  );
}
