export type CheckoutPlanKey = "perso" | "starter" | "pro";
export type PlanKey = CheckoutPlanKey | "sur-mesure";

export type PricingPlan = {
  key: PlanKey;
  name: string;
  price: number | null;
  priceLabel?: string;
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
    priceLabel: "29€",
    priceSuffix: "paiement unique - 12 mois d'accès complet",
    tagline: "Pour un projet ponctuel : mariage, construction, rénovation ou événement.",
    priceEnv: "STRIPE_PERSO_PRICE_ID",
    checkoutMode: "payment",
    ctaLabel: "Choisir Perso",
    features: [
      "Dashboard financier",
      "Suivi des dépenses",
      "Export PDF",
      "Justificatifs",
      "Agenda",
      "Contacts",
      "1 projet",
      "3 utilisateurs"
    ]
  },
  {
    key: "starter",
    name: "Starter",
    price: 19,
    priceLabel: "19 €/mois",
    tagline: "Pour les TPE de 2 à 3 associés.",
    highlight: true,
    priceEnv: "STRIPE_STARTER_PRICE_ID",
    checkoutMode: "subscription",
    ctaLabel: "Choisir Starter",
    features: [
      "Tout le Perso",
      "Abonnement mensuel sans engagement",
      "Paiement requis avant l'onboarding"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    price: 39,
    priceLabel: "39 €/mois",
    tagline: "Pour le multi-projets.",
    priceEnv: "STRIPE_PRO_PRICE_ID",
    checkoutMode: "subscription",
    ctaLabel: "Choisir Pro",
    features: [
      "Tout le Starter",
      "Projets illimités",
      "Utilisateurs illimités",
      "Module rentabilité",
      "Catégories personnalisées"
    ]
  },
  {
    key: "sur-mesure",
    name: "Sur mesure",
    price: null,
    tagline: "Pour cadrer un déploiement adapté à votre organisation.",
    ctaLabel: "Prendre rendez-vous",
    calendlyUrl,
    features: [
      "Accompagnement au paramétrage",
      "Workflow adapté à vos équipes",
      "Rendez-vous de cadrage"
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

export function isCheckoutPlanKey(value: string | null | undefined): value is CheckoutPlanKey {
  return value === "perso" || value === "starter" || value === "pro";
}

export function getPlanKeyForPriceId(priceId: string | null | undefined): CheckoutPlanKey | undefined {
  if (!priceId) {
    return undefined;
  }

  return pricingPlans.find((item) => item.priceEnv && process.env[item.priceEnv] === priceId)?.key as
    | CheckoutPlanKey
    | undefined;
}

export function getCheckoutMode(plan: CheckoutPlanKey) {
  const planConfig = pricingPlans.find((item) => item.key === plan);

  return planConfig?.checkoutMode ?? "subscription";
}
