// Real authenticated-user hook.
// Reads the Supabase session + user_roles + profiles rows and exposes a
// stable shape the app can render (name, email, avatar, role, permissions,
// legacy team id used by the creator workspace overlay).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ROLE_LABEL,
  can as roleCan,
  roleToTeamId,
  type AppRole,
  type Permission,
  type TeamMemberId,
} from "./permissions";

export interface AuthProfile {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  initials: string;
  role: AppRole | null;
  roleLabel: string;
  teamId: TeamMemberId | null; // legacy id used by workspace overlay
  online: boolean;
}

function initialsFrom(name: string, email: string) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

type State =
  | { status: "loading"; profile: null }
  | { status: "unauthenticated"; profile: null }
  | { status: "authenticated"; profile: AuthProfile };

async function fetchProfile(userId: string, email: string, meta: Record<string, unknown>): Promise<AuthProfile> {
  const [{ data: profileRow }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, email").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);
  const fullName =
    profileRow?.full_name ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    email;
  const avatarUrl =
    profileRow?.avatar_url ??
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;
  const role = (roleRow?.role as AppRole | undefined) ?? null;
  // Best-effort presence ping (ignore failure).
  void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
  return {
    userId,
    email: profileRow?.email ?? email,
    fullName,
    avatarUrl,
    initials: initialsFrom(fullName, email),
    role,
    roleLabel: role ? ROLE_LABEL[role] : "No role assigned",
    teamId: roleToTeamId(role),
    online: true,
  };
}

export function useAuth(): State & {
  can: (p: Permission) => boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<State>({ status: "loading", profile: null });

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setState({ status: "unauthenticated", profile: null });
      return;
    }
    const profile = await fetchProfile(
      data.user.id,
      data.user.email ?? "",
      (data.user.user_metadata ?? {}) as Record<string, unknown>,
    );
    setState({ status: "authenticated", profile });
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const signIn = useCallback(async () => {
    const { lovable } = await import("@/integrations/lovable");
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ status: "unauthenticated", profile: null });
  }, []);

  return {
    ...state,
    can: (p) => roleCan(state.profile?.role ?? null, p),
    signIn,
    signOut,
  };
}
