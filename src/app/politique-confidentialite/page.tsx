import Link from "next/link";

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="legal-page">
      <section className="container card legal-card">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <span className="eyebrow">Confidentialité</span>
        <h1>Politique de confidentialité</h1>
        <div className="legal-content">
          <h2>Données collectées</h2>
          <p>FrancoFacta collecte les emails, noms et dépenses liées aux projets créés dans l&apos;application.</p>

          <h2>Stockage et paiement</h2>
          <p>Les données projet sont stockées dans Supabase. Les paiements sont traités par Stripe.</p>

          <h2>Durée de conservation</h2>
          <p>Les données sont conservées pendant 3 ans après la dernière activité ou la fin de la relation contractuelle.</p>

          <h2>Droits RGPD</h2>
          <p>
            Vous pouvez demander l&apos;accès, la suppression ou la portabilité de vos données en écrivant à
            francofacta@outlook.fr.
          </p>
        </div>
      </section>
    </main>
  );
}
