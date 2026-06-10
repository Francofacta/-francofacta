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
  status: "Payee" | "A rembourser" | "En validation";
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
  tabs: ["Depenses", "Justificatifs", "Remboursements", "Budget"],
  members: [
    { name: "Camille", role: "Operations", color: "#c94a1a" },
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
    status: "Payee",
    receipt: "facture-menuisier.pdf"
  },
  {
    id: "e2",
    date: "2026-06-05",
    title: "Enseigne facade",
    category: "Marketing",
    member: "Yanis",
    amount: 1880,
    status: "A rembourser",
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
    status: "Payee",
    receipt: "stock-lancement.csv"
  }
];

const categories = ["Toutes", "Travaux", "Marketing", "Outils", "Achats", "Transport", "Honoraires"];
const statuses = ["Tous", "Payee", "A rembourser", "En validation"];

export default function DashboardPage() {
  const [project, setProject] = useState<OnboardingState>(defaultProject);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [status, setStatus] = useState("Tous");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Ajoutez une depense avec son justificatif.");

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

  const memberKpis = useMemo(
    () =>
      project.members.map((member) => {
        const memberExpenses = expenses.filter((expense) => expense.member === member.name);
        const total = memberExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const pending = memberExpenses
          .filter((expense) => expense.status === "A rembourser")
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
    .filter((expense) => expense.status === "A rembourser")
    .reduce((sum, expense) => sum + expense.amount, 0);

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
        setUploadStatus(`Justificatif non envoye: ${error.message}`);
      } else {
        receiptName = path;
        setUploadStatus("Justificatif envoye dans Supabase Storage.");
      }
    } else if (file instanceof File && file.name) {
      setUploadStatus("Mode demo: le nom du fichier est conserve localement.");
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
          {project.tabs.map((tab) => (
            <a href="#expenses" key={tab}>
              {tab}
            </a>
          ))}
        </nav>
        <div className="sidebar-card">
          <p className="muted">Plan actif</p>
          <strong>Starter</strong>
          <span>14 jours d&apos;essai inclus</span>
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
            <p className="muted">Vue consolidee des depenses, avances et justificatifs entre associes.</p>
          </div>
          <button className="button accent" type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Ajouter une depense
          </button>
        </header>

        <section className="metric-grid" aria-label="Indicateurs globaux">
          <article className="card metric-card">
            <ReceiptText size={24} />
            <span>Total depenses</span>
            <strong>{formatter.format(totalExpenses)}</strong>
          </article>
          <article className="card metric-card">
            <ArrowDownUp size={24} />
            <span>A rembourser</span>
            <strong>{formatter.format(totalPending)}</strong>
          </article>
          <article className="card metric-card">
            <Users size={24} />
            <span>Associes</span>
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
                <span>{formatter.format(member.pending)} a rembourser</span>
                <span>{member.count} lignes</span>
              </div>
            </article>
          ))}
        </section>

        <section className="card expenses-panel" id="expenses">
          <div className="expenses-toolbar">
            <div>
              <span className="eyebrow">
                <Filter size={16} />
                Depenses
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
                  <th>Depense</th>
                  <th>Associe</th>
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
                      <span className={`status-badge ${expense.status.toLowerCase().replaceAll(" ", "-")}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td>{expense.receipt ? <span className="receipt-name">{expense.receipt}</span> : "A ajouter"}</td>
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
              Nouvelle depense
            </span>
            <h2 id="expense-modal-title">Ajouter une depense</h2>
            <p className="muted">{uploadStatus}</p>
            <form className="modal-form" onSubmit={addExpense}>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="title">Libelle</label>
                  <input className="input" id="title" name="title" required placeholder="Ex: Billets train salon" />
                </div>
                <div className="form-field">
                  <label htmlFor="amount">Montant</label>
                  <input className="input" id="amount" name="amount" min="1" step="0.01" type="number" required />
                </div>
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="member">Associe payeur</label>
                  <select className="select" id="member" name="member">
                    {project.members.map((member) => (
                      <option key={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="category">Categorie</label>
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
                Enregistrer la depense
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
