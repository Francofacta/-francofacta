"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";

type ProjectType = {
  key: string;
  label: string;
  placeholder: string;
};

type Member = {
  id: string;
  firstName: string;
  sharePercentage: number;
  color: string;
};

type Phase = {
  id: string;
  name: string;
  selected: boolean;
};

const projectTypes: ProjectType[] = [
  {
    key: "renovation",
    label: "🏠 Rénovation / Construction",
    placeholder: "Ex : Rénovation Maison de Noirmoutier"
  },
  {
    key: "tpe",
    label: "🏪 Création d'entreprise / TPE",
    placeholder: "Ex : Ouverture boutique Lyon"
  },
  {
    key: "sci",
    label: "🏢 SCI / Immobilier",
    placeholder: "Ex : SCI Famille Rousseau"
  },
  {
    key: "event",
    label: "🎉 Autre événement",
    placeholder: "Ex : Festival quartier Montreuil"
  },
  {
    key: "wedding",
    label: "💍 Mariage / Événement",
    placeholder: "Ex : Mariage Sara et Isaac"
  }
];

const budgetRanges = [
  { label: "moins de 5 000€", value: 5000 },
  { label: "5k-20k", value: 20000 },
  { label: "20k-100k", value: 100000 },
  { label: "+100k", value: 150000 },
  { label: "Je ne sais pas encore", value: 0 }
];

const phaseSuggestionsByType: Record<string, string[]> = {
  renovation: ["Démolition", "Gros œuvre", "Second œuvre", "Finitions", "Mobilier"],
  tpe: ["Juridique", "Local", "Marketing", "Stock", "RH", "Trésorerie"],
  sci: ["Acquisition", "Travaux", "Notaire", "Charges", "Fiscalité"],
  event: ["Lieu", "Traiteur", "Animation", "Communication", "Logistique", "Imprévus"],
  wedding: ["Lieu", "Traiteur", "Animation", "Communication", "Logistique", "Imprévus"]
};

