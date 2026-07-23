// Adapter over the real authenticated user (src/lib/current-user.ts).
// Preserves the TeamMember shape the Creator Partnerships UI already consumes
// so we don't have to touch the personalized dashboard / queues logic.
//
// The mock switcher has been removed — `useCurrentTeamMember` returns the
// signed-in Google user's mapped team identity.
import { useAuth } from "./current-user";
import type { AppRole, TeamMemberId } from "./permissions";

export type { TeamMemberId };

export interface TeamMember {
  id: TeamMemberId;
  name: string;
  title: string;
  initials: string;
  role: "researcher" | "team_lead" | "outreach" | "executive";
  email?: string;
  avatarUrl?: string | null;
}

const ROLE_TO_LEGACY: Record<AppRole, TeamMember["role"]> = {
  research_manager:        "researcher",
  partnership_manager:     "team_lead",
  partnership_coordinator: "outreach",
  executive:               "executive",
};

const TITLE_BY_ID: Record<TeamMemberId, string> = {
  SETH:  "Research & AI",
  RENA:  "Partnership Manager",
  VINA:  "Outreach & Follow-up",
  PERRY: "Executive Oversight",
};

// Kept exported (some places imported it) but no longer used for a switcher.
export const TEAM_MEMBERS: TeamMember[] = [
  { id: "SETH",  name: "Seth",  title: TITLE_BY_ID.SETH,  initials: "SE", role: "researcher" },
  { id: "RENA",  name: "Rena",  title: TITLE_BY_ID.RENA,  initials: "RE", role: "team_lead"  },
  { id: "VINA",  name: "Vina",  title: TITLE_BY_ID.VINA,  initials: "VI", role: "outreach"   },
  { id: "PERRY", name: "Perry", title: TITLE_BY_ID.PERRY, initials: "PE", role: "executive"  },
];

// Fallback used only during the brief loading tick before auth resolves.
const FALLBACK: TeamMember = TEAM_MEMBERS[1];

export function useCurrentTeamMember(): TeamMember {
  const auth = useAuth();
  const p = auth.status === "authenticated" ? auth.profile : null;
  if (!p || !p.teamId || !p.role) return FALLBACK;
  return {
    id: p.teamId,
    name: p.fullName || TITLE_BY_ID[p.teamId],
    title: TITLE_BY_ID[p.teamId],
    initials: p.initials,
    role: ROLE_TO_LEGACY[p.role],
    email: p.email,
    avatarUrl: p.avatarUrl,
  };
}
