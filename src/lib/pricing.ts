export type CheckoutPlanKey = "perso" | "starter" | "pro";
export type PlanKey = CheckoutPlanKey | "sur-mesure";

export type PricingPlan = {
  key: PlanKey;
  name: string;
  price: number | null;
  priceLabel: string;
  priceSuffix?: string;
  tagline: string;
  highlight?: boolean;
  features: string[];
  priceEnv?: string;
  checkoutMode?: "payment" | "subscription";
  ctaLabel: string;
  calendlyUrl?: string;
};

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/francofacta/rendez-vous";

export const pricingPlans: PricingPlan[] = [
  {
    key: "perso",
    name: "Perso",
    price: 29,
    priceLabel: "29 EUR",
    priceSuffix: "12 mois d'acces",
    tagline: "Pour les projets personnels: mariage, construction, travaux ou evenements.",
    priceEnv: "STRIPE_PERSO_PRICE_ID",
    checkoutMode: "payment",
    ctaLabel: "Choisir Perso",
    features: [
      "Paiement unique pour 12 mois",
      "Suivi des depenses et justificatifs",
      "Export PDF inclus",
      "Agenda et contacts inclus"
    ]
  },
  {
    key: "starter",
    name: "Starter",
    price: 19,
    priceLabel: "19 EUR",
    priceSuffix: "/mois",
    tagline: "Pour lancer un projet avec une equipe reduite.",
    highlight: true,
    priceEnv: "STRIPE_STARTER_PRICE_ID",
    checkoutMode: "subscription",
    ctaLabel: "Choisir Starter",
    features: [
      "1 projet actif",
      "3 utilisateurs max",
      "Toutes les fonctionnalites de base",
      "Export PDF inclus",
      "Agenda et contacts inclus"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    price: 39,
    priceLabel: "39 EUR",
    priceSuffix: "/mois",
    tagline: "Pour piloter tous vos projets avec une vision de marge.",
    priceEnv: "STRIPE_PRO_PRICE_ID",
    checkoutMode: "subscription",
    ctaLabel: "Choisir Pro",
    features: [
      "Projets et utilisateurs illimites",
      "Module rentabilite inclus",
      "Categories personnalisees",
      "Export PDF inclus",
      "Agenda et contacts inclus"
    ]
  },
  {
    key: "sur-mesure",
    name: "Sur mesure",
    price: null,
    priceLabel: "Sur mesure",
    tagline: "Pour cadrer un deploiement adapte a votre organisation.",
    ctaLabel: "Prendre rendez-vous",
    calendlyUrl,
    features: [
      "Accompagnement au parametrage",
      "Workflow adapte a vos equipes",
      "Export PDF inclus",
      "Agenda et contacts inclus"
    ]
  }
];

export function getPriceId(plan: CheckoutPlanKey) {
  const planConfig = pricingPlans.find((item) => item.key === plan);
  if (!planConfig?.priceEnv) {
    return undefined;
  }

  return process.env[planConfig.priceEnv];
}

export function getCheckoutMode(plan: CheckoutPlanKey) {
  const planConfig = pricingPlans.find((item) => item.key === plan);

  return planConfig?.checkoutMode ?? "subscription";
}
