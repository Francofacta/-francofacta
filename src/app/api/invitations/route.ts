import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type InvitationPayload = {
  projectId?: string;
  members: {
    firstName: string;
    email: string;
  }[];
};

export async function POST(request: Request) {
  const payload = (await request.json()) as InvitationPayload;
  const origin = request.headers.get("origin") ?? "https://francofacta.vercel.app";

  if (!payload.members?.length || payload.members.some((member) => !member.firstName || !member.email)) {
    return NextResponse.json({ error: "Chaque membre doit avoir un prénom et un email." }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !payload.projectId) {
    return NextResponse.json({ sent: false, mode: "demo" });
  }

  const supabase = createServiceClient();
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
