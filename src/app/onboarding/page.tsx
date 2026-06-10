"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";

const projectTypes = ["Commerce", "Restauration", "Service B2B", "Immobilier", "Événementiel", "Créatif"];
const currencies = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dollar US" },
  { code: "GBP", label: "£ Livre sterling" },
  { code: "CHF", label: "CHF Franc suisse" },
  { code: "CAD", label: "CAD Dollar canadien" },
  { code: "MAD", label: "MAD Dirham marocain" }
];
const tabOptions = [
  "Dépenses",
  "Justificatifs",
  "Solde & Équilibre",
  "Budget",
  "Coffre-fort",
  "Synthèse associés",
  "Exports"
];
const paymentMethodOptions = ["Espèces", "Virement", "Chèque", "CB"];
const activePlan = "pro";

type Member = {
  id: string;
  name: string;
  role: string;
  color: string;
  sharePercentage: number;
};

const initialMembers: Member[] = [
  { id: "m1", name: "Camille", role: "Opérations", color: "#c94a1a", sharePercentage: 50 },
  { id: "m2", name: "Yanis", role: "Finance", color: "#0f0f0f", sharePercentage: 50 }
];

export default function OnboardingPage() {
  const [projectName, setProjectName] = useState("Ouverture boutique Lyon");
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [currency, setCurrency] = useState(currencies[0].code);
  const [endDate, setEndDate] = useState("2026-12-31");
  const [totalBudget, setTotalBudget] = useState(25000);
  const [revenueGeneration, setRevenueGeneration] = useState(true);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [tabs, setTabs] = useState<string[]>([
    "Dépenses",
    "Justificatifs",
    "Solde & Équilibre",
    "Budget",
    "Coffre-fort"
  ]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["Espèces", "Virement", "CB"]);
  const [status, setStatus] = useState("Configurez votre espace commun en moins de deux minutes.");
  const [loading, setLoading] = useState(false);
  const isProPlan = activePlan === "pro";

  const shareTotal = useMemo(
    () => members.reduce((sum, member) => sum + Number(member.sharePercentage || 0), 0),
    [members]
  );

  const isReady = useMemo(
    () =>
      projectName.trim().length > 1 &&
      endDate &&
      totalBudget > 0 &&
      paymentMethods.length > 0 &&
      members.every((member) => member.name.trim() && member.role.trim() && member.sharePercentage >= 0) &&
      Math.abs(shareTotal - 100) < 0.01,
    [endDate, members, paymentMethods.length, projectName, shareTotal, totalBudget]
  );

  function updateMember(id: string, key: keyof Omit<Member, "id">, value: string | number) {
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, [key]: value } : member)));
  }

  function addMember() {
    setMembers((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        role: "",
        color: "#7c3aed",
        sharePercentage: 0
      }
    ]);
  }

  function removeMember(id: string) {
    setMembers((current) => (current.length === 1 ? current : current.filter((member) => member.id !== id)));
  }

  function toggleTab(tab: string) {
    setTabs((current) => (current.includes(tab) ? current.filter((item) => item !== tab) : [...current, tab]));
  }

  function togglePaymentMethod(method: string) {
    setPaymentMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method]
    );
  }

  async function submitOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReady) {
      setStatus("Vérifiez le projet, le budget, les moyens de paiement et les parts : elles doivent totaliser 100 %.");
      return;
    }

    const payload = {
      projectName,
      projectType,
      currency,
      endDate,
      totalBudget,
      revenueGeneration: isProPlan ? revenueGeneration : false,
      paymentMethods,
      tabs,
      members: members.map(({ name, role, color, sharePercentage }) => ({ name, role, color, sharePercentage }))
    };

    localStorage.setItem("francofacta:onboarding", JSON.stringify(payload));
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { saved?: boolean; mode?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Sauvegarde impossible.");
      }

      setStatus(result.mode === "demo" ? "Mode démo sauvegardé localement. Redirection..." : "Projet créé. Redirection...");
      window.location.href = "/dashboard";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="onboarding-page">
      <header className="container onboarding-header">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <Link className="button secondary" href="/dashboard">
          Passer en démo
        </Link>
      </header>

      <section className="container onboarding-grid">
        <aside className="onboarding-copy">
          <span className="eyebrow">
            <Check size={16} />
            Onboarding projet
          </span>
          <h1>Paramétrez votre espace associés.</h1>
          <p className="muted">
            FrancoFacta crée les bonnes vues dès le départ : membres, parts, dates, budget, revenus, moyens de paiement
            et onglets pour suivre les dépenses sans tableur.
          </p>
          <div className="setup-summary card">
            <strong>{projectName || "Votre projet"}</strong>
            <span>{projectType}</span>
            <span>{currency}</span>
            <span>{members.length} associés</span>
            <span>{shareTotal}% répartis</span>
            <span>{paymentMethods.length} moyens de paiement</span>
          </div>
        </aside>

        <form className="card onboarding-form" onSubmit={submitOnboarding}>
          <p className="muted status-text">{status}</p>

          <div className="form-grid-two">
            <div className="form-field">
              <label htmlFor="projectName">Nom du projet</label>
              <input
                className="input"
                id="projectName"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Ex : lancement showroom Nantes"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="projectType">Type</label>
              <select
                className="select"
                id="projectType"
                value={projectType}
                onChange={(event) => setProjectType(event.target.value)}
              >
                {projectTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-two">
            <div className="form-field">
              <label htmlFor="currency">Devise</label>
              <select
                className="select"
                id="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {currencies.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="endDate">Date de fin</label>
              <input
                className="input"
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-two">
            <div className="form-field">
              <label htmlFor="totalBudget">Budget total</label>
              <input
                className="input"
                id="totalBudget"
                min="1"
                step="100"
                type="number"
                value={totalBudget}
                onChange={(event) => setTotalBudget(Number(event.target.value))}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="revenueGeneration">Génération de revenus</label>
              <select
                className="select"
                id="revenueGeneration"
                value={revenueGeneration ? "yes" : "no"}
                onChange={(event) => setRevenueGeneration(event.target.value === "yes")}
                disabled={!isProPlan}
              >
                <option value="yes">Oui — module Pro</option>
                <option value="no">Non</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <div className="field-row">
              <label>Membres associés</label>
              <span className={`share-total ${Math.abs(shareTotal - 100) < 0.01 ? "valid" : "invalid"}`}>
                Total : {shareTotal} %
              </span>
              <button className="small-action" type="button" onClick={addMember}>
                <Plus size={16} />
                Ajouter
              </button>
            </div>
            <div className="members-editor">
              {members.map((member) => (
                <div className="member-editor member-editor-wide" key={member.id}>
                  <input
                    className="input"
                    value={member.name}
                    onChange={(event) => updateMember(member.id, "name", event.target.value)}
                    placeholder="Nom"
                    required
                  />
                  <input
                    className="input"
                    value={member.role}
                    onChange={(event) => updateMember(member.id, "role", event.target.value)}
                    placeholder="Rôle"
                    required
                  />
                  <input
                    className="input"
                    min="0"
                    max="100"
                    step="0.01"
                    type="number"
                    value={member.sharePercentage}
                    onChange={(event) => updateMember(member.id, "sharePercentage", Number(event.target.value))}
                    aria-label={`Part de ${member.name || "membre"}`}
                    required
                  />
                  <input
                    className="color-input"
                    type="color"
                    value={member.color}
                    onChange={(event) => updateMember(member.id, "color", event.target.value)}
                    aria-label={`Couleur de ${member.name || "membre"}`}
                  />
                  <button className="icon-action" type="button" onClick={() => removeMember(member.id)} aria-label="Supprimer">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Moyens de paiement autorisés</label>
            <div className="tabs-selector">
              {paymentMethodOptions.map((method) => (
                <button
                  className={`tab-choice ${paymentMethods.includes(method) ? "active" : ""}`}
                  type="button"
                  key={method}
                  onClick={() => togglePaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Onglets à activer</label>
            <div className="tabs-selector">
              {tabOptions.map((tab) => (
                <button
                  className={`tab-choice ${tabs.includes(tab) ? "active" : ""}`}
                  type="button"
                  key={tab}
                  onClick={() => toggleTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button className="button accent" type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer mon tableau de bord"}
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
