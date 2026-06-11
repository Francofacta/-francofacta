import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <main className="legal-page">
      <section className="container card legal-card">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <span className="eyebrow">Mentions légales</span>
        <h1>Mentions légales</h1>
        <div className="legal-content">
          <h2>Éditeur</h2>
          <p>
            FrancoFacta est édité par Aghilas AISSAT, Entrepreneur individuel, SIREN 994902070, 22 Rue Pascal 93110
            Rosny-sous-Bois.
          </p>
          <p>Contact : francofacta@outlook.fr</p>

          <h2>Hébergement</h2>
          <p>Application hébergée par Vercel Inc.</p>

          <h2>Base de données</h2>
          <p>Les données applicatives sont stockées via Supabase.</p>
        </div>
      </section>
    </main>
  );
}
