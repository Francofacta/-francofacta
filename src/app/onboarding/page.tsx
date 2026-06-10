"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";

const projectTypes = ["Commerce", "Restauration", "Service B2B", "Immobilier", "Evenementiel", "Studio creatif"];
const currencies = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dollar US" },
  { code: "GBP", label: "£ Livre sterling" },
  { code: "CHF", label: "CHF Franc suisse" },
  { code: "CAD", label: "CAD Dollar canadien" },
  { code: "MAD", label: "MAD Dirham marocain" }
];
const tabOptions = ["Depenses", "Justificatifs", "Remboursements", "Budget", "Synthese associes", "Exports"];

type Member = {
  id: string;
  name: string;
  role: string;
  color: string;
};

const initialMembers: Member[] = [
  { id: "m1", name: "Camille", role: "Operations", color: "#c94a1a" },
  { id: "m2", name: "Yanis", role: "Finance", color: "#0f0f0f" }
];

export default function OnboardingPage() {
  const [projectName, setProjectName] = useState("Ouverture boutique Lyon");
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [currency, setCurrency] = useState(currencies[0].code);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [tabs, setTabs] = useState<string[]>(["Depenses", "Justificatifs", "Remboursements", "Budget"]);
  const [status, setStatus] = useState("Configurez votre espace commun en moins de deux minutes.");
  const [loading, setLoading] = useState(false);

  const isReady = useMemo(
    () => projectName.trim().length > 1 && members.every((member) => member.name.trim() && member.role.trim()),
    [members, projectName]
  );

  function updateMember(id: string, key: keyof Omit<Member, "id">, value: string) {
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, [key]: value } : member)));
  }

  function addMember() {
    setMembers((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        role: "",
        color: "#7c3aed"
      }
    ]);
  }

  function removeMember(id: string) {
    setMembers((current) => (current.length === 1 ? current : current.filter((member) => member.id !== id)));
  }

  function toggleTab(tab: string) {
    setTabs((current) => (current.includes(tab) ? current.filter((item) => item !== tab) : [...current, tab]));
  }

  async function submitOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReady) {
      setStatus("Ajoutez au moins un projet et completez chaque membre.");
      return;
    }

    const payload = {
      projectName,
      projectType,
      currency,
      tabs,
      members: members.map(({ name, role, color }) => ({ name, role, color }))
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

      setStatus(result.mode === "demo" ? "Mode demo sauvegarde localement. Redirection..." : "Projet cree. Redirection...");
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
          Passer en demo
        </Link>
      </header>

      <section className="container onboarding-grid">
        <aside className="onboarding-copy">
          <span className="eyebrow">
            <Check size={16} />
            Onboarding projet
          </span>
          <h1>Parametrez votre espace associes.</h1>
          <p className="muted">
            FrancoFacta cree les bonnes vues des le depart: membres, onglets, devise et type de projet pour suivre les
            depenses sans tableur.
          </p>
          <div className="setup-summary card">
            <strong>{projectName || "Votre projet"}</strong>
            <span>{projectType}</span>
            <span>{currency}</span>
            <span>{members.length} associes</span>
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
                placeholder="Ex: Lancement showroom Nantes"
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

          <div className="form-field">
            <label htmlFor="currency">Devise</label>
            <select className="select" id="currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {currencies.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <div className="field-row">
              <label>Membres associes</label>
              <button className="small-action" type="button" onClick={addMember}>
                <Plus size={16} />
                Ajouter
              </button>
            </div>
            <div className="members-editor">
              {members.map((member) => (
                <div className="member-editor" key={member.id}>
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
                    placeholder="Role"
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
            <label>Onglets a activer</label>
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
            {loading ? "Creation..." : "Creer mon tableau de bord"}
            <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
