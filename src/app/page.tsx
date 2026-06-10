import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDollarSign, FileText, HandCoins, PieChart, ShieldCheck, Users } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { pricingPlans } from "@/lib/pricing";

const pains = [
  {
    icon: FileText,
    title: "Tickets éparpillés",
    text: "Les justificatifs vivent dans les mails, WhatsApp ou au fond d'un sac, et personne ne sait ce qui manque."
  },
  {
    icon: HandCoins,
    title: "Avances floues",
    text: "Un associé paie plus que les autres, puis les remboursements se perdent entre tableurs et promesses."
  },
  {
    icon: PieChart,
    title: "Marge invisible",
    text: "Sans vue projet, impossible de savoir si les dépenses servent vraiment le budget ou l'épuisent."
  }
];

const steps = [
  "Créez votre projet et choisissez la devise.",
  "Ajoutez vos associés avec rôle et couleur de suivi.",
  "Importez les dépenses, factures et justificatifs.",
  "Équilibrez les avances avec des KPI clairs par membre."
];

export default function Home() {
  const persoPlan = pricingPlans.find((plan) => plan.key === "perso");
  const teamPlans = pricingPlans.filter((plan) => plan.key !== "perso");

  return (
    <main>
      <header className="site-header">
        <nav className="container nav">
          <Link href="/" className="brand">
            <span>F</span>
            FrancoFacta
          </Link>
          <div className="nav-links">
            <Link href="#fonctionnement">Fonctionnement</Link>
            <Link href="#tarifs">Tarifs</Link>
            <Link href="/dashboard">Démo dashboard</Link>
          </div>
          <Link className="button secondary nav-cta" href="/auth">
            Connexion
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <ShieldCheck size={16} />
              Suivi financier simple pour associés de TPE
            </span>
            <h1>Entre potes, époux ou associés — reprenez le contrôle.</h1>
            <p>
              FrancoFacta centralise les frais, justificatifs et avances de chaque partenaire pour garder une vision
              nette des contributions, remboursements et budgets projet.
            </p>
            <div className="hero-actions">
              <CheckoutButton plan="starter" variant="accent">
                Démarrer avec Starter
              </CheckoutButton>
              <Link className="button secondary" href="/onboarding?mode=demo">
                Configurer un projet
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="hero-proof" aria-label="Indicateurs produit">
              <span>Export PDF inclus</span>
              <span>Agenda + contacts</span>
              <span>Stripe + Supabase</span>
            </div>
          </div>

          <div className="card hero-card" aria-label="Aperçu FrancoFacta">
            <div className="browser-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="mini-dashboard">
              <div>
                <p className="muted">Projet</p>
                <h3>Ouverture boutique Lyon</h3>
              </div>
              <div className="mini-kpis">
                <div>
                  <span>Total engagé</span>
                  <strong>12 840 EUR</strong>
                </div>
                <div>
                  <span>À rembourser</span>
                  <strong>1 260 EUR</strong>
                </div>
              </div>
              <div className="member-row">
                <span className="avatar-dot" style={{ background: "#c94a1a" }} />
                <span>Camille - opérations</span>
                <strong>4 200 EUR</strong>
              </div>
              <div className="member-row">
                <span className="avatar-dot" style={{ background: "#0f0f0f" }} />
                <span>Yanis - finance</span>
                <strong>5 120 EUR</strong>
              </div>
              <div className="receipt-card">
                <FileText size={20} />
                <div>
                  <strong>Facture enseigne.pdf</strong>
                  <p className="muted">Justificatif ajouté et lié à la dépense.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="douleurs">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Ce que FrancoFacta résout</span>
            <h2>Moins de frictions, plus de confiance entre partenaires.</h2>
          </div>
          <div className="pain-grid">
            {pains.map((pain) => (
              <article className="card pain-card" key={pain.title}>
                <pain.icon size={28} />
                <h3>{pain.title}</h3>
                <p className="muted">{pain.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section" id="fonctionnement">
        <div className="container process-grid">
          <div className="section-heading">
            <span className="eyebrow">Comment ça marche</span>
            <h2>Quatre étapes pour passer du flou au pilotage.</h2>
            <p className="muted">
              L&apos;onboarding crée une structure de projet exploitable par les associés, puis le tableau de bord prend le
              relais pour suivre chaque dépense.
            </p>
          </div>
          <div className="steps">
            {steps.map((step, index) => (
              <div className="step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="tarifs">
        <div className="container">
          <div className="section-heading pricing-heading">
            <span className="eyebrow">
              <CircleDollarSign size={16} />
              Tarifs
            </span>
            <h2>Un plan pour chaque rythme d&apos;équipe.</h2>
            <p className="muted">Perso, Starter, Pro ou accompagnement sur mesure selon votre projet.</p>
          </div>
          {persoPlan ? (
            <article className="card perso-banner">
              <div>
                <span className="pill">Pour un projet ponctuel ?</span>
                <h3>{persoPlan.name}</h3>
                <p>Mariage, construction, rénovation, événement — accès complet 12 mois.</p>
              </div>
              <div className="perso-banner-action">
                <div className="price">
                  <span>{persoPlan.priceLabel}</span>
                  <small>paiement unique</small>
                </div>
                <CheckoutButton plan="perso" variant="accent">
                  {persoPlan.ctaLabel}
                </CheckoutButton>
              </div>
            </article>
          ) : null}
          <div className="pricing-grid">
            {teamPlans.map((plan) => (
              <article className={`card price-card ${plan.highlight ? "highlight" : ""}`} key={plan.key}>
                {plan.highlight ? <span className="pill">Recommandé</span> : null}
                <h3>{plan.name}</h3>
                <p className="muted">{plan.tagline}</p>
                {plan.priceLabel ? (
                  <div className="price">
                    <span>{plan.priceLabel}</span>
                    {plan.priceSuffix ? <small>{plan.priceSuffix}</small> : null}
                  </div>
                ) : null}
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={17} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.key === "sur-mesure" ? (
                  <Link
                    className="button secondary"
                    href={plan.calendlyUrl ?? "https://calendly.com/francofacta/rendez-vous"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {plan.ctaLabel}
                    <ArrowUpRight size={18} />
                  </Link>
                ) : (
                  <CheckoutButton plan={plan.key} variant={plan.highlight ? "accent" : "secondary"}>
                    {plan.ctaLabel}
                  </CheckoutButton>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section final-cta">
        <div className="container card final-card">
          <Users size={32} />
          <h2>Remettez vos associés autour du même chiffre.</h2>
          <p>
            Lancez FrancoFacta, configurez votre premier projet et invitez les partenaires qui avancent les dépenses.
          </p>
          <div className="hero-actions">
            <CheckoutButton plan="starter" variant="accent">
              Choisir Starter
            </CheckoutButton>
            <Link className="button secondary" href="/dashboard">
              Voir le tableau de bord
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
