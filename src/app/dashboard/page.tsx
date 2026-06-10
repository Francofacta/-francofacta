"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  FileUp,
  Filter,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
  Users,
  X
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Member = {
  name: string;
  role: string;
  color: string;
};

type Expense = {
  id: string;
  date: string;
  title: string;
  category: string;
  member: string;
  amount: number;
  status: "Payée" | "À rembourser" | "En validation";
  receipt?: string;
};

type OnboardingState = {
  projectName: string;
  projectType: string;
  currency: string;
  tabs: string[];
  members: Member[];
};

const defaultProject: OnboardingState = {
  projectName: "Ouverture boutique Lyon",
  projectType: "Commerce",
  currency: "EUR",
  tabs: ["Dépenses", "Justificatifs", "Remboursements", "Budget", "Agenda", "Contacts"],
  members: [
    { name: "Camille", role: "Opérations", color: "#c94a1a" },
    { name: "Yanis", role: "Finance", color: "#0f0f0f" },
    { name: "Sofia", role: "Marketing", color: "#2563eb" }
  ]
};

const initialExpenses: Expense[] = [
  {
    id: "e1",
    date: "2026-06-03",
    title: "Acompte artisan menuisier",
    category: "Travaux",
    member: "Camille",
    amount: 3420,
    status: "Payée",
    receipt: "facture-menuisier.pdf"
  },
  {
    id: "e2",
    date: "2026-06-05",
    title: "Enseigne façade",
    category: "Marketing",
    member: "Yanis",
    amount: 1880,
    status: "À rembourser",
    receipt: "devis-enseigne.pdf"
  },
  {
    id: "e3",
    date: "2026-06-08",
    title: "Location terminal paiement",
    category: "Outils",
    member: "Sofia",
    amount: 240,
    status: "En validation"
  },
  {
    id: "e4",
    date: "2026-06-09",
    title: "Stock lancement",
    category: "Achats",
    member: "Yanis",
    amount: 5120,
    status: "Payée",
    receipt: "stock-lancement.csv"
  }
];

const categories = ["Toutes", "Travaux", "Marketing", "Outils", "Achats", "Transport", "Honoraires"];
const statuses = ["Tous", "Payée", "À rembourser", "En validation"];
const activePlan = "pro";

function getDashboardAnchor(tab: string) {
  const normalizedTab = tab.toLowerCase();

  if (normalizedTab.includes("rentabilité")) {
    return "#rentability";
  }

  if (normalizedTab.includes("agenda")) {
    return "#agenda";
  }

  if (normalizedTab.includes("contacts")) {
    return "#contacts";
  }

  return "#expenses";
}

function getStatusClass(status: Expense["status"]) {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(" ", "-");
}

