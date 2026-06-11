"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  CheckSquare,
  Download,
  FileUp,
  Filter,
  Lock,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ghostExpenses } from "@/lib/demo-project";

type PaymentMethod = "Espèces" | "Virement" | "Chèque" | "CB";
type ReceiptState = "uploaded" | "missing" | "required";

type Member = {
  name: string;
  role: string;
  color: string;
  sharePercentage: number;
};

type Phase = {
  id: string;
  name: string;
  color: string;
};

type Expense = {
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

type Revenue = {
  id: string;
  date: string;
  object: string;
  client: string;
  amount: number;
  status: "Encaissé" | "En attente" | "En retard";
  receipt?: string;
  receiptRequired: boolean;
};

type Credential = {
  id: string;
  serviceName: string;
  login: string;
  password: string;
  url: string;
};

type OnboardingState = {
  projectId?: string;
  projectName: string;
  projectType: string;
  currency: string;
  tabs: string[];
  members: Member[];
  endDate: string;
  totalBudget: number;
  revenueGeneration: boolean;
  paymentMethods: PaymentMethod[];
  phases: Phase[];
};

type PlanTier = "perso" | "starter" | "pro";

type TodoTask = {
  id: string;
  title: string;
  done: boolean;
};

type ReceiptItem = {
  id: string;
  title: string;
  source: "Dépense" | "Revenu";
  owner: string;
  date: string;
  amount: number;
  fileName?: string;
  state: ReceiptState;
};

const paymentMethods: PaymentMethod[] = ["Espèces", "Virement", "Chèque", "CB"];
const defaultTabs = [
  "Dépenses",
  "To do",
  "Justificatifs",
  "Solde & Équilibre",
  "Budget",
  "Coffre-fort",
  "Agenda",
  "Contacts"
];

const defaultPhases: Phase[] = [
  { id: "acquisition-terrain", name: "Acquisition terrain", color: "#0f0f0f" },
  { id: "permis", name: "Permis de construire", color: "#008c8c" },
  { id: "gros-oeuvre", name: "Gros oeuvre", color: "#c94a1a" }
];

const defaultProject: OnboardingState = {
  projectName: "Ouverture boutique Lyon",
  projectType: "Commerce",
  currency: "EUR",
  tabs: defaultTabs,
  endDate: "2026-12-31",
  totalBudget: 25000,
  revenueGeneration: true,
  paymentMethods,
  phases: defaultPhases,
  members: [
    { name: "Camille", role: "Opérations", color: "#c94a1a", sharePercentage: 40 },
    { name: "Yanis", role: "Finance", color: "#0f0f0f", sharePercentage: 35 },
    { name: "Sofia", role: "Marketing", color: "#2563eb", sharePercentage: 25 }
  ]
};

const initialExpenses: Expense[] = [
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

const initialRevenues: Revenue[] = [
  {
    id: "r1",
    date: "2026-06-11",
    object: "Précommandes ouverture",
    client: "Clients particuliers",
    amount: 9800,
    status: "Encaissé",
    receipt: "reçu-precommandes.pdf",
    receiptRequired: true
  },
  {
    id: "r2",
    date: "2026-06-18",
    object: "Commande entreprise",
    client: "Studio Bellecour",
    amount: 7000,
    status: "En attente",
    receiptRequired: true
  },
  {
    id: "r3",
    date: "2026-06-25",
    object: "Avoir fournisseur refacturé",
    client: "Atelier Rhône",
    amount: 1200,
    status: "En retard",
    receiptRequired: false
  }
];

const initialCredentials: Credential[] = [
  {
    id: "c1",
    serviceName: "Compte bancaire projet",
    login: "finance@francofacta.demo",
    password: "••••••••••••",
    url: "https://banque.example"
  },
  {
    id: "c2",
    serviceName: "Drive justificatifs",
    login: "projet-lyon",
    password: "••••••••",
    url: "https://drive.example"
  }
];

const categories = ["Toutes", "Travaux", "Marketing", "Outils", "Achats", "Transport", "Honoraires"];
const statuses = ["Tous", "Payée", "À rembourser", "En validation"];
const revenueStatuses: Revenue["status"][] = ["Encaissé", "En attente", "En retard"];
function getActivePlan(): PlanTier {
  return "starter";
}

const activePlan = getActivePlan();
const proOnlyTabs = ["Revenus", "Rentabilité"];
const memberBannerColors = [
  "linear-gradient(135deg, #008c8c 0%, #16b8aa 100%)",
  "linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)",
  "linear-gradient(135deg, #be185d 0%, #f472b6 100%)",
  "linear-gradient(135deg, #7c2d12 0%, #fb923c 100%)"
];

function getDashboardAnchor(tab: string) {
  const normalizedTab = tab
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedTab.includes("justificatifs")) {
    return "#receipts";
  }

  if (
    normalizedTab.includes("to do") ||
    normalizedTab.includes("to-do") ||
    normalizedTab.includes("todo") ||
    normalizedTab.includes("faire")
  ) {
    return "#todo";
  }

  if (normalizedTab.includes("solde") || normalizedTab.includes("remboursements")) {
    return "#balance";
  }

  if (normalizedTab.includes("coffre")) {
    return "#vault";
  }

  if (normalizedTab.includes("revenus")) {
    return "#revenues";
  }

  if (normalizedTab.includes("rentabilite")) {
    return "#rentability";
  }

  if (normalizedTab.includes("budget")) {
    return "#budget";
  }

  if (normalizedTab.includes("agenda")) {
    return "#agenda";
  }

  if (normalizedTab.includes("contacts")) {
    return "#contacts";
  }

  return "#expenses";
}

function getStatusClass(status: Expense["status"] | Revenue["status"]) {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(" ", "-");
}

function normalizeTabs(tabs: string[]) {
  const renamedTabs = tabs.map((tab) => (tab === "Remboursements" ? "Solde & Équilibre" : tab));

  return [...new Set([...renamedTabs, ...defaultTabs])];
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizePhases(phases?: Partial<Phase>[]) {
  const safePhases =
    phases
      ?.map((phase, index) => {
        const name = phase.name?.trim();

        if (!name) {
          return undefined;
        }

        return {
          id: phase.id?.trim() || slugify(name) || `phase-${index + 1}`,
          name,
          color: phase.color || defaultPhases[index % defaultPhases.length]?.color || "#0f0f0f"
        };
      })
      .filter((phase): phase is Phase => Boolean(phase)) ?? [];

  return safePhases.length > 0 ? safePhases : defaultPhases;
}

function normalizeProject(project: Partial<OnboardingState>): OnboardingState {
  return {
    ...defaultProject,
    ...project,
    tabs: normalizeTabs(project.tabs ?? defaultProject.tabs),
    paymentMethods: project.paymentMethods?.length ? project.paymentMethods : defaultProject.paymentMethods,
    phases: normalizePhases(project.phases),
    members: (project.members?.length ? project.members : defaultProject.members).map((member, index, members) => ({
      ...member,
      sharePercentage:
        typeof member.sharePercentage === "number"
          ? member.sharePercentage
          : Math.round((100 / Math.max(members.length, 1)) * 100) / 100
    }))
  };
}

function getReceiptState(item: { receipt?: string; receiptRequired: boolean }): ReceiptState {
  if (item.receipt) {
    return "uploaded";
  }

  return item.receiptRequired ? "required" : "missing";
}

function downloadBlob(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [project, setProject] = useState<OnboardingState>(defaultProject);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [revenues, setRevenues] = useState<Revenue[]>(initialRevenues);
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [status, setStatus] = useState("Tous");
  const [selectedMemberName, setSelectedMemberName] = useState(defaultProject.members[0].name);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Ajoutez une dépense avec son justificatif.");
  const [newPhaseName, setNewPhaseName] = useState("");
  const [collapsedPhaseIds, setCollapsedPhaseIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const isProPlan = activePlan === "pro";

  useEffect(() => {
    const stored = localStorage.getItem("francofacta:onboarding");

    if (stored) {
      const parsed = JSON.parse(stored) as Partial<OnboardingState>;
      const normalizedProject = normalizeProject(parsed);
      queueMicrotask(() => {
        setProject(normalizedProject);
        setSelectedMemberName(normalizedProject.members[0]?.name ?? defaultProject.members[0].name);
        setExpenses([]);
        setRevenues([]);
      });
    }
  }, []);

  useEffect(() => {
    const storageKey = `francofacta:tasks:${project.projectId ?? slugify(project.projectName)}`;
    const storedTasks = localStorage.getItem(storageKey);

    if (storedTasks) {
      setTasks(JSON.parse(storedTasks) as TodoTask[]);
    }

    if (!project.projectId || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    supabase
      .from("project_tasks")
      .select("id,title,done")
      .eq("project_id", project.projectId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setTasks(data as TodoTask[]);
        }
      });
  }, [project.projectId, project.projectName]);

  useEffect(() => {
    const storageKey = `francofacta:tasks:${project.projectId ?? slugify(project.projectName)}`;
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [project.projectId, project.projectName, tasks]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: project.currency
      }),
    [project.currency]
  );

  const percentageFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 1
      }),
    []
  );

  const phaseNameById = useMemo(
    () => new Map(project.phases.map((phase) => [phase.id, phase.name])),
    [project.phases]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const phaseName = phaseNameById.get(expense.phaseId) ?? "Sans phase";
        const matchesQuery = `${expense.title} ${expense.member} ${expense.category} ${phaseName} ${expense.paymentMethod}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesCategory = category === "Toutes" || expense.category === category;
        const matchesStatus = status === "Tous" || expense.status === status;

        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [category, expenses, phaseNameById, query, status]
  );

  const sidebarTabs = useMemo(() => {
    const tabs = normalizeTabs(project.tabs);
    tabs.push("Revenus", "Rentabilité");

    return [...new Set(tabs)];
  }, [project.tabs]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const totalPending = useMemo(
    () => expenses.filter((expense) => expense.status === "À rembourser").reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );
  const revenueCollected = useMemo(
    () => revenues.filter((revenue) => revenue.status === "Encaissé").reduce((sum, revenue) => sum + revenue.amount, 0),
    [revenues]
  );
  const revenuePending = useMemo(
    () =>
      revenues
        .filter((revenue) => revenue.status === "En attente" || revenue.status === "En retard")
        .reduce((sum, revenue) => sum + revenue.amount, 0),
    [revenues]
  );
  const currentMargin = revenueCollected - totalExpenses;
  const currentMarginRate = revenueCollected > 0 ? (currentMargin / revenueCollected) * 100 : 0;
  const projectedMargin = revenueCollected + revenuePending - totalExpenses;
  const budgetRemaining = project.totalBudget - totalExpenses;
  const commonAccountTotal = revenueCollected;
  const hasNoExpenses = expenses.length === 0;

  const phaseSummaries = useMemo(
    () =>
      project.phases.map((phase) => {
        const phaseExpenses = expenses.filter((expense) => expense.phaseId === phase.id);
        const total = phaseExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        return {
          ...phase,
          total,
          count: phaseExpenses.length
        };
      }),
    [expenses, project.phases]
  );

  const filteredExpensesByPhase = useMemo(() => {
    const knownPhaseIds = new Set(project.phases.map((phase) => phase.id));
    const grouped = project.phases.map((phase) => {
      const phaseExpenses = filteredExpenses.filter((expense) => expense.phaseId === phase.id);

      return {
        ...phase,
        total: phaseExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        expenses: phaseExpenses
      };
    });
    const unassignedExpenses = filteredExpenses.filter((expense) => !knownPhaseIds.has(expense.phaseId));

    if (unassignedExpenses.length > 0) {
      grouped.push({
        id: "sans-phase",
        name: "Sans phase",
        color: "#6f6a64",
        total: unassignedExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        expenses: unassignedExpenses
      });
    }

    return grouped;
  }, [filteredExpenses, project.phases]);

  const visiblePhaseSummaries = hasNoExpenses ? phaseSummaries.slice(0, 1) : phaseSummaries;
  const visibleExpensesByPhase = hasNoExpenses ? filteredExpensesByPhase.slice(0, 1) : filteredExpensesByPhase;

  const memberKpis = useMemo(
    () =>
      project.members.map((member) => {
        const memberExpenses = expenses.filter((expense) => expense.member === member.name);
        const total = memberExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const expectedAdvance = totalExpenses * (member.sharePercentage / 100);
        const balance = total - expectedAdvance;

        return {
          ...member,
          total,
          expectedAdvance,
          balance,
          owed: Math.max(balance, 0),
          toPay: Math.max(-balance, 0),
          count: memberExpenses.length,
          transactions: memberExpenses
        };
      }),
    [expenses, project.members, totalExpenses]
  );

  const selectedMember = memberKpis.find((member) => member.name === selectedMemberName) ?? memberKpis[0];

  const settlements = useMemo(() => {
    const creditors = memberKpis
      .filter((member) => member.balance > 0.01)
      .map((member) => ({ name: member.name, amount: member.balance }));
    const debtors = memberKpis
      .filter((member) => member.balance < -0.01)
      .map((member) => ({ name: member.name, amount: -member.balance }));
    const transfers: { from: string; to: string; amount: number }[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtors[debtorIndex] && creditors[creditorIndex]) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.amount, creditor.amount);

      transfers.push({ from: debtor.name, to: creditor.name, amount });
      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount <= 0.01) {
        debtorIndex += 1;
      }

      if (creditor.amount <= 0.01) {
        creditorIndex += 1;
      }
    }

    return transfers;
  }, [memberKpis]);

  const receiptItems = useMemo<ReceiptItem[]>(
    () => [
      ...expenses.map((expense) => ({
        id: expense.id,
        title: expense.title,
        source: "Dépense" as const,
        owner: expense.member,
        date: expense.date,
        amount: expense.amount,
        fileName: expense.receipt,
        state: getReceiptState(expense)
      })),
      ...revenues.map((revenue) => ({
        id: revenue.id,
        title: revenue.object,
        source: "Revenu" as const,
        owner: revenue.client,
        date: revenue.date,
        amount: revenue.amount,
        fileName: revenue.receipt,
        state: getReceiptState(revenue)
      }))
    ],
    [expenses, revenues]
  );

  function addPhase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newPhaseName.trim();

    if (!name) {
      return;
    }

    const idBase = slugify(name) || `phase-${project.phases.length + 1}`;
    const existingIds = new Set(project.phases.map((phase) => phase.id));
    let id = idBase;
    let suffix = 2;

    while (existingIds.has(id)) {
      id = `${idBase}-${suffix}`;
      suffix += 1;
    }

    const color = defaultPhases[project.phases.length % defaultPhases.length]?.color ?? "#0f0f0f";
    setProject((current) => ({
      ...current,
      phases: [...current.phases, { id, name, color }]
    }));
    setCollapsedPhaseIds((current) => current.filter((phaseId) => phaseId !== id));
    setNewPhaseName("");
  }

  function togglePhaseCollapsed(phaseId: string) {
    setCollapsedPhaseIds((current) =>
      current.includes(phaseId) ? current.filter((item) => item !== phaseId) : [...current, phaseId]
    );
  }

  function updateExpensePaymentMethod(id: string, paymentMethod: PaymentMethod) {
    setExpenses((current) => current.map((expense) => (expense.id === id ? { ...expense, paymentMethod } : expense)));
  }

  function exportExpensesToExcel() {
    const headers = [
      "Date",
      "Dépense",
      "Phase",
      "Catégorie",
      "Associé",
      "Montant",
      "Statut",
      "Mode de paiement",
      "Justificatif"
    ];
    const rows = expenses.map((expense) => [
      expense.date,
      expense.title,
      phaseNameById.get(expense.phaseId) ?? "Sans phase",
      expense.category,
      expense.member,
      String(expense.amount),
      expense.status,
      expense.paymentMethod,
      expense.receipt ?? "Manquant"
    ]);
    const content = [headers, ...rows].map((row) => row.join("\t")).join("\n");

    downloadBlob("francofacta-depenses.xls", content, "application/vnd.ms-excel;charset=utf-8");
  }

  function downloadReceiptBundle(format: "zip" | "pdf") {
    const lines = receiptItems.map(
      (item) =>
        `${item.source} | ${item.title} | ${item.owner} | ${item.fileName ?? "Justificatif manquant"} | ${item.state}`
    );
    const fileName = format === "zip" ? "francofacta-justificatifs.zip" : "francofacta-justificatifs.pdf";
    const type = format === "zip" ? "application/zip" : "application/pdf";

    downloadBlob(fileName, lines.join("\n"), type);
  }

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
      phaseId: String(formData.get("phaseId")),
      member: String(formData.get("member")),
      amount: Number(formData.get("amount")),
      status: String(formData.get("status")) as Expense["status"],
      paymentMethod: String(formData.get("paymentMethod")) as PaymentMethod,
      receipt: receiptName,
      receiptRequired: formData.get("receiptRequired") === "on"
    };

    setExpenses((current) => [nextExpense, ...current]);
    setIsExpenseModalOpen(false);
    event.currentTarget.reset();
  }

  function addRevenue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("revenueReceipt");
    const receiptName = file instanceof File && file.name ? file.name : undefined;

    setRevenues((current) => [
      {
        id: crypto.randomUUID(),
        date: String(formData.get("revenueDate")),
        object: String(formData.get("revenueObject")),
        client: String(formData.get("client")),
        amount: Number(formData.get("revenueAmount")),
        status: String(formData.get("revenueStatus")) as Revenue["status"],
        receipt: receiptName,
        receiptRequired: formData.get("revenueReceiptRequired") === "on"
      },
      ...current
    ]);
    event.currentTarget.reset();
  }

  function addCredential(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setCredentials((current) => [
      {
        id: crypto.randomUUID(),
        serviceName: String(formData.get("serviceName")),
        login: String(formData.get("login")),
        password: String(formData.get("password")),
        url: String(formData.get("url"))
      },
      ...current
    ]);
    event.currentTarget.reset();
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();

    if (!title) {
      return;
    }

    const task: TodoTask = {
      id: crypto.randomUUID(),
      title,
      done: false
    };

    setTasks((current) => [...current, task]);
    setNewTaskTitle("");

    if (project.projectId && isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("project_tasks").insert({
        id: task.id,
        project_id: project.projectId,
        title: task.title,
        done: task.done
      });
    }
  }

  async function toggleTask(taskId: string) {
    let nextDone = false;
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        nextDone = !task.done;
        return { ...task, done: nextDone };
      })
    );

    if (project.projectId && isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("project_tasks").update({ done: nextDone }).eq("id", taskId);
    }
  }

  async function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));

    if (project.projectId && isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("project_tasks").delete().eq("id", taskId);
    }
  }

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span>F</span>
          FrancoFacta
        </Link>
        <nav className="sidebar-nav">
          {sidebarTabs.map((tab) => {
            const label = tab === "Remboursements" ? "Solde & Équilibre" : tab;
            const isLockedProTab = !isProPlan && proOnlyTabs.includes(label);

            if (isLockedProTab) {
              return (
                <span
                  className="sidebar-locked"
                  key={tab}
                  tabIndex={0}
                  title="Disponible avec le plan Pro — passer à Pro"
                >
                  <span>{label}</span>
                  <Lock size={14} />
                  <em>Pro</em>
                </span>
              );
            }

            return (
              <a href={getDashboardAnchor(tab)} key={tab}>
                {label}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-card">
          <p className="muted">Plan actif</p>
          <strong>{activePlan === "perso" ? "Perso" : activePlan === "starter" ? "Starter" : "Pro"}</strong>
          <span>
            {isProPlan
              ? "Modules revenus et rentabilité actifs"
              : "Revenus et rentabilité disponibles avec le plan Pro"}
          </span>
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
            <p className="muted">
              Vue consolidée des dépenses, avances, justificatifs, soldes et revenus entre associés.
            </p>
          </div>
          <div className="dashboard-actions">
            <button className="button secondary" type="button" onClick={() => window.print()}>
              <ReceiptText size={18} />
              Exporter PDF
            </button>
            <button className="button accent" type="button" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus size={18} />
              Ajouter une dépense
            </button>
          </div>
        </header>

        {hasNoExpenses ? (
          <section className="card empty-dashboard-state" aria-label="Tableau de bord vide">
            <span>Votre projet est prêt.</span>
            <h2>Aucune dépense réelle pour le moment</h2>
            <p className="muted">
              Les lignes grisées ci-dessous sont des exemples pour vous montrer le rendu du journal. Vos KPI restent à 0€
              jusqu'à la première saisie.
            </p>
            <button className="button accent" type="button" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus size={18} />
              Ajouter ma première dépense
            </button>
          </section>
        ) : null}

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

        <section className="member-kpi-banner" aria-label="Bannière KPI des avances">
          <article className="member-banner-card net-total-card" aria-label="Net total avancé">
            <span>NET TOTAL</span>
            <strong>{formatter.format(totalExpenses)}</strong>
            <small>Total avancé</small>
          </article>
          {memberKpis.slice(0, 2).map((member, index) => (
            <button
              className={`member-banner-card member-banner-button ${
                selectedMemberName === member.name ? "active" : ""
              }`}
              key={member.name}
              type="button"
              style={{ background: memberBannerColors[index % memberBannerColors.length] }}
              onClick={() => setSelectedMemberName(member.name)}
              aria-pressed={selectedMemberName === member.name}
            >
              <span>{member.name.toUpperCase()}</span>
              <strong>{formatter.format(member.total)}</strong>
              <small>Total avancé · {member.count} transactions</small>
            </button>
          ))}
          <article className="member-banner-card common-account-card" aria-label="Compte commun">
            <span>COMPTE COMMUN</span>
            <strong>{formatter.format(commonAccountTotal)}</strong>
            <small>Encaissements reçus</small>
          </article>
          <article className="member-banner-card reimbursements-card" aria-label="Remboursements à traiter">
            <span>REMBOURSEMENTS</span>
            <strong>{formatter.format(totalPending)}</strong>
            <small>À rembourser</small>
          </article>
          {memberKpis.slice(2).map((member, index) => (
            <button
              className={`member-banner-card member-banner-button ${
                selectedMemberName === member.name ? "active" : ""
              }`}
              key={member.name}
              type="button"
              style={{ background: memberBannerColors[(index + 2) % memberBannerColors.length] }}
              onClick={() => setSelectedMemberName(member.name)}
              aria-pressed={selectedMemberName === member.name}
            >
              <span>{member.name.toUpperCase()}</span>
              <strong>{formatter.format(member.total)}</strong>
              <small>Total avancé · {member.count} transactions</small>
            </button>
          ))}
        </section>

        {selectedMember ? (
          <section className="card member-detail-panel" aria-label={`Synthèse personnelle de ${selectedMember.name}`}>
            <div className="panel-heading-row">
              <div>
                <span className="eyebrow">Vue membre</span>
                <h2>{selectedMember.name}</h2>
                <p className="muted">
                  Ses transactions uniquement, avec total avancé et solde calculé selon sa part de{" "}
                  {percentageFormatter.format(selectedMember.sharePercentage)} %.
                </p>
              </div>
              <div className="summary-chips">
                <span>Total avancé : {formatter.format(selectedMember.total)}</span>
                <span>Part attendue : {percentageFormatter.format(selectedMember.sharePercentage)} %</span>
                <span>Reste à avancer : {formatter.format(Math.max(selectedMember.expectedAdvance - selectedMember.total, 0))}</span>
              </div>
            </div>
            <div className="member-detail-stats">
              <article>
                <span>Total avancé</span>
                <strong>{formatter.format(selectedMember.total)}</strong>
              </article>
              <article>
                <span>Part attendue</span>
                <strong>{percentageFormatter.format(selectedMember.sharePercentage)} %</strong>
                <small>{formatter.format(selectedMember.expectedAdvance)}</small>
              </article>
              <article>
                <span>Reste à avancer</span>
                <strong>{formatter.format(Math.max(selectedMember.expectedAdvance - selectedMember.total, 0))}</strong>
              </article>
              <article>
                <span>Solde</span>
                <strong className={selectedMember.balance >= 0 ? "positive-balance" : "negative-balance"}>
                  {selectedMember.balance >= 0
                    ? `${formatter.format(selectedMember.balance)} à recevoir`
                    : `${formatter.format(Math.abs(selectedMember.balance))} à payer`}
                </strong>
              </article>
            </div>
            <div className="compact-list">
              {selectedMember.transactions.length > 0 ? (
                selectedMember.transactions.map((expense) => {
                  const receiptState = getReceiptState(expense);

                  return (
                    <div className="compact-row member-transaction-row" key={expense.id}>
                      <span>{new Date(expense.date).toLocaleDateString("fr-FR")}</span>
                      <div>
                        <strong>{expense.title}</strong>
                        <p className="muted">
                          {phaseNameById.get(expense.phaseId) ?? "Sans phase"} · {expense.category} ·{" "}
                          {expense.paymentMethod}
                        </p>
                      </div>
                      <span className={`transaction-receipt ${receiptState}`}>
                        {expense.receipt ? <ReceiptText size={16} /> : <FileUp size={16} />}
                        {expense.receipt ?? (expense.receiptRequired ? "Justificatif requis" : "Justificatif manquant")}
                      </span>
                      <strong>{formatter.format(expense.amount)}</strong>
                    </div>
                  );
                })
              ) : (
                <p className="muted">Aucune transaction avancée par ce membre pour le moment.</p>
              )}
            </div>
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
              <button className="button secondary export-button" type="button" onClick={exportExpensesToExcel}>
                <Download size={18} />
                Export Excel
              </button>
            </div>
          </div>

          <div className="phase-manager">
            <div className="phase-total-grid" aria-label="Totaux par phase">
              {visiblePhaseSummaries.map((phase) => (
                <Link className="phase-total-card" href={`/projet/${project.projectId ?? "local"}/phase/${phase.id}`} key={phase.id}>
                  <span className="phase-dot" style={{ background: phase.color }} />
                  <div>
                    <strong>{phase.name}</strong>
                    <span>
                      {formatter.format(phase.total)} · {phase.count} dépense{phase.count > 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <form className="phase-form" onSubmit={addPhase}>
              <input
                className="input"
                value={newPhaseName}
                onChange={(event) => setNewPhaseName(event.target.value)}
                placeholder="Créer une phase : acquisition terrain, permis, gros oeuvre..."
                aria-label="Nom de la nouvelle phase"
              />
              <button className="button secondary" type="submit">
                <Plus size={18} />
                Ajouter une phase
              </button>
            </form>
          </div>

          <div className="phase-sections">
            {visibleExpensesByPhase.map((phase) => {
              const isCollapsed = collapsedPhaseIds.includes(phase.id);

              return (
                <section className="phase-section" key={phase.id}>
                  <button
                    className="phase-header"
                    type="button"
                    onClick={() => togglePhaseCollapsed(phase.id)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className="phase-dot" style={{ background: phase.color }} />
                    <span>{phase.name}</span>
                    <strong>{formatter.format(phase.total)}</strong>
                    <small>
                      {phase.expenses.length} dépense{phase.expenses.length > 1 ? "s" : ""}
                    </small>
                    <span className="phase-toggle">{isCollapsed ? "Ouvrir" : "Réduire"}</span>
                  </button>
                  {!isCollapsed ? (
                    phase.expenses.length > 0 ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Dépense</th>
                              <th>Associé</th>
                              <th>Montant</th>
                              <th>Mode de paiement</th>
                              <th>Statut</th>
                              <th>Justificatif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phase.expenses.map((expense) => (
                              <tr key={expense.id}>
                                <td>{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                                <td>
                                  <strong>{expense.title}</strong>
                                  <p className="muted">{expense.category}</p>
                                </td>
                                <td>{expense.member}</td>
                                <td>{formatter.format(expense.amount)}</td>
                                <td>
                                  <select
                                    className="select table-select"
                                    value={expense.paymentMethod}
                                    onChange={(event) =>
                                      updateExpensePaymentMethod(expense.id, event.target.value as PaymentMethod)
                                    }
                                  >
                                    {project.paymentMethods.map((method) => (
                                      <option key={method}>{method}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <span className={`status-badge ${getStatusClass(expense.status)}`}>
                                    {expense.status}
                                  </span>
                                </td>
                                <td>
                                  {expense.receipt ? <span className="receipt-name">{expense.receipt}</span> : "À ajouter"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : hasNoExpenses ? (
                      <div className="table-wrap ghost-expense-table" aria-label="Exemples de dépenses">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Dépense</th>
                              <th>Associé</th>
                              <th>Montant</th>
                              <th>Mode de paiement</th>
                              <th>Statut</th>
                              <th>Justificatif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ghostExpenses.map((expense) => (
                              <tr className="ghost-row" key={expense.id}>
                                <td>{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                                <td>
                                  <strong>{expense.title}</strong>
                                  <p className="muted">{expense.category}</p>
                                </td>
                                <td>{expense.member}</td>
                                <td>{formatter.format(0)}</td>
                                <td>{expense.paymentMethod}</td>
                                <td>{expense.status}</td>
                                <td>{expense.receipt ?? "Exemple sans fichier"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="muted phase-empty">Aucune dépense dans cette phase avec les filtres actuels.</p>
                    )
                  ) : null}
                </section>
              );
            })}
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
              <p className="muted">Disponible sur tous les plans. Les tâches sont sauvegardées avec le projet.</p>
            </div>
          </div>
          <form className="task-form" onSubmit={addTask}>
            <input
              className="input"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Ajouter une tâche : relancer un artisan, déposer un justificatif..."
              aria-label="Nouvelle tâche"
            />
            <button className="button accent" type="submit">
              <Plus size={18} />
              Ajouter
            </button>
          </form>
          <div className="task-list">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div className={`task-row ${task.done ? "done" : ""}`} key={task.id}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => void toggleTask(task.id)} />
                    <span>{task.title}</span>
                  </label>
                  <button className="icon-action" type="button" onClick={() => void deleteTask(task.id)} aria-label="Supprimer la tâche">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))
            ) : (
              <p className="muted phase-empty">Aucune tâche pour le moment.</p>
            )}
          </div>
        </section>

        <section className="card receipts-panel" id="receipts">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">
                <ReceiptText size={16} />
                Justificatifs
              </span>
              <h2>Galerie des reçus et preuves</h2>
              <p className="muted">Vert : téléversé. Gris : manquant. Rouge : requis mais manquant.</p>
            </div>
            <div className="dashboard-actions">
              <button className="button secondary" type="button" onClick={() => downloadReceiptBundle("zip")}>
                Télécharger ZIP
              </button>
              <button className="button secondary" type="button" onClick={() => downloadReceiptBundle("pdf")}>
                Télécharger PDF
              </button>
            </div>
          </div>
          <div className="receipt-gallery">
            {receiptItems.map((item) => (
              <button className={`receipt-tile ${item.state}`} key={`${item.source}-${item.id}`} type="button" onClick={() => setSelectedReceipt(item)}>
                <span className="receipt-icon" aria-hidden="true" />
                <strong>{item.title}</strong>
                <span>{item.source} · {item.owner}</span>
                <small>{item.fileName ?? "Aucun fichier"}</small>
              </button>
            ))}
          </div>
          {selectedReceipt ? (
            <div className="receipt-preview">
              <div>
                <strong>Prévisualisation</strong>
                <p className="muted">
                  {selectedReceipt.fileName
                    ? `${selectedReceipt.fileName} lié à ${selectedReceipt.title}.`
                    : `Justificatif manquant pour ${selectedReceipt.title}.`}
                </p>
              </div>
              <button className="small-action" type="button" onClick={() => setSelectedReceipt(null)}>
                Fermer
              </button>
            </div>
          ) : null}
        </section>

        <section className="card balance-panel" id="balance">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">
                <ArrowDownUp size={16} />
                Solde & Équilibre
              </span>
              <h2>Répartition automatique</h2>
              <p className="muted">
                Chaque part est comparée au montant réellement avancé pour calculer les remboursements.
              </p>
            </div>
          </div>
          <div className="balance-grid">
            {memberKpis.map((member) => (
              <article className="balance-card" key={member.name}>
                <strong>{member.name}</strong>
                <span>Part : {percentageFormatter.format(member.sharePercentage)} %</span>
                <span>Devrait avancer : {formatter.format(member.expectedAdvance)}</span>
                <span>A avancé : {formatter.format(member.total)}</span>
                <span className={member.balance >= 0 ? "positive-balance" : "negative-balance"}>
                  {member.balance >= 0 ? "À recevoir" : "À payer"} : {formatter.format(Math.abs(member.balance))}
                </span>
              </article>
            ))}
          </div>
          <div className="settlement-list">
            <strong>Qui doit quoi à qui</strong>
            {settlements.length > 0 ? (
              settlements.map((settlement) => (
                <div className="compact-row" key={`${settlement.from}-${settlement.to}`}>
                  <span>{settlement.from}</span>
                  <strong>doit {formatter.format(settlement.amount)}</strong>
                  <span>à {settlement.to}</span>
                </div>
              ))
            ) : (
              <p className="muted">Les avances sont déjà équilibrées.</p>
            )}
          </div>
        </section>

        <section className="card budget-panel" id="budget">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">Budget</span>
              <h2>Cadre projet</h2>
              <p className="muted">
                Échéance au {new Date(project.endDate).toLocaleDateString("fr-FR")} avec budget total de{" "}
                {formatter.format(project.totalBudget)}.
              </p>
            </div>
            <div className="summary-chips">
              <span>Dépensé : {formatter.format(totalExpenses)}</span>
              <span>Restant : {formatter.format(budgetRemaining)}</span>
              <span>Revenus : {project.revenueGeneration ? "activés" : "non activés"}</span>
            </div>
          </div>
        </section>

        <section className="card vault-panel" id="vault">
          <div className="panel-heading-row">
            <div>
              <span className="eyebrow">Coffre-fort</span>
              <h2>Identifiants partagés</h2>
              <p className="muted">Service, login, mot de passe et URL centralisés pour les associés autorisés.</p>
            </div>
          </div>
          <form className="inline-form" onSubmit={addCredential}>
            <input className="input" name="serviceName" placeholder="Service" required />
            <input className="input" name="login" placeholder="Login" required />
            <input className="input" name="password" placeholder="Mot de passe" required />
            <input className="input" name="url" placeholder="URL" type="url" required />
            <button className="button accent" type="submit">Ajouter</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Login</th>
                  <th>Mot de passe</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((credential) => (
                  <tr key={credential.id}>
                    <td>{credential.serviceName}</td>
                    <td>{credential.login}</td>
                    <td>{credential.password}</td>
                    <td>
                      <a className="receipt-name" href={credential.url} target="_blank" rel="noreferrer">
                        Ouvrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <>
            <section className="card revenues-panel" id="revenues">
              <div className="panel-heading-row">
                <div>
                  <span className="eyebrow">
                    <TrendingUp size={16} />
                    Module Pro
                  </span>
                  <h2>Revenus</h2>
                  <p className="muted">Date, objet, client, montant, statut et justificatif de chaque revenu.</p>
                </div>
              </div>
              <form className="inline-form revenue-form" onSubmit={addRevenue}>
                <input className="input" name="revenueDate" type="date" defaultValue="2026-06-10" required />
                <input className="input" name="revenueObject" placeholder="Objet" required />
                <input className="input" name="client" placeholder="Client" required />
                <input className="input" name="revenueAmount" min="1" step="0.01" type="number" placeholder="Montant" required />
                <select className="select" name="revenueStatus">
                  {revenueStatuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <input className="input" name="revenueReceipt" type="file" accept="image/*,.pdf,.csv" />
                <label className="checkbox-row">
                  <input name="revenueReceiptRequired" type="checkbox" defaultChecked />
                  Justificatif requis
                </label>
                <button className="button accent" type="submit">Ajouter</button>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Objet</th>
                      <th>Client</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Justificatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenues.map((revenue) => (
                      <tr key={revenue.id}>
                        <td>{new Date(revenue.date).toLocaleDateString("fr-FR")}</td>
                        <td>{revenue.object}</td>
                        <td>{revenue.client}</td>
                        <td>{formatter.format(revenue.amount)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(revenue.status)}`}>{revenue.status}</span>
                        </td>
                        <td>{revenue.receipt ? <span className="receipt-name">{revenue.receipt}</span> : "À ajouter"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card rentability-panel" id="rentability" aria-label="Module rentabilité Pro">
              <div className="rentability-header">
                <div>
                  <span className="eyebrow">
                    <TrendingUp size={16} />
                    Module Pro
                  </span>
                  <h2>Rentabilité projet</h2>
                  <p className="muted">Calculée automatiquement depuis les revenus et dépenses saisis.</p>
                </div>
              </div>
              <div className="rentability-grid">
                <article className="metric-card rentability-metric">
                  <span>Revenus encaissés</span>
                  <strong>{formatter.format(revenueCollected)}</strong>
                </article>
                <article className="metric-card rentability-metric">
                  <span>Revenus en attente</span>
                  <strong>{formatter.format(revenuePending)}</strong>
                </article>
                <article className="metric-card rentability-metric">
                  <span>Total dépenses</span>
                  <strong>{formatter.format(totalExpenses)}</strong>
                </article>
                <article className="metric-card rentability-metric">
                  <span>Marge actuelle</span>
                  <strong>{formatter.format(currentMargin)}</strong>
                  <small>{percentageFormatter.format(currentMarginRate)} %</small>
                </article>
                <article className="metric-card rentability-metric">
                  <span>Marge projetée</span>
                  <strong>{formatter.format(projectedMargin)}</strong>
                </article>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="card locked-pro-panel" id="revenues">
              <span className="eyebrow">
                <Lock size={16} />
                Module Pro
              </span>
              <h2>Revenus</h2>
              <p className="muted">Disponible avec le plan Pro — passer à Pro.</p>
              <Link className="button secondary" href="/#tarifs">
                Voir le plan Pro
              </Link>
            </section>
            <section className="card locked-pro-panel" id="rentability">
              <span className="eyebrow">
                <Lock size={16} />
                Module Pro
              </span>
              <h2>Rentabilité projet</h2>
              <p className="muted">Disponible avec le plan Pro — passer à Pro.</p>
              <Link className="button secondary" href="/#tarifs">
                Voir le plan Pro
              </Link>
            </section>
          </>
        )}
      </section>

      <nav className="mobile-bottom-nav" aria-label="Navigation mobile dashboard">
        <a href="#expenses">Dépenses</a>
        <a href="#balance">Solde</a>
        <a href="#receipts">Justificatifs</a>
        <a href="#agenda">Agenda</a>
        <a href="#contacts">+ Plus</a>
      </nav>

      {isExpenseModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="card expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
            <button className="modal-close" type="button" onClick={() => setIsExpenseModalOpen(false)} aria-label="Fermer">
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
                  <input className="input" id="title" name="title" required placeholder="Ex : billets de train salon" />
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
              <div className="form-field">
                <label htmlFor="phaseId">Phase projet</label>
                <select className="select" id="phaseId" name="phaseId">
                  {project.phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label htmlFor="date">Date</label>
                  <input className="input" id="date" name="date" type="date" defaultValue="2026-06-10" required />
                </div>
                <div className="form-field">
                  <label htmlFor="paymentMethod">Mode de paiement</label>
                  <select className="select" id="paymentMethod" name="paymentMethod">
                    {project.paymentMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-grid-two">
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
                <label className="checkbox-row modal-checkbox">
                  <input name="receiptRequired" type="checkbox" defaultChecked />
                  Justificatif requis
                </label>
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
