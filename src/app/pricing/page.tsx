import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDollarSign } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { CheckoutButton } from "@/components/CheckoutButton";
import { pricingPlans } from "@/lib/pricing";

export default function PricingPage() {
  const persoPlan = pricingPlans.find((plan) => plan.key === "perso");
  const teamPlans = pricingPlans.filter((plan) => plan.key !== "perso");

  return (
    <main>
      <header className="site-header">
        <nav className="container nav">
          <Link href="/" className="brand">
            <BrandLogo />
          </Link>
          <div className="nav-links">
            <Link href="/#fonctionnement">Fonctionnement</Link>
            <Link href="/dashboard-demo">Démo dashboard</Link>
          </div>
          <Link className="button secondary nav-cta" href="/login">
            Connexion
          </Link>
        </nav>
      </header>

      <section className="section pricing-page-section">
        <div className="container">
          <div className="section-heading pricing-heading">
            <span className="eyebrow">
              <CircleDollarSign size={16} />
              Tarifs
            </span>
            <h1>Choisissez votre plan avant de créer votre compte.</h1>
            <p className="muted">
              Le paiement sécurisé Stripe débloque ensuite la création de compte Cashflux et l&apos;onboarding.
            </p>
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
                <CheckoutButton plan="perso" variant="accent">
                  {persoPlan.ctaLabel}
                </CheckoutButton>
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
                  <CheckoutButton plan={plan.key} variant={plan.highlight ? "accent" : "secondary"}>
                    {plan.ctaLabel}
                  </CheckoutButton>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