export default function DashboardPage() {
  const [project, setProject] = useState<OnboardingState>(defaultProject);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [revenues, setRevenues] = useState(16800);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [status, setStatus] = useState("Tous");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Ajoutez une dépense avec son justificatif.");
  const isProPlan = activePlan === "pro";

  useEffect(() => {
    const stored = localStorage.getItem("francofacta:onboarding");

    if (stored) {
      const parsed = JSON.parse(stored) as OnboardingState;
      queueMicrotask(() => setProject(parsed));
    }
  }, []);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: project.currency
      }),
    [project.currency]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesQuery = `${expense.title} ${expense.member} ${expense.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesCategory = category === "Toutes" || expense.category === category;
        const matchesStatus = status === "Tous" || expense.status === status;

        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [category, expenses, query, status]
  );

  const sidebarTabs = useMemo(() => {
    const tabs = [...project.tabs, "Agenda", "Contacts"];

    if (isProPlan) {
      tabs.push("Rentabilité");
    }

    return [...new Set(tabs)];
  }, [isProPlan, project.tabs]);

  const memberKpis = useMemo(
    () =>
      project.members.map((member) => {
        const memberExpenses = expenses.filter((expense) => expense.member === member.name);
        const total = memberExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const pending = memberExpenses
          .filter((expense) => expense.status === "À rembourser")
          .reduce((sum, expense) => sum + expense.amount, 0);

        return {
          ...member,
          total,
          pending,
          count: memberExpenses.length
        };
      }),
    [expenses, project.members]
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPending = expenses
    .filter((expense) => expense.status === "À rembourser")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const grossMargin = revenues - totalExpenses;
  const marginRate = revenues > 0 ? (grossMargin / revenues) * 100 : 0;
  const projectedEndMargin = revenues - (totalExpenses + totalPending);
  const percentageFormatter = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1
  });

  async function addExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("receipt");
    let receiptName = file instanceof File && file.name ? file.name : undefined;

    if (file instanceof File && file.name && isSupabaseConfigured()) {
      const supabase = createClient();
      const path = `${project.projectName.toLowerCase().replaceAll(" ", "-")}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("expense-receipts").upload(path, file);

      if (error) {
        setUploadStatus(`Justificatif non envoyé : ${error.message}`);
      } else {
        receiptName = path;
        setUploadStatus("Justificatif envoyé dans Supabase Storage.");
      }
    } else if (file instanceof File && file.name) {
      setUploadStatus("Mode démo : le nom du fichier est conservé localement.");
    }

    const nextExpense: Expense = {
      id: crypto.randomUUID(),
      date: String(formData.get("date")),
      title: String(formData.get("title")),
      category: String(formData.get("category")),
      member: String(formData.get("member")),
      amount: Number(formData.get("amount")),
      status: String(formData.get("status")) as Expense["status"],
      receipt: receiptName
    };

    setExpenses((current) => [nextExpense, ...current]);
    setIsModalOpen(false);
    event.currentTarget.reset();
  }

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <nav className="sidebar-nav">
          {sidebarTabs.map((tab) => (
            <a href={getDashboardAnchor(tab)} key={tab}>
              {tab}
            </a>
          ))}
        </nav>
        <div className="sidebar-card">
          <p className="muted">Plan actif</p>
          <strong>Pro</strong>
          <span>Module rentabilité actif</span>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              <TrendingUp size={16} />
              {project.projectType}
            </span>
            <h1>{project.projectName}</h1>
            <p className="muted">Vue consolidée des dépenses, avances et justificatifs entre associés.</p>
          </div>
          <div className="dashboard-actions">
            <button className="button secondary" type="button" onClick={() => window.print()}>
              <ReceiptText size={18} />
              Exporter PDF
            </button>
            <button className="button accent" type="button" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Ajouter une dépense
            </button>
          </div>
        </header>

        <section className="metric-grid" aria-label="Indicateurs globaux">
          <article className="card metric-card">
            <ReceiptText size={24} />
            <span>Total dépenses</span>
            <strong>{formatter.format(totalExpenses)}</strong>
          </article>
          <article className="card metric-card">
            <ArrowDownUp size={24} />
            <span>À rembourser</span>
            <strong>{formatter.format(totalPending)}</strong>
          </article>
          <article className="card metric-card">
            <Users size={24} />
            <span>Associés</span>
            <strong>{project.members.length}</strong>
          </article>
        </section>

        <section className="member-kpi-grid" aria-label="KPI par membre">
          {memberKpis.map((member) => (
            <article className="card member-kpi" key={member.name}>
              <div className="member-title">
                <span className="avatar-dot" style={{ background: member.color }} />
                <div>
                  <strong>{member.name}</strong>
                  <p className="muted">{member.role}</p>
                </div>
              </div>
              <div className="member-values">
                <span>{formatter.format(member.total)} avances</span>
                <span>{formatter.format(member.pending)} à rembourser</span>
                <span>{member.count} lignes</span>
              </div>
            </article>
          ))}
        </section>

        <section className="member-kpi-grid" aria-label="Modules inclus dans les plans payants">
          <article className="card member-kpi" id="agenda">
            <div className="member-title">
              <span className="avatar-dot" style={{ background: "#c94a1a" }} />
              <div>
                <strong>Agenda projet</strong>
                <p className="muted">Jalons, échéances et relances partagées.</p>
              </div>
            </div>
            <div className="member-values">
              <span>Inclus dans Perso, Starter, Pro et Sur mesure</span>
            </div>
          </article>
          <article className="card member-kpi" id="contacts">
            <div className="member-title">
              <span className="avatar-dot" style={{ background: "#0f0f0f" }} />
              <div>
                <strong>Contacts</strong>
                <p className="muted">Partenaires, fournisseurs et intervenants réunis.</p>
              </div>
            </div>
            <div className="member-values">
              <span>Inclus dans Perso, Starter, Pro et Sur mesure</span>
            </div>
          </article>
          <article className="card member-kpi">
            <div className="member-title">
              <span className="avatar-dot" style={{ background: "#2563eb" }} />
              <div>
                <strong>Export PDF</strong>
                <p className="muted">Synthèse partageable depuis le tableau de bord.</p>
              </div>
            </div>
            <div className="member-values">
              <span>Disponible pour tous les plans payants</span>
            </div>
          </article>
        </section>

        {isProPlan ? (
          <section className="card rentability-panel" id="rentability" aria-label="Module rentabilité Pro">
            <div className="rentability-header">
              <div>
                <span className="eyebrow">
                  <TrendingUp size={16} />
                  Module Pro
                </span>
                <h2>Rentabilité projet</h2>
                <p className="muted">Disponible uniquement avec le plan Pro.</p>
              </div>
              <label className="rentability-input" htmlFor="project-revenues">
                <span>Revenus prévus ou encaissés</span>
                <input
                  className="input"
                  id="project-revenues"
                  min="0"
                  step="100"
                  type="number"
                  value={revenues}
                  onChange={(event) => setRevenues(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="rentability-grid">
              <article className="metric-card rentability-metric">
                <span>Total dépenses</span>
                <strong>{formatter.format(totalExpenses)}</strong>
              </article>
              <article className="metric-card rentability-metric">
                <span>Marge brute</span>
                <strong>{formatter.format(grossMargin)}</strong>
              </article>
              <article className="metric-card rentability-metric">
                <span>Marge %</span>
                <strong>{percentageFormatter.format(marginRate)} %</strong>
              </article>
              <article className="metric-card rentability-metric">
                <span>Projection fin de projet</span>
                <strong>{formatter.format(projectedEndMargin)}</strong>
              </article>
            </div>
            <p className="muted rentability-note">
              Projection calculée avec les dépenses saisies et les avances restantes à rembourser.
            </p>
          </section>
        ) : null}

        <section className="card expenses-panel" id="expenses">
          <div className="expenses-toolbar">
            <div>
              <span className="eyebrow">
                <Filter size={16} />
                Dépenses
              </span>
              <h2>Journal projet</h2>
            </div>
            <div className="filters">
              <label className="search-box">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." />
              </label>
              <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dépense</th>
                  <th>Associé</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Justificatif</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <strong>{expense.title}</strong>
                      <p className="muted">{expense.category}</p>
                    </td>
                    <td>{expense.member}</td>
                    <td>{formatter.format(expense.amount)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td>{expense.receipt ? <span className="receipt-name">{expense.receipt}</span> : "À ajouter"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="card expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
            <button className="modal-close" type="button" onClick={() => setIsModalOpen(false)} aria-label="Fermer">
              <X size={18} />
            </button>
            <span className="eyebrow">
              <FileUp size={16} />
              Nouvelle dépense
            </span>
            <h2 id="expense-modal-title">Ajouter une dépense</h2>
            <p className="muted">{uploadStatus}</p>
            <form className="modal-form" onSubmit={addExpense}>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="title">Libellé</label>
                  <input className="input" id="title" name="title" required placeholder="Ex: Billets train salon" />
                </div>
                <div className="form-field">
                  <label htmlFor="amount">Montant</label>
                  <input className="input" id="amount" name="amount" min="1" step="0.01" type="number" required />
                </div>
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="member">Associé payeur</label>
                  <select className="select" id="member" name="member">
                    {project.members.map((member) => (
                      <option key={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="category">Catégorie</label>
                  <select className="select" id="category" name="category">
                    {categories
                      .filter((item) => item !== "Toutes")
                      .map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="date">Date</label>
                  <input className="input" id="date" name="date" type="date" defaultValue="2026-06-10" required />
                </div>
                <div className="form-field">
                  <label htmlFor="status">Statut</label>
                  <select className="select" id="status" name="status">
                    {statuses
                      .filter((item) => item !== "Tous")
                      .map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="receipt">Justificatif</label>
                <input className="input" id="receipt" name="receipt" type="file" accept="image/*,.pdf,.csv" />
              </div>
              <button className="button accent" type="submit">
                Enregistrer la dépense
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
