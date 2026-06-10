import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type MemberInput = {
  name: string;
  role: string;
  color: string;
  sharePercentage: number;
};

type PhaseInput = {
  id?: string;
  name: string;
};

type OnboardingPayload = {
  projectName: string;
  projectType: string;
  currency: string;
  endDate: string;
  totalBudget: number;
  revenueGeneration: boolean;
  paymentMethods: string[];
  tabs: string[];
  phases: PhaseInput[];
  members: MemberInput[];
};

export async function POST(request: Request) {
  const payload = (await request.json()) as OnboardingPayload;
  const phases = payload.phases ?? [];

  if (!payload.projectName || !payload.projectType || payload.members.length === 0 || phases.length === 0) {
    return NextResponse.json({ error: "Projet, type, phases et membres sont requis." }, { status: 400 });
  }

  const shareTotal = payload.members.reduce((sum, member) => sum + Number(member.sharePercentage || 0), 0);

  if (Math.abs(shareTotal - 100) > 0.01) {
    return NextResponse.json({ error: "Les parts des membres doivent totaliser 100 %." }, { status: 400 });
  }

  if (!payload.endDate || !payload.totalBudget || payload.paymentMethods.length === 0) {
    return NextResponse.json(
      { error: "Date de fin, budget total et moyens de paiement sont requis." },
      { status: 400 }
    );
  }

  if (phases.some((phase) => !phase.name.trim())) {
    return NextResponse.json({ error: "Chaque phase doit avoir un nom." }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ saved: false, mode: "demo" });
  }

  const supabase = createServiceClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: payload.projectName,
      type: payload.projectType,
      currency: payload.currency,
      end_date: payload.endDate,
      total_budget: payload.totalBudget,
      revenue_generation: payload.revenueGeneration,
      payment_methods: payload.paymentMethods
    })
    .select("id")
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  const [membersResult, tabsResult, phasesResult] = await Promise.all([
    supabase.from("project_members").insert(
      payload.members.map((member) => ({
        project_id: project.id,
        name: member.name,
        role: member.role,
        color: member.color,
        share_percentage: member.sharePercentage
      }))
    ),
    supabase.from("project_tabs").insert(
      payload.tabs.map((tab) => ({
        project_id: project.id,
        name: tab
      }))
    ),
    supabase.from("project_phases").insert(
      phases.map((phase, index) => ({
        project_id: project.id,
        slug: phase.id,
        name: phase.name,
        position: index
      }))
    )
  ]);

  if (membersResult.error || tabsResult.error || phasesResult.error) {
    return NextResponse.json(
      { error: membersResult.error?.message ?? tabsResult.error?.message ?? phasesResult.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ saved: true, projectId: project.id });
}
