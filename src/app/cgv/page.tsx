import Link from "next/link";

export default function CgvPage() {
  return (
    <main className="legal-page">
      <section className="container card legal-card">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <span className="eyebrow">Conditions générales</span>
        <h1>CGV</h1>
        <div className="legal-content">
          <h2>Offres</h2>
          <ul>
            <li>Perso : 29€ en paiement unique.</li>
            <li>Starter : 19€/mois.</li>
            <li>Pro : 39€/mois.</li>
            <li>Sur mesure : sur devis.</li>
          </ul>

          <h2>Durée et résiliation</h2>
          <p>
            Les abonnements mensuels sont renouvelés automatiquement et peuvent être résiliés selon les modalités
            indiquées lors de la souscription.
          </p>

          <h2>Droit de rétractation et remboursement</h2>
          <p>
            Le client dispose d&apos;un droit de rétractation de 14 jours. Les demandes de remboursement sont étudiées via le
            support FrancoFacta.
          </p>

          <h2>Contact</h2>
          <p>Pour toute question : francofacta@outlook.fr.</p>
        </div>
      </section>
    </main>
  );
}
