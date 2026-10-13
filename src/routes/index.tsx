import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCurrentTeamMember } from "@/lib/current-team-member";
import {
  ArrowRight,
  Users,
  FileText,
  BookOpen,
  Video,
  Megaphone,
  Mail,
  BarChart3,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const modules = [
  {
    to: "/creators",
    title: "Influencers",
    description: "Discover, qualify, contact, ship, track content, and measure creator partnerships.",
    icon: Users,
    status: "Active",
  },
  {
    to: "/content",
    title: "Content",
    description: "Knowledge Center, SEO, social content, assets, news, and publishing workflows.",
    icon: FileText,
    status: "Active",
  },
  {
    to: "/book",
    title: "Preparedness Book",
    description: "Create and manage the Survival Tabs preparedness guide and lesson production workflow.",
    icon: BookOpen,
    status: "Connected",
  },
  {
    to: "/video",
    title: "Video",
    description: "Develop short-form concepts, scripts, shots, assets, edits, and finished campaign videos.",
    icon: Video,
    status: "Active",
  },
  {
    to: "/campaigns",
    title: "Campaigns",
    description: "Turn approved ideas into coordinated promotion across creators, social, email, and content.",
    icon: Megaphone,
    status: "Active",
  },
  {
    to: "/communications",
    title: "Outreach",
    description: "Manage creator communications, follow-ups, templates, and team handoffs.",
    icon: Mail,
    status: "Active",
  },
  {
    to: "/analytics",
    title: "Analytics",
    description: "Track promotion output, responses, publishing results, traffic, and conversion signals.",
    icon: BarChart3,
    status: "Active",
  },
] as const;

function Dashboard() {
  const member = useCurrentTeamMember();
  const navigate = useNavigate();

  useEffect(() => {
    if (member.id === "RENA" || member.id === "VINA") {
      navigate({ to: "/creators", replace: true });
    }
  }, [member.id, navigate]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
              <Sparkles className="h-3.5 w-3.5" /> Promotion OS
            </div>
            <h1 className="font-display text-4xl leading-tight text-foreground">Survival Tabs</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              One workspace for promotion: influencers, content, preparedness education, video, campaigns, outreach, and results.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current brand</div>
            <div className="mt-1 font-medium text-foreground">Survival Tabs</div>
            <div className="mt-1 text-xs text-muted-foreground">Swedish Bitters and MicrobeBio are staged for later.</div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-foreground">Promotion modules</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the job you want to do. Existing workflows remain intact inside each module.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.to}
                to={module.to}
                className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {module.status}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl text-foreground">{module.title}</h3>
                <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">{module.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open module <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operating principle</div>
          <p className="mt-2 font-display text-xl leading-8 text-foreground">
            Create once, reuse everywhere: article → campaign → creator brief → video/social → outreach → measurement.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Backend status</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This foundation keeps the current Lovable-managed workflows unchanged. Database consolidation is intentionally deferred until the shell is proven.
          </p>
        </div>
      </section>
    </div>
  );
}