const memberColors = ["#c94a1a", "#0f0f0f", "#008c8c", "#5b21b6", "#1d4ed8"];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPhases(typeKey: string) {
  return (phaseSuggestionsByType[typeKey] ?? phaseSuggestionsByType.renovation).map((name) => ({
    id: slugify(name),
    name,
    selected: true
  }));
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [projectName, setProjectName] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { id: "m1", firstName: "Sophie", sharePercentage: 50, color: memberColors[0] },
    { id: "m2", firstName: "Marc", sharePercentage: 50, color: memberColors[1] }
  ]);
  const [budgetRange, setBudgetRange] = useState(budgetRanges[2]);
  const [phases, setPhases] = useState<Phase[]>(buildPhases(projectTypes[0].key));
  const [customPhaseName, setCustomPhaseName] = useState("");
  const [status, setStatus] = useState("Répondez aux questions une par une, comme dans une conversation.");
  const [loading, setLoading] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | undefined>();
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteStatus, setInviteStatus] = useState("Ajoutez les emails quand vous êtes prêt à inviter l'équipe.");

  const selectedPhases = phases.filter((phase) => phase.selected && phase.name.trim());
  const shareTotal = useMemo(
    () => members.reduce((sum, member) => sum + Number(member.sharePercentage || 0), 0),
    [members]
  );
  const selectedProjectName = projectName.trim();

  function selectProjectType(type: ProjectType) {
    setProjectType(type);
    setPhases(buildPhases(type.key));
  }

  function addMember() {
    setMembers((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        firstName: "",
        sharePercentage: 0,
        color: memberColors[current.length % memberColors.length]
      }
    ]);
  }

  function updateMember(id: string, key: keyof Omit<Member, "id" | "color">, value: string | number) {
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, [key]: value } : member)));
  }

  function removeMember(id: string) {
    setMembers((current) => (current.length === 1 ? current : current.filter((member) => member.id !== id)));
  }

  function togglePhase(id: string) {
    setPhases((current) => current.map((phase) => (phase.id === id ? { ...phase, selected: !phase.selected } : phase)));
  }

  function addCustomPhase() {
    const name = customPhaseName.trim();

    if (!name) {
      return;
    }

    setPhases((current) => [...current, { id: `${slugify(name)}-${current.length + 1}`, name, selected: true }]);
    setCustomPhaseName("");
  }

  function canMoveNext() {
    if (step === 1) {
      return Boolean(projectType);
    }

    if (step === 2) {
      return selectedProjectName.length > 1;
    }

    if (step === 3) {
      return (
        members.every((member) => member.firstName.trim().length > 0 && member.sharePercentage >= 0) &&
        Math.abs(shareTotal - 100) < 0.01
      );
    }

    if (step === 4) {
      return Boolean(budgetRange);
    }

    return selectedPhases.length > 0;
  }

  function nextStep() {
    if (!canMoveNext()) {
      setStatus(
        step === 3
          ? "Les parts des membres doivent totaliser exactement 100 % avant de continuer."
          : "Complétez cette étape avant de continuer."
      );
      return;
    }

    setStatus("Parfait, continuons.");
    setStep((current) => Math.min(current + 1, 6));
  }

  async function createProject() {
    if (!canMoveNext()) {
      setStatus("Sélectionnez au moins une phase avant le récapitulatif.");
      return;
    }

    const payload = {
      projectName: selectedProjectName,
      projectType: projectType.label,
      currency: "EUR",
      endDate: "2026-12-31",
      totalBudget: budgetRange.value,
      budgetRange: budgetRange.label,
      revenueGeneration: false,
      paymentMethods: ["Espèces", "Virement", "Chèque", "CB"],
      tabs: ["Dépenses", "To do", "Justificatifs", "Solde & Équilibre", "Budget", "Coffre-fort", "Agenda", "Contacts"],
      phases: selectedPhases.map((phase, index) => ({
        id: slugify(phase.name) || `phase-${index + 1}`,
        name: phase.name,
        color: memberColors[index % memberColors.length]
      })),
      members: members.map((member) => ({
        name: member.firstName.trim(),
        role: "Membre",
        color: member.color,
        sharePercentage: member.sharePercentage
      }))
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
      const result = (await response.json()) as { saved?: boolean; mode?: string; projectId?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Sauvegarde impossible.");
      }

      const projectId = result.projectId ?? `local-${slugify(selectedProjectName)}`;
      const savedPayload = { ...payload, projectId, invitationPending: true };
      localStorage.setItem("francofacta:onboarding", JSON.stringify(savedPayload));
      setCreatedProjectId(projectId);
      setStatus(result.mode === "demo" ? "Projet préparé en mode démo." : "Projet créé.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  async function sendInvitations() {
    const invitationMembers = members.map((member) => ({
      firstName: member.firstName.trim(),
      email: inviteEmails[member.id]?.trim() ?? ""
    }));

    if (invitationMembers.some((member) => !member.email)) {
      setInviteStatus("Renseignez un email pour chaque membre avant l'envoi.");
      return;
    }

    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectId: createdProjectId,
        members: invitationMembers
      })
    });
    const result = (await response.json()) as { sent?: boolean; mode?: string; error?: string };

    if (!response.ok) {
      setInviteStatus(result.error ?? "Envoi impossible pour le moment.");
      return;
    }

    setInviteStatus(
      result.mode === "demo"
        ? "Mode démo : les invitations sont prêtes, configurez Supabase pour envoyer les emails."
        : "Invitations envoyées avec un lien direct vers le projet."
    );
  }

  return (
    <main className="onboarding-page">
      <header className="container onboarding-header">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <Link className="button secondary" href="/dashboard-demo">
          Voir le dashboard
        </Link>
      </header>

      <section className="container onboarding-grid conversational-onboarding">
        <aside className="onboarding-copy">
          <span className="eyebrow">
            <Check size={16} />
            Onboarding conversationnel
          </span>
          <h1>Créons votre projet à plusieurs.</h1>
          <p className="muted">
            Cinq étapes pour poser le type de projet, le nom, les membres, le budget et les phases avant le récapitulatif.
          </p>
          <div className="setup-summary card">
            <strong>{selectedProjectName || "Votre projet"}</strong>
            <span>{projectType.label}</span>
            <span>{members.length} membre{members.length > 1 ? "s" : ""}</span>
            <span className={Math.abs(shareTotal - 100) < 0.01 ? "positive-balance" : "negative-balance"}>
              {shareTotal}% répartis
            </span>
            <span>{budgetRange.label}</span>
            <span>{selectedPhases.length} phases</span>
          </div>
        </aside>

        <section className="card onboarding-form">
          <div className="conversation-progress" aria-label="Progression onboarding">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <span className={item <= step ? "active" : ""} key={item}>
                {item}
              </span>
            ))}
          </div>
          <p className="muted status-text">{status}</p>

          {step === 1 ? (
            <div className="conversation-step">
              <h2>Quel type de projet lancez-vous ?</h2>
              <div className="type-choice-grid">
                {projectTypes.map((type) => (
                  <button
                    className={`tab-choice ${projectType.key === type.key ? "active" : ""}`}
                    type="button"
                    key={type.key}
                    onClick={() => selectProjectType(type)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="conversation-step">
              <h2>Comment s&apos;appelle le projet ?</h2>
              <input
                className="input"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={projectType.placeholder}
                autoFocus
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="conversation-step">
              <div className="field-row">
                <div>
                  <h2>Qui participe, et à quelle part ?</h2>
                  <p className="muted field-hint">Les emails seront collectés après la création du projet.</p>
                </div>
                <span className={`share-total ${Math.abs(shareTotal - 100) < 0.01 ? "valid" : "invalid"}`}>
                  Total : {shareTotal} %
                </span>
              </div>
              <div className="members-editor">
                {members.map((member) => (
                  <div className="member-editor conversation-member-editor" key={member.id}>
                    <input
                      className="input"
                      value={member.firstName}
                      onChange={(event) => updateMember(member.id, "firstName", event.target.value)}
                      placeholder="Prénom"
                    />
                    <input
                      className="input"
                      min="0"
                      max="100"
                      step="0.01"
                      type="number"
                      value={member.sharePercentage}
                      onChange={(event) => updateMember(member.id, "sharePercentage", Number(event.target.value))}
                      placeholder="Part %"
                    />
                    <button className="icon-action" type="button" onClick={() => removeMember(member.id)} aria-label="Supprimer">
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="small-action" type="button" onClick={addMember}>
                <Plus size={16} />
                Ajouter un membre
              </button>
              {Math.abs(shareTotal - 100) >= 0.01 ? (
                <p className="validation-error">Le total des parts doit être égal à 100 %.</p>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="conversation-step">
              <h2>Quel budget anticipez-vous ?</h2>
              <div className="type-choice-grid">
                {budgetRanges.map((range) => (
                  <button
                    className={`tab-choice ${budgetRange.label === range.label ? "active" : ""}`}
                    type="button"
                    key={range.label}
                    onClick={() => setBudgetRange(range)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="conversation-step">
              <h2>Quelles phases voulez-vous suivre ?</h2>
              <p className="muted field-hint">Sélectionnez, désélectionnez ou ajoutez vos propres phases.</p>
              <div className="tabs-selector phase-choice-list">
                {phases.map((phase) => (
                  <button
                    className={`tab-choice ${phase.selected ? "active" : ""}`}
                    type="button"
                    key={phase.id}
                    onClick={() => togglePhase(phase.id)}
                  >
                    {phase.name}
                  </button>
                ))}
              </div>
              <div className="phase-form">
                <input
                  className="input"
                  value={customPhaseName}
                  onChange={(event) => setCustomPhaseName(event.target.value)}
                  placeholder="Ajouter une phase personnalisée"
                />
                <button className="button secondary" type="button" onClick={addCustomPhase}>
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="conversation-step">
              <h2>Récapitulatif avant création</h2>
              <div className="recap-grid">
                <span>Type : {projectType.label}</span>
                <span>Nom : {selectedProjectName}</span>
                <span>Budget : {budgetRange.label}</span>
                <span>Membres : {members.map((member) => `${member.firstName} ${member.sharePercentage}%`).join(", ")}</span>
                <span>Phases : {selectedPhases.map((phase) => phase.name).join(", ")}</span>
              </div>
              {createdProjectId ? (
                <div className="invite-banner">
                  <h3>Invitez vos membres pour collaborer en temps réel</h3>
                  <p className="muted">{inviteStatus}</p>
                  <div className="invite-fields">
                    {members.map((member) => (
                      <label className="form-field" key={member.id}>
                        <span>{member.firstName || "Membre"}</span>
                        <input
                          className="input"
                          type="email"
                          value={inviteEmails[member.id] ?? ""}
                          onChange={(event) =>
                            setInviteEmails((current) => ({ ...current, [member.id]: event.target.value }))
                          }
                          placeholder={`${member.firstName || "membre"}@email.fr`}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="hero-actions">
                    <button className="button accent" type="button" onClick={() => void sendInvitations()}>
                      Envoyer les invitations
                    </button>
                    <Link className="button secondary" href="/dashboard">
                      Ouvrir le dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <button className="button accent" type="button" disabled={loading} onClick={() => void createProject()}>
                  {loading ? "Création..." : "Créer le projet"}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          ) : null}

          <div className="conversation-actions">
            <button className="button secondary" type="button" disabled={step === 1} onClick={() => setStep((current) => Math.max(current - 1, 1))}>
              Retour
            </button>
            {step < 6 ? (
              <button className="button accent" type="button" onClick={nextStep}>
                Continuer
                <ArrowRight size={18} />
              </button>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
