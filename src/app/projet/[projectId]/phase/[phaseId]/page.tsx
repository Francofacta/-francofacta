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

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}

export default function PhaseDetailPage() {
  const params = useParams<{ projectId: string; phaseId: string }>();
  const [project, setProject] = useState<StoredProject>(fallbackProject);
  const [expenses, setExpenses] = useState<Expense[]>(noirmoutierDemo.expenses);

  useEffect(() => {
    const stored = localStorage.getItem("francofacta:onboarding");

    if (!stored || params.projectId === noirmoutierDemo.id) {
      return;
    }

    const parsed = JSON.parse(stored) as Partial<StoredProject>;
    const phases = parsed.phases?.length ? parsed.phases : fallbackProject.phases;
    const members = parsed.members?.length ? parsed.members : fallbackProject.members;

    setProject({
      projectName: parsed.projectName ?? fallbackProject.projectName,
      projectType: parsed.projectType ?? fallbackProject.projectType,
      currency: parsed.currency ?? fallbackProject.currency,
      projectId: parsed.projectId ?? "demo",
      members,
      phases
    });
    setExpenses([]);
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

  return (
    <main className="phase-detail-page">
      <section className="container phase-detail-shell">
        <Link href={params.projectId === noirmoutierDemo.id ? "/dashboard-demo#expenses" : "/dashboard#expenses"} className="brand">
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

          <Link className="button accent phase-add-expense" href="/dashboard#expenses">
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
