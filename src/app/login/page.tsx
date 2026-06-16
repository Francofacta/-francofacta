import { redirect } from "next/navigation";
import {
  createServiceClient,
  createUserServerClient,
  isSupabaseAuthConfigured,
  isSupabaseServiceConfigured
} from "@/lib/supabase/server";
import AuthPage from "../auth/page";

export const dynamic = "force-dynamic";

async function hasCompletedOnboarding(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("projects").select("id").eq("owner_id", userId).limit(1).maybeSingle<{ id: string }>();

  return Boolean(data);
}

export default async function LoginPage() {
  if (isSupabaseAuthConfigured() && isSupabaseServiceConfigured()) {
    const supabase = await createUserServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect((await hasCompletedOnboarding(user.id)) ? "/dashboard" : "/onboarding");
    }
  }

  return <AuthPage />;
}
