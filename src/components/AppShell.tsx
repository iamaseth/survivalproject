import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardCheck,
  GitBranch,
  FolderOpen,
  Users,
  Globe,
  Video,
  FileText,
  Mail,
  ListChecks,
  MessageSquare,
  Archive,
  Shield,
  Search,
  Bell,
} from "lucide-react";
import { currentUser } from "@/lib/mock-data";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/review", label: "Needs Boss Review", icon: ClipboardCheck },
  { to: "/decisions", label: "Decisions Needed", icon: GitBranch },
  { to: "/assets", label: "Assets", icon: FolderOpen },
  { to: "/creators", label: "Creator Partnerships", icon: Users },
  { to: "/website", label: "Website & Shopify", icon: Globe },
  { to: "/video", label: "Video Production", icon: Video },
  { to: "/seo", label: "SEO & Articles", icon: FileText },
  { to: "/email", label: "Email & Klaviyo", icon: Mail },
  { to: "/team-actions", label: "Team Actions", icon: ListChecks },
  { to: "/comments", label: "Comments", icon: MessageSquare },
  { to: "/archive", label: "Published Archive", icon: Archive },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="grid min-h-screen w-full grid-cols-[260px_minmax(0,1fr)] bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen flex-col bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border px-6 py-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-sidebar-primary">Survival Tabs</div>
          <div className="font-display text-xl leading-tight text-sidebar-foreground">Team Content Hub</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4 text-xs text-sidebar-foreground/70">
          <div className="mb-1 uppercase tracking-[0.18em] text-sidebar-primary">Primary objective</div>
          <p className="leading-snug">
            Drive qualified traffic and measurable sales to TheSurvivalTabs.com and approved Amazon listings.
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/85 px-8 py-4 backdrop-blur">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search assets, leads, tasks…"
              className="w-full max-w-md rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <button className="relative rounded-md border border-border bg-card p-2 hover:bg-secondary">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
          </button>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-1.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {currentUser.initials}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{currentUser.name}</div>
              <div className="truncate text-xs text-muted-foreground">{currentUser.title}</div>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
