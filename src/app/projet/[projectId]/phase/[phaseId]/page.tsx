"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Plus, ReceiptText } from "lucide-react";
import { noirmoutierDemo, type Expense, type Member, type Phase } from "@/lib/demo-project";

type StoredProject = {
  projectName: string;
  projectType: string;
  currency: string;
  projectId?: string;
  members: Member[];
  phases: Phase[];
};

const fallbackProject: StoredProject = {
  projectName: noirmoutierDemo.name,
  projectType: noirmoutierDemo.type,
  currency: noirmoutierDemo.currency,
  projectId: noirmoutierDemo.id,
  members: noirmoutierDemo.members,
  phases: noirmoutierDemo.phases
};

const localFallbackProject: StoredProject = {
  projectName: "Ouverture boutique Lyon",
  projectType: "Commerce",
  currency: "EUR",
  projectId: "local",
  members: [
    { name: "Camille", role: "Opérations", color: "#c94a1a", sharePercentage: 40 },
    { name: "Yanis", role: "Finance", color: "#0f0f0f", sharePercentage: 35 },
    { name: "Sofia", role: "Marketing", color: "#2563eb", sharePercentage: 25 }
  ],
  phases: [
    { id: "acquisition-terrain", name: "Acquisition terrain", color: "#0f0f0f" },
    { id: "permis", name: "Permis de construire", color: "#008c8c" },
    { id: "gros-oeuvre", name: "Gros oeuvre", color: "#c94a1a" }
  ]
};

const localFallbackExpenses: Expense[] = [
  {
    id: "e1",
    date: "2026-06-03",
    title: "Acompte artisan menuisier",
    category: "Travaux",
    phaseId: "gros-oeuvre",
    member: "Camille",
    amount: 3420,
    status: "Payée",
    paymentMethod: "Virement",
    receipt: "facture-menuisier.pdf",
    receiptRequired: true
  },
  {
    id: "e2",
    date: "2026-06-05",
    title: "Enseigne façade",
    category: "Marketing",
    phaseId: "permis",
    member: "Yanis",
    amount: 1880,
    status: "À rembourser",
    paymentMethod: "CB",
    receipt: "devis-enseigne.pdf",
    receiptRequired: true
  },
  {
    id: "e3",
    date: "2026-06-08",
    title: "Location terminal paiement",
    category: "Outils",
    phaseId: "permis",
    member: "Sofia",
    amount: 240,
    status: "En validation",
    paymentMethod: "CB",
    receiptRequired: true
  },
  {
    id: "e4",
    date: "2026-06-09",
    title: "Stock lancement",
    category: "Achats",
    phaseId: "acquisition-terrain",
    member: "Yanis",
    amount: 5120,
    status: "Payée",
    paymentMethod: "Chèque",
    receipt: "stock-lancement.csv",
    receiptRequired: false
  }
];

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}

export default function PhaseDetailPage() {
  const params = useParams<{ projectId: string; phaseId: string }>();
  const isDemoProject = params.projectId === noirmoutierDemo.id;
  const [project, setProject] = useState<StoredProject>(() => (isDemoProject ? fallbackProject : localFallbackProject));
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    isDemoProject ? noirmoutierDemo.expenses : localFallbackExpenses
  );

  useEffect(() => {
    if (params.projectId === noirmoutierDemo.id) {
      queueMicrotask(() => {
        setProject(fallbackProject);
        setExpenses(noirmoutierDemo.expenses);
      });
      return;
    }

    const stored = localStorage.getItem("francofacta:onboarding");

    if (!stored) {
      queueMicrotask(() => {
        setProject(localFallbackProject);
        setExpenses(localFallbackExpenses);
      });
      return;
    }

    const parsed = JSON.parse(stored) as Partial<StoredProject>;
    const phases = parsed.phases?.length ? parsed.phases : localFallbackProject.phases;
    const members = parsed.members?.length ? parsed.members : localFallbackProject.members;

    queueMicrotask(() => {
      setProject({
        projectName: parsed.projectName ?? localFallbackProject.projectName,
        projectType: parsed.projectType ?? localFallbackProject.projectType,
        currency: parsed.currency ?? localFallbackProject.currency,
        projectId: parsed.projectId ?? "local",
        members,
        phases
      });
      setExpenses([]);
    });
  }, [params.projectId]);

  const phase = useMemo(
    () => project.phases.find((item) => item.id === params.phaseId) ?? noirmoutierDemo.phases.find((item) => item.id === params.phaseId),
    [params.phaseId, project.phases]
  );

  const phaseExpenses = useMemo(
    () => expenses.filter((expense) => expense.phaseId === params.phaseId),
    [expenses, params.phaseId]
  );

  const phaseTotal = phaseExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const receipts = phaseExpenses.filter((expense) => expense.receipt);
  const backHref = isDemoProject ? "/dashboard-demo#expenses" : "/dashboard#expenses";

  return (
    <main className="phase-detail-page">
      <section className="container phase-detail-shell">
        <Link href={backHref} className="brand">
          <span>F</span>
          FrancoFacta
        </Link>

        <article className="card phase-detail-card">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">
                <ReceiptText size={16} />
                Phase projet
              </span>
              <h1>{phase?.name ?? "Phase introuvable"}</h1>
              <p className="muted">{project.projectName}</p>
            </div>
            <div className="summary-chips">
              <span>Total phase : {formatCurrency(phaseTotal, project.currency)}</span>
              <span>
                {phaseExpenses.length} dépense{phaseExpenses.length > 1 ? "s" : ""}
              </span>
              <span>
                {receipts.length} justificatif{receipts.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <Link className="button accent phase-add-expense" href={backHref}>
            <Plus size={18} />
            + Ajouter une dépense dans cette phase
          </Link>

          <section className="phase-detail-section">
            <h2>Dépenses de la phase</h2>
            {phaseExpenses.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Dépense</th>
                      <th>Payé par</th>
                      <th>Montant</th>
                      <th>Justificatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phaseExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                        <td>
                          <strong>{expense.title}</strong>
                          <p className="muted">{expense.category}</p>
                        </td>
                        <td>{expense.member}</td>
                        <td>{formatCurrency(expense.amount, project.currency)}</td>
                        <td>{expense.receipt ?? "À ajouter"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted phase-empty">Aucune dépense réelle dans cette phase pour le moment.</p>
            )}
          </section>

          <section className="phase-detail-section">
            <h2>Justificatifs attachés</h2>
            {receipts.length > 0 ? (
              <div className="receipt-gallery">
                {receipts.map((expense) => (
                  <article className="receipt-tile uploaded" key={expense.id}>
                    <span className="receipt-icon" />
                    <strong>{expense.title}</strong>
                    <span>
                      <FileText size={16} /> {expense.member}
                    </span>
                    <small>{expense.receipt}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted phase-empty">Aucun justificatif attaché à cette phase.</p>
            )}
          </section>
        </article>
      </section>
    </main>
  );
}
