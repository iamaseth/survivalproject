// Mock authentication for the Creator Partnerships workspace.
// Stores the "logged-in" team member in localStorage so the personalized
// dashboard, My Queue, notifications and activity feed re-render when the
// user switches. Shape mirrors what a future Supabase `auth.users` +
// `team_members` join would return so the UI can swap the source without
// changes.
import { useSyncExternalStore } from "react";

export type TeamMemberId = "SETH" | "RENA" | "VINA" | "PERRY";

export interface TeamMember {
  id: TeamMemberId;
  name: string;
  title: string;
  initials: string;
  role: "researcher" | "team_lead" | "outreach" | "executive";
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "SETH",  name: "Seth",  title: "Research & AI",       initials: "SE", role: "researcher" },
  { id: "RENA",  name: "Rena",  title: "Team Lead",           initials: "RE", role: "team_lead"  },
  { id: "VINA",  name: "Vina",  title: "Outreach & Follow-up",initials: "VI", role: "outreach"   },
  { id: "PERRY", name: "Perry", title: "Executive Oversight", initials: "PE", role: "executive"  },
];

const LS_KEY = "st.creator-workspace.current-user.v1";

function readLS(): TeamMemberId {
  if (typeof window === "undefined") return "RENA";
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw && TEAM_MEMBERS.some((t) => t.id === raw)) return raw as TeamMemberId;
  } catch { /* ignore */ }
  return "RENA";
}

let cache: TeamMemberId = readLS();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(LS_KEY, cache); } catch { /* ignore */ }
  }
  listeners.forEach((l) => l());
}

export function setCurrentTeamMember(id: TeamMemberId) {
  cache = id;
  emit();
}

export function getCurrentTeamMemberId(): TeamMemberId {
  return cache;
}

export function useCurrentTeamMember(): TeamMember {
  const id = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => cache,
    () => "RENA" as TeamMemberId,
  );
  return TEAM_MEMBERS.find((t) => t.id === id) ?? TEAM_MEMBERS[1];
}
