export type PaymentMethod = "Espèces" | "Virement" | "Chèque" | "CB";

export type Member = {
  name: string;
  role: string;
  color: string;
  sharePercentage: number;
};

export type Phase = {
  id: string;
  name: string;
  color: string;
};

export type Expense = {
  id: string;
  date: string;
  title: string;
  category: string;
  phaseId: string;
  member: string;
  amount: number;
  status: "Payée" | "À rembourser" | "En validation";
  paymentMethod: PaymentMethod;
  receipt?: string;
  receiptRequired: boolean;
};

export type Revenue = {
  id: string;
  date: string;
  object: string;
  client: string;
  amount: number;
  status: "Encaissé" | "En attente" | "En retard";
  receipt?: string;
  receiptRequired: boolean;
};

export type ProjectDemoData = {
  id: string;
  name: string;
  type: string;
  currency: string;
  endDate: string;
  totalBudget: number;
  members: Member[];
  phases: Phase[];
  expenses: Expense[];
  revenues: Revenue[];
  tasks: { id: string; title: string; done: boolean }[];
  contacts: { name: string; role: string; phone: string }[];
  agenda: { date: string; title: string }[];
};

export const noirmoutierDemo: ProjectDemoData = {
  id: "renovation-maison-noirmoutier",
  name: "Rénovation Maison de Noirmoutier",
  type: "Rénovation / Construction",
  currency: "EUR",
  endDate: "2026-10-30",
  totalBudget: 125000,
  members: [
    { name: "Sophie", role: "Coordination artisans", color: "#008c8c", sharePercentage: 60 },
    { name: "Marc", role: "Budget et achats", color: "#c94a1a", sharePercentage: 40 }
  ],
  phases: [
    { id: "permis", name: "Permis de construire", color: "#008c8c" },
    { id: "demolition", name: "Démolition", color: "#0f0f0f" },
    { id: "second-oeuvre", name: "Second œuvre", color: "#c94a1a" },
    { id: "finitions", name: "Finitions", color: "#5b21b6" }
  ],
  expenses: [
    {
      id: "n-e1",
      date: "2026-04-12",
      title: "Acompte architecte",
      category: "Honoraires",
      phaseId: "permis",
      member: "Sophie",
      amount: 3200,
      status: "Payée",
      paymentMethod: "Virement",
      receipt: "acompte-architecte.pdf",
      receiptRequired: true
    },
    {
      id: "n-e2",
      date: "2026-04-18",
      title: "Démolition cloisons",
      category: "Travaux",
      phaseId: "demolition",
      member: "Marc",
      amount: 1800,
      status: "À rembourser",
      paymentMethod: "CB",
      receipt: "facture-demolition-cloisons.pdf",
      receiptRequired: true
    },
    {
      id: "n-e3",
      date: "2026-05-03",
      title: "Fenêtres double vitrage",
      category: "Matériaux",
      phaseId: "second-oeuvre",
      member: "Sophie",
      amount: 4400,
      status: "Payée",
      paymentMethod: "Virement",
      receipt: "facture-fenetres-double-vitrage.pdf",
      receiptRequired: true
    }
  ],
  revenues: [
    {
      id: "n-r1",
      date: "2026-08-01",
      object: "Location saisonnière août - acompte",
      client: "Famille Morel",
      amount: 4200,
      status: "Encaissé",
      receipt: "acompte-location-aout.pdf",
      receiptRequired: true
    },
    {
      id: "n-r2",
      date: "2026-09-01",
      object: "Location saisonnière septembre",
      client: "Couple Andersen",
      amount: 2800,
      status: "En attente",
      receiptRequired: true
    }
  ],
  tasks: [
    { id: "n-t1", title: "Valider le planning avec l'architecte", done: true },
    { id: "n-t2", title: "Confirmer la date de pose des fenêtres", done: false },
    { id: "n-t3", title: "Classer les justificatifs de démolition", done: false }
  ],
  contacts: [
    { name: "Atelier Martin", role: "Maçonnerie", phone: "02 51 00 00 12" },
    { name: "Claire Bonnet", role: "Architecte", phone: "06 42 18 09 77" },
    { name: "Menuiserie Côte", role: "Menuiseries", phone: "02 51 00 14 30" }
  ],
  agenda: [
    { date: "2026-07-12", title: "Réunion chantier second œuvre" },
    { date: "2026-08-02", title: "Contrôle finitions avant ameublement" },
    { date: "2026-09-15", title: "Ouverture location week-end test" }
  ]
};

export const ghostExpenses: Expense[] = [
  {
    id: "ghost-1",
    date: "2026-06-15",
    title: "Exemple : acompte artisan",
    category: "Travaux",
    phaseId: "ghost",
    member: "Membre 1",
    amount: 1200,
    status: "Payée",
    paymentMethod: "Virement",
    receipt: "exemple-facture.pdf",
    receiptRequired: true
  },
  {
    id: "ghost-2",
    date: "2026-06-18",
    title: "Exemple : achat matériaux",
    category: "Matériaux",
    phaseId: "ghost",
    member: "Membre 2",
    amount: 480,
    status: "À rembourser",
    paymentMethod: "CB",
    receiptRequired: true
  },
  {
    id: "ghost-3",
    date: "2026-06-21",
    title: "Exemple : frais administratifs",
    category: "Honoraires",
    phaseId: "ghost",
    member: "Membre 1",
    amount: 95,
    status: "En validation",
    paymentMethod: "Virement",
    receiptRequired: false
  }
];
