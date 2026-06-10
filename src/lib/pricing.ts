export type PlanKey = "starter" | "pro" | "studio";

export type PricingPlan = {
  key: PlanKey;
  name: string;
  price: number;
  tagline: string;
  highlight?: boolean;
  features: string[];
  priceEnv: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    price: 19,
    tagline: "Pour un projet et une petite equipe associee.",
    highlight: true,
    priceEnv: "STRIPE_STARTER_PRICE_ID",
    features: ["1 projet actif", "Jusqu'a 5 membres", "Pieces jointes Supabase", "Essai gratuit de 14 jours"]
  },
  {
    key: "pro",
    name: "Pro",
    price: 39,
    tagline: "Pour piloter plusieurs projets clients.",
    priceEnv: "STRIPE_PRO_PRICE_ID",
    features: ["5 projets actifs", "Roles personnalises", "Exports CSV mensuels", "Support prioritaire"]
  },
  {
    key: "studio",
    name: "Studio",
    price: 79,
    tagline: "Pour cabinets, studios et collectifs TPE.",
    priceEnv: "STRIPE_STUDIO_PRICE_ID",
    features: ["Projets illimites", "Workspaces multi-entites", "Webhooks comptables", "Accompagnement onboarding"]
  }
];

export function getPriceId(plan: PlanKey) {
  const planConfig = pricingPlans.find((item) => item.key === plan);
  if (!planConfig) {
    return undefined;
  }

  return process.env[planConfig.priceEnv];
}
