"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleDollarSign, FileText, HandCoins, PieChart, Users } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
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

const heroScenarios = [
  {
    project: "Ouverture boutique Lyon",
    context: "Camille + Yanis, associés",
    total: "12 840 EUR",
    pending: "1 260 EUR",
    members: [
      { name: "Camille - opérations", amount: "4 200 EUR", color: "#c94a1a" },
      { name: "Yanis - finance", amount: "5 120 EUR", color: "#0f0f0f" }
    ],
    receipt: "Facture enseigne.pdf"
  },
  {
    project: "Rénovation Maison de Noirmoutier",
    context: "Sophie + Marc, couple",
    total: "48 730 EUR",
    pending: "3 480 EUR",
    members: [
      { name: "Sophie - matériaux", amount: "21 600 EUR", color: "#008c8c" },
      { name: "Marc - artisans", amount: "27 130 EUR", color: "#7c2d12" }
    ],
    receipt: "Devis toiture.pdf"
  },
  {
    project: "Mariage Sara et Isaac",
    context: "groupe d'amis",
    total: "18 420 EUR",
    pending: "890 EUR",
    members: [
      { name: "Nora - lieu", amount: "6 200 EUR", color: "#be185d" },
      { name: "Adam - traiteur", amount: "4 950 EUR", color: "#5b21b6" }
    ],
    receipt: "Acompte traiteur.pdf"
  },
  {
    project: "SCI Famille Rousseau",
    context: "3 frères/sœurs, bien immobilier",
    total: "96 300 EUR",
    pending: "7 540 EUR",
    members: [
      { name: "Élise - notaire", amount: "31 800 EUR", color: "#1d4ed8" },
      { name: "Hugo - travaux", amount: "36 400 EUR", color: "#167a4a" }
    ],
    receipt: "Acte notarié.pdf"
  }
];

export default function Home() {
  const persoPlan = pricingPlans.find((plan) => plan.key === "perso");
  const teamPlans = pricingPlans.filter((plan) => plan.key !== "perso");
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveScenarioIndex((current) => (current + 1) % heroScenarios.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

  const activeScenario = heroScenarios[activeScenarioIndex];

  return (
    <main>
      <header className="site-header">
        <nav className="container nav">
          <Link href="/" className="brand">
            <BrandLogo />
          </Link>
          <div className="nav-links">
            <Link href="#fonctionnement">Fonctionnement</Link>
            <Link href="/pricing">Tarifs</Link>
            <Link href="/dashboard-demo">Démo dashboard</Link>
          </div>
          <Link className="button secondary nav-cta" href="/login">
            Connexion
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-audience-badge">Centralisez, tracez et maîtrisez chaque euro de vos projets.</span>
            <h1>Entre potes, époux ou associés — reprenez le contrôle.</h1>
            <p className="hero-subtitle">La rentabilité, si vous le souhaitez.</p>
            <div className="hero-actions">
              <Link className="button accent" href="/pricing">
                Démarrer avec Starter
                <ArrowUpRight size={18} />
              </Link>
              <Link className="button secondary" href="/dashboard-demo">
                Voir le dashboard
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="hero-proof" aria-label="Indicateurs produit">
              <span>Export PDF inclus</span>
              <span>Agenda + contacts</span>
              <span>Paiement sécurisé</span>
            </div>
          </div>

          <div className="card hero-card" aria-label="Aperçu Cashflux">
            <div className="browser-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="mini-dashboard">
              <div className="hero-scenario-card" key={activeScenario.project}>
                <p className="muted">Projet</p>
                <h3>{activeScenario.project}</h3>
                <span>{activeScenario.context}</span>
              </div>
              <div className="mini-kpis">
                <div>
                  <span>Total engagé</span>
                  <strong>{activeScenario.total}</strong>
                </div>
                <div>
                  <span>À rembourser</span>
                  <strong>{activeScenario.pending}</strong>
                </div>
              </div>
              {activeScenario.members.map((member) => (
                <div className="member-row" key={member.name}>
                  <span className="avatar-dot" style={{ background: member.color }} />
                  <span>{member.name}</span>
                  <strong>{member.amount}</strong>
                </div>
              ))}
              <div className="receipt-card">
                <FileText size={20} />
                <div>
                  <strong>{activeScenario.receipt}</strong>
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
            <span className="eyebrow">Ce que Cashflux résout</span>
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
            <article className="card perso-banner" id="pricing-perso">
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
                <Link className="button accent" href="/pricing">
                  {persoPlan.ctaLabel}
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </article>
          ) : null}
          <div className="pricing-grid">
            {teamPlans.map((plan) => (
              <article
                className={`card price-card ${plan.highlight ? "highlight" : ""}`}
                data-team-pricing="true"
                key={plan.key}
              >
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
                  <Link className={`button ${plan.highlight ? "accent" : "secondary"}`} href="/pricing">
                    {plan.ctaLabel}
                    <ArrowUpRight size={18} />
                  </Link>
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
            Lancez Cashflux, configurez votre premier projet et invitez les partenaires qui avancent les dépenses.
          </p>
          <div className="hero-actions">
            <Link className="button accent" href="/pricing">
              Choisir Starter
              <ArrowUpRight size={18} />
            </Link>
            <Link className="button secondary" href="/dashboard-demo">
              Voir le tableau de bord
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
