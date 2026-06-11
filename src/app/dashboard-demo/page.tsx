import Link from "next/link";
import { ArrowDownUp, CalendarDays, CheckSquare, FileText, Lock, Plus, ReceiptText, TrendingUp, Users } from "lucide-react";
import { noirmoutierDemo } from "@/lib/demo-project";

const demoTabs = [
  { label: "Dépenses", href: "#expenses" },
  { label: "To do", href: "#todo" },
  { label: "Justificatifs", href: "#receipts" },
  { label: "Solde & Équilibre", href: "#balance" },
  { label: "Budget", href: "#budget" },
  { label: "Coffre-fort", href: "#vault" },
  { label: "Agenda", href: "#agenda" },
  { label: "Contacts", href: "#contacts" },
  { label: "Revenus", href: "#revenues" },
  { label: "Rentabilité", href: "#rentability" }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: noirmoutierDemo.currency }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function DashboardDemoPage() {
  const totalExpenses = noirmoutierDemo.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pending = noirmoutierDemo.expenses
    .filter((expense) => expense.status === "À rembourser")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const revenueCollected = noirmoutierDemo.revenues
    .filter((revenue) => revenue.status === "Encaissé")
    .reduce((sum, revenue) => sum + revenue.amount, 0);
  const margin = revenueCollected - totalExpenses;

  return (
    <main className="dashboard-page demo-dashboard-page">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <nav className="sidebar-nav">
          {demoTabs.map((tab) => (
            <a href={tab.href} key={tab.href}>
              {tab.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-card">
          <p className="muted">Mode démo</p>
          <strong>Lecture seule</strong>
          <span>Données fictives et réalistes</span>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              <TrendingUp size={16} />
              {noirmoutierDemo.type}
            </span>
            <h1>{noirmoutierDemo.name}</h1>
            <p className="muted">
              Projet de démonstration pré-rempli : dépenses, membres, KPI, justificatifs et phases sont consultables en
              lecture seule.
            </p>
          </div>
          <Link className="button accent" href="/onboarding?mode=demo">
            Commencer mon projet
          </Link>
        </header>

        <section className="metric-grid" aria-label="Indicateurs de démonstration">
          <article className="card metric-card">
            <ReceiptText size={24} />
            <span>Total dépenses</span>
            <strong>{formatCurrency(totalExpenses)}</strong>
          </article>
          <article className="card metric-card">
            <ArrowDownUp size={24} />
            <span>À rembourser</span>
            <strong>{formatCurrency(pending)}</strong>
          </article>
          <article className="card metric-card">
            <Users size={24} />
            <span>Membres</span>
            <strong>{noirmoutierDemo.members.length}</strong>
          </article>
        </section>

        <section className="member-kpi-banner" aria-label="Avances par membre">
          <article className="member-banner-card net-total-card">
            <span>NET TOTAL</span>
            <strong>{formatCurrency(totalExpenses)}</strong>
            <small>Total engagé</small>
          </article>
          {noirmoutierDemo.members.map((member, index) => {
            const memberTotal = noirmoutierDemo.expenses
              .filter((expense) => expense.member === member.name)
              .reduce((sum, expense) => sum + expense.amount, 0);

            return (
              <article
                className="member-banner-card"
                key={member.name}
                style={{ background: index === 0 ? "linear-gradient(135deg, #008c8c 0%, #16b8aa 100%)" : "linear-gradient(135deg, #c94a1a 0%, #f59e0b 100%)" }}
              >
                <span>{member.name.toUpperCase()}</span>
                <strong>{formatCurrency(memberTotal)}</strong>
                <small>{member.role}</small>
              </article>
            );
          })}
          <article className="member-banner-card common-account-card">
            <span>REVENUS</span>
            <strong>{formatCurrency(revenueCollected)}</strong>
            <small>Déjà encaissé</small>
          </article>
        </section>

        <section className="card expenses-panel" id="expenses">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">
                <ReceiptText size={16} />
                Dépenses
              </span>
              <h2>Journal projet</h2>
              <p className="muted">Chaque phase ouvre une vue détaillée avec dépenses et justificatifs.</p>
            </div>
          </div>
          <div className="phase-total-grid">
            {noirmoutierDemo.phases.map((phase) => {
              const expenses = noirmoutierDemo.expenses.filter((expense) => expense.phaseId === phase.id);
              const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

              return (
                <Link className="phase-total-card" href={`/projet/${noirmoutierDemo.id}/phase/${phase.id}`} key={phase.id}>
                  <span className="phase-dot" style={{ background: phase.color }} />
                  <div>
                    <strong>{phase.name}</strong>
                    <span>
                      {formatCurrency(total)} · {expenses.length} dépense{expenses.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="table-wrap demo-readonly">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dépense</th>
                  <th>Phase</th>
                  <th>Payeur</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {noirmoutierDemo.expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td>
                    <td>{expense.title}</td>
                    <td>{noirmoutierDemo.phases.find((phase) => phase.id === expense.phaseId)?.name}</td>
                    <td>{expense.member}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>{expense.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card checklist-panel" id="todo">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">
                <CheckSquare size={16} />
                To do
              </span>
              <h2>Checklist projet</h2>
            </div>
          </div>
          <div className="task-list demo-readonly">
            {noirmoutierDemo.tasks.map((task) => (
              <div className={`task-row ${task.done ? "done" : ""}`} key={task.id}>
                <input type="checkbox" checked={task.done} readOnly />
                <span>{task.title}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card receipts-panel" id="receipts">
          <span className="eyebrow">
            <FileText size={16} />
            Justificatifs
          </span>
          <h2>Reçus attachés</h2>
          <div className="receipt-gallery">
            {noirmoutierDemo.expenses.map((expense) => (
              <article className={`receipt-tile ${expense.receipt ? "uploaded" : "required"}`} key={expense.id}>
                <span className="receipt-icon" />
                <strong>{expense.title}</strong>
                <span>{expense.member}</span>
                <small>{expense.receipt ?? "Justificatif à ajouter"}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="card balance-panel" id="balance">
          <span className="eyebrow">Solde & Équilibre</span>
          <h2>Répartition automatique</h2>
          <div className="balance-grid">
            {noirmoutierDemo.members.map((member) => {
              const total = noirmoutierDemo.expenses
                .filter((expense) => expense.member === member.name)
                .reduce((sum, expense) => sum + expense.amount, 0);
              const expected = totalExpenses * (member.sharePercentage / 100);

              return (
                <article className="balance-card" key={member.name}>
                  <strong>{member.name}</strong>
                  <span>Part : {member.sharePercentage} %</span>
                  <span>A avancé : {formatCurrency(total)}</span>
                  <span>Écart : {formatCurrency(total - expected)}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="card budget-panel" id="budget">
          <span className="eyebrow">Budget</span>
          <h2>Cadre projet</h2>
          <p className="muted">
            Budget total {formatCurrency(noirmoutierDemo.totalBudget)} · échéance {formatDate(noirmoutierDemo.endDate)}.
          </p>
        </section>

        <section className="card vault-panel" id="vault">
          <span className="eyebrow">
            <Lock size={16} />
            Coffre-fort
          </span>
          <h2>Accès partagés</h2>
          <p className="muted demo-readonly">Compte bancaire projet, espace cloud artisans et assurance habitation.</p>
        </section>

        <section className="member-kpi-grid" aria-label="Agenda et contacts">
          <article className="card member-kpi" id="agenda">
            <div className="member-title">
              <CalendarDays size={20} />
              <strong>Agenda</strong>
            </div>
            <div className="member-values">
              {noirmoutierDemo.agenda.map((event) => (
                <span key={event.title}>{formatDate(event.date)} · {event.title}</span>
              ))}
            </div>
          </article>
          <article className="card member-kpi" id="contacts">
            <div className="member-title">
              <Users size={20} />
              <strong>Contacts</strong>
            </div>
            <div className="member-values">
              {noirmoutierDemo.contacts.map((contact) => (
                <span key={contact.name}>{contact.name} · {contact.role}</span>
              ))}
            </div>
          </article>
          <article className="card member-kpi">
            <div className="member-title">
              <Plus size={20} />
              <strong>Actions</strong>
            </div>
            <div className="member-values demo-readonly">
              <span>Les ajouts sont désactivés dans la démo.</span>
            </div>
          </article>
        </section>

        <section className="card revenues-panel" id="revenues">
          <span className="eyebrow">
            <TrendingUp size={16} />
            Revenus
          </span>
          <h2>Revenus attendus</h2>
          <div className="table-wrap demo-readonly">
            <table>
              <tbody>
                {noirmoutierDemo.revenues.map((revenue) => (
                  <tr key={revenue.id}>
                    <td>{formatDate(revenue.date)}</td>
                    <td>{revenue.object}</td>
                    <td>{revenue.client}</td>
                    <td>{formatCurrency(revenue.amount)}</td>
                    <td>{revenue.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card rentability-panel" id="rentability">
          <span className="eyebrow">
            <TrendingUp size={16} />
            Rentabilité
          </span>
          <h2>Simulation rentabilité</h2>
          <div className="rentability-grid">
            <article className="metric-card rentability-metric">
              <span>Revenus encaissés</span>
              <strong>{formatCurrency(revenueCollected)}</strong>
            </article>
            <article className="metric-card rentability-metric">
              <span>Total dépenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </article>
            <article className="metric-card rentability-metric">
              <span>Marge actuelle</span>
              <strong>{formatCurrency(margin)}</strong>
            </article>
          </div>
        </section>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Navigation mobile démo">
        <a href="#expenses">Dépenses</a>
        <a href="#balance">Solde</a>
        <a href="#receipts">Justificatifs</a>
        <a href="#agenda">Agenda</a>
        <a href="#contacts">+ Plus</a>
      </nav>

      <Link className="floating-demo-cta" href="/#tarifs">
        Commencer mon projet
      </Link>
    </main>
  );
}
