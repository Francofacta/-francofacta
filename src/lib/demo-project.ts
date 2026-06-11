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
    { name: "Sophie", role: "Coordination artisans", color: "#008c8c", sharePercentage: 50 },
    { name: "Marc", role: "Budget et achats", color: "#c94a1a", sharePercentage: 50 }
  ],
  phases: [
    { id: "demolition", name: "Démolition", color: "#0f0f0f" },
    { id: "gros-oeuvre", name: "Gros œuvre", color: "#c94a1a" },
    { id: "second-oeuvre", name: "Second œuvre", color: "#008c8c" },
    { id: "finitions", name: "Finitions", color: "#5b21b6" },
    { id: "mobilier", name: "Mobilier", color: "#1d4ed8" }
  ],
  expenses: [
    {
      id: "n-e1",
      date: "2026-04-12",
      title: "Diagnostic amiante avant travaux",
      category: "Honoraires",
      phaseId: "demolition",
      member: "Sophie",
      amount: 840,
      status: "Payée",
      paymentMethod: "Virement",
      receipt: "diagnostic-amiante.pdf",
      receiptRequired: true
    },
    {
      id: "n-e2",
      date: "2026-04-18",
      title: "Benne gravats semaine 1",
      category: "Travaux",
      phaseId: "demolition",
      member: "Marc",
      amount: 1320,
      status: "À rembourser",
      paymentMethod: "CB",
      receipt: "facture-benne-gravats.pdf",
      receiptRequired: true
    },
    {
      id: "n-e3",
      date: "2026-05-03",
      title: "Acompte maçonnerie murs porteurs",
      category: "Travaux",
      phaseId: "gros-oeuvre",
      member: "Marc",
      amount: 18500,
      status: "Payée",
      paymentMethod: "Virement",
      receipt: "acompte-maconnerie.pdf",
      receiptRequired: true
    },
    {
      id: "n-e4",
      date: "2026-05-19",
      title: "Charpente et reprise toiture",
      category: "Travaux",
      phaseId: "gros-oeuvre",
      member: "Sophie",
      amount: 26750,
      status: "En validation",
      paymentMethod: "Virement",
      receipt: "devis-toiture-signe.pdf",
      receiptRequired: true
    },
    {
      id: "n-e5",
      date: "2026-06-02",
      title: "Menuiseries extérieures",
      category: "Matériaux",
      phaseId: "second-oeuvre",
      member: "Marc",
      amount: 12340,
      status: "Payée",
      paymentMethod: "Chèque",
      receipt: "menuiseries-noirmoutier.pdf",
      receiptRequired: true
    },
    {
      id: "n-e6",
      date: "2026-06-11",
      title: "Plan électrique cuisine et séjour",
      category: "Honoraires",
      phaseId: "second-oeuvre",
      member: "Sophie",
      amount: 2360,
      status: "Payée",
      paymentMethod: "CB",
      receiptRequired: true
    },
    {
      id: "n-e7",
      date: "2026-06-24",
      title: "Carrelage pièces d'eau",
      category: "Matériaux",
      phaseId: "finitions",
      member: "Sophie",
      amount: 4180,
      status: "À rembourser",
      paymentMethod: "CB",
      receipt: "carrelage-sdb.pdf",
      receiptRequired: true
    },
    {
      id: "n-e8",
      date: "2026-07-05",
      title: "Canapé convertible chambre amis",
      category: "Mobilier",
      phaseId: "mobilier",
      member: "Marc",
      amount: 1490,
      status: "Payée",
      paymentMethod: "CB",
      receipt: "canape-convertible.pdf",
      receiptRequired: false
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
    { id: "n-t1", title: "Valider la couleur des menuiseries", done: true },
    { id: "n-t2", title: "Relancer le couvreur pour la facture finale", done: false },
    { id: "n-t3", title: "Ajouter les justificatifs du carrelage", done: false }
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
