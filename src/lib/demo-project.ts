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
  name: "Rénovation Maison — Noirmoutier",
  type: "Rénovation / Construction",
  currency: "EUR",
  endDate: "2026-10-30",
  totalBudget: 318300,
  members: [
    { name: "Élise", role: "Notaire & juridique", color: "#c94a1a", sharePercentage: 34 },
    { name: "Hugo", role: "Travaux & chantier", color: "#008c8c", sharePercentage: 33 },
    { name: "Marc", role: "Budget & achats", color: "#0f0f0f", sharePercentage: 33 }
  ],
  phases: [
    { id: "acquisition", name: "Acquisition bien", color: "#0f0f0f" },
    { id: "notaire", name: "Frais notariés", color: "#008c8c" },
    { id: "travaux", name: "Travaux rénovation", color: "#c94a1a" },
    { id: "finitions", name: "Finitions", color: "#5b21b6" }
  ],
  expenses: [
    {
      id: "n-e1",
      date: "2026-04-12",
      title: "Acte notarié — acquisition",
      category: "Notaire",
      phaseId: "notaire",
      member: "Élise",
      amount: 31800,
      status: "Payée",
      paymentMethod: "Virement",
      receipt: "acte_notarie.pdf",
      receiptRequired: true
    },
    {
      id: "n-e2",
      date: "2026-04-25",
      title: "Permis de construire",
      category: "Honoraires",
      phaseId: "acquisition",
      member: "Marc",
      amount: 2200,
      status: "Payée",
      paymentMethod: "CB",
      receipt: "permis-construire.pdf",
      receiptRequired: true
    },
    {
      id: "n-e3",
      date: "2026-05-10",
      title: "Démolition cloisons étage",
      category: "Travaux",
      phaseId: "travaux",
      member: "Hugo",
      amount: 4800,
      status: "Payée",
      paymentMethod: "Virement",
      receipt: "facture-demolition.pdf",
      receiptRequired: true
    },
    {
      id: "n-e4",
      date: "2026-05-28",
      title: "Fenêtres double vitrage",
      category: "Matériaux",
      phaseId: "travaux",
      member: "Hugo",
      amount: 6400,
      status: "À rembourser",
      paymentMethod: "Virement",
      receipt: "devis-fenetres.pdf",
      receiptRequired: true
    },
    {
      id: "n-e5",
      date: "2026-06-05",
      title: "Acompte cuisine équipée",
      category: "Ameublement",
      phaseId: "finitions",
      member: "Marc",
      amount: 3200,
      status: "En validation",
      paymentMethod: "CB",
      receiptRequired: true
    }
  ],
  revenues: [
    {
      id: "n-r1",
      date: "2026-08-01",
      object: "Location saisonnière août",
      client: "Famille Morel",
      amount: 4200,
      status: "Encaissé",
      receipt: "location-aout.pdf",
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
    { id: "n-t1", title: "Relancer le notaire pour l'attestation", done: true },
    { id: "n-t2", title: "Envoyer devis plombier à Hugo", done: true },
    { id: "n-t3", title: "Signer compromis assurance habitation", done: false },
    { id: "n-t4", title: "Demander attestation décennale artisan", done: false },
    { id: "n-t5", title: "Programmer visite chantier 15 juillet", done: false }
  ],
  contacts: [
    { name: "Me Philippe Martin", role: "Notaire", phone: "01 42 60 15 30" },
    { name: "Atelier Côte Ouest", role: "Maçonnerie", phone: "02 51 00 00 12" },
    { name: "Claire Bonnet", role: "Architecte", phone: "06 42 18 09 77" }
  ],
  agenda: [
    { date: "2026-07-15", title: "Visite chantier avec architecte" },
    { date: "2026-08-01", title: "Remise des clés locataire août" },
    { date: "2026-09-20", title: "Point travaux finitions" }
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
