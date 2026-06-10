import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDollarSign, FileText, HandCoins, PieChart, ShieldCheck, Users } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { pricingPlans } from "@/lib/pricing";

const pains = [
  {
    icon: FileText,
    title: "Tickets eparpilles",
    text: "Les justificatifs vivent dans les mails, WhatsApp ou au fond d'un sac, et personne ne sait ce qui manque."
  },
  {
    icon: HandCoins,
    title: "Avances floues",
    text: "Un associe paie plus que les autres, puis les remboursements se perdent entre tableurs et promesses."
  },
  {
    icon: PieChart,
    title: "Marge invisible",
    text: "Sans vue projet, impossible de savoir si les depenses servent vraiment le budget ou l'epuisent."
  }
];

const steps = [
  "Creez votre projet et choisissez la devise.",
  "Ajoutez vos associes avec role et couleur de suivi.",
  "Importez les depenses, factures et justificatifs.",
  "Equilibrez les avances avec des KPI clairs par membre."
];

export default function Home() {
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
            <Link href="/dashboard">Demo dashboard</Link>
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
              Suivi financier simple pour associes de TPE
            </span>
            <h1>Vos depenses de projet, enfin lisibles entre associes.</h1>
            <p>
              FrancoFacta centralise les frais, justificatifs et avances de chaque partenaire pour garder une vision
              nette des contributions, remboursements et budgets projet.
            </p>
            <div className="hero-actions">
              <CheckoutButton plan="starter" variant="accent">
                Demarrer avec Starter
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

          <div className="card hero-card" aria-label="Apercu FrancoFacta">
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
                  <span>Total engage</span>
                  <strong>12 840 EUR</strong>
                </div>
                <div>
                  <span>A rembourser</span>
                  <strong>1 260 EUR</strong>
                </div>
              </div>
              <div className="member-row">
                <span className="avatar-dot" style={{ background: "#c94a1a" }} />
                <span>Camille - operations</span>
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
                  <p className="muted">Justificatif ajoute et lie a la depense.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="douleurs">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Ce que FrancoFacta resout</span>
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
            <span className="eyebrow">Comment ca marche</span>
            <h2>Quatre etapes pour passer du flou au pilotage.</h2>
            <p className="muted">
              L&apos;onboarding cree une structure de projet exploitable par les associes, puis le tableau de bord prend le
              relais pour suivre chaque depense.
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
            <h2>Un plan pour chaque rythme d&apos;equipe.</h2>
            <p className="muted">Perso, Starter, Pro ou accompagnement sur mesure selon votre projet.</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <article className={`card price-card ${plan.highlight ? "highlight" : ""}`} key={plan.key}>
                {plan.highlight ? <span className="pill">Recommande</span> : null}
                <h3>{plan.name}</h3>
                <p className="muted">{plan.tagline}</p>
                <div className="price">
                  <span>{plan.priceLabel}</span>
                  {plan.priceSuffix ? <small>{plan.priceSuffix}</small> : null}
                </div>
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
          <h2>Remettez vos associes autour du meme chiffre.</h2>
          <p>
            Lancez FrancoFacta, configurez votre premier projet et invitez les partenaires qui avancent les depenses.
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
