import { NextResponse } from "next/server";
import { getCurrentUserPaymentAccess } from "@/lib/payment-access";
import { createServiceClient } from "@/lib/supabase/server";

type InvitationPayload = {
  projectId?: string;
  members: {
    firstName: string;
    email: string;
  }[];
};

export async function POST(request: Request) {
  const access = await getCurrentUserPaymentAccess();

  if (!access.user) {
    return NextResponse.json({ error: "Connexion requise avant d'envoyer des invitations." }, { status: 401 });
  }

  if (!access.hasActivePaidPlan) {
    return NextResponse.json({ error: "Paiement requis avant d'envoyer des invitations." }, { status: 402 });
  }

  const payload = (await request.json()) as InvitationPayload;
  const origin = request.headers.get("origin") ?? "https://francofacta.vercel.app";

  if (!payload.members?.length || payload.members.some((member) => !member.firstName || !member.email)) {
    return NextResponse.json({ error: "Chaque membre doit avoir un prénom et un email." }, { status: 400 });
  }

  if (!payload.projectId) {
    return NextResponse.json({ error: "Projet requis pour envoyer des invitations." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", payload.projectId)
    .eq("owner_id", access.user.id)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Projet introuvable pour cet utilisateur." }, { status: 404 });
  }

  const redirectTo = `${origin}/dashboard?project=${payload.projectId}`;
  const results = await Promise.all(
    payload.members.map((member) =>
      supabase.auth.admin.inviteUserByEmail(member.email, {
        redirectTo,
        data: {
          first_name: member.firstName,
          project_id: payload.projectId
        }
      })
    )
  );

  const error = results.find((result) => result.error)?.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("project_invitations").insert(
    payload.members.map((member) => ({
      project_id: payload.projectId,
      first_name: member.firstName,
      email: member.email,
      invite_link: redirectTo
    }))
  );

  return NextResponse.json({ sent: true });
}
