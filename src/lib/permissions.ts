// Role → permissions catalog for the Creator Partnerships hub.
// Kept as a pure module so both the header dropdown and workflow actions can
// gate UI ("hide, don't disable") without additional lookups.

export type AppRole =
  | "executive"
  | "research_manager"
  | "partnership_manager"
  | "partnership_coordinator"
  | "shopify_content_editor";

export type Permission =
  // shared
  | "view_reports"
  | "export_reports"
  | "view_executive_dashboard"
  | "executive_notes"
  | "override_assignments"
  | "reassign_creators"
  // research
  | "research_creators"
  | "ai_recommendations"
  | "edit_creator_profile"
  | "assign_creators"
  | "create_campaigns"
  // partnership manager
  | "manage_creators"
  | "outreach_oversight"
  | "shipping"
  | "negotiation"
  | "team_supervision"
  | "campaign_management"
  // coordinator (day-to-day)
  | "outreach"
  | "follow_up"
  | "relationship_management"
  | "update_creator_records"
  | "shipping_updates"
  | "content_tracking";

const EXEC: Permission[] = [
  "view_reports", "export_reports",
  "view_executive_dashboard", "executive_notes",
  "override_assignments", "reassign_creators",
];

const RESEARCH: Permission[] = [
  "research_creators", "ai_recommendations",
  "edit_creator_profile", "assign_creators", "create_campaigns",
  "view_reports",
];

const PM: Permission[] = [
  "manage_creators", "assign_creators", "outreach_oversight",
  "shipping", "negotiation", "team_supervision", "campaign_management",
  // coordinator perms are a subset of what a PM does
  "outreach", "follow_up", "relationship_management",
  "update_creator_records", "shipping_updates", "content_tracking",
  "view_reports",
];

const COORDINATOR: Permission[] = [
  "outreach", "follow_up", "relationship_management",
  "update_creator_records", "shipping_updates", "content_tracking",
];

export const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<Permission>> = {
  executive:                new Set(EXEC),
  research_manager:         new Set(RESEARCH),
  partnership_manager:      new Set(PM),
  partnership_coordinator:  new Set(COORDINATOR),
  shopify_content_editor:   new Set<Permission>(),
};

export function can(role: AppRole | null, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].has(perm);
}

export const ROLE_LABEL: Record<AppRole, string> = {
  executive:               "Executive",
  research_manager:        "Research Manager",
  partnership_manager:     "Partnership Manager",
  partnership_coordinator: "Partnership Coordinator",
  shopify_content_editor:  "Shopify Content Editor",
};

// Map DB app_role → the legacy TeamMemberId used inside creator-workspace
// so ownership / queue filters keep working without renaming data.
export type TeamMemberId = "SETH" | "RENA" | "VINA" | "PERRY";

export function roleToTeamId(role: AppRole | null): TeamMemberId | null {
  switch (role) {
    case "executive":                return "PERRY";
    case "research_manager":         return "SETH";
    case "partnership_manager":      return "RENA";
    case "partnership_coordinator":  return "VINA";
    default:                         return null;
  }
}
