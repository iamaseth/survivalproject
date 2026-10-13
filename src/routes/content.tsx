import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ArrowRight, BookOpen, Image, Megaphone, Newspaper, Search, Share2 } from "lucide-react";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content — Promotion OS" },
      { name: "description", content: "Survival Tabs content, SEO, social, news, and asset workflows." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

const contentAreas = [
  {
    to: "/knowledge",
    title: "Knowledge Center",
    description: "Research, create, review, and manage education-first preparedness content.",
    icon: BookOpen,
  },
  {
    to: "/seo",
    title: "SEO & Legacy Content",
    description: "Review search opportunities, legacy article decisions, redirects, and optimization work.",
    icon: Search,
  },
  {
    to: "/campaigns",
    title: "Campaign Factory",
    description: "Turn approved content and ideas into coordinated promotion campaigns.",
    icon: Megaphone,
  },
  {
    to: "/assets",
    title: "Assets",
    description: "Manage images, videos, documents, and approved reusable promotion materials.",
    icon: Image,
  },
  {
    to: "/content",
    title: "Social Content",
    description: "Prepare platform-specific posts, captions, shorts, reels, and publishing packages.",
    icon: Share2,
    disabled: true,
  },
  {
    to: "/content",
    title: "News & Opportunities",
    description: "Capture relevant events and stories that can become timely Survival Tabs promotion.",
    icon: Newspaper,
    disabled: true,
  },
] as const;

function ContentPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Promotion OS"
        title="Content"
        description="One entry point for Survival Tabs articles, SEO, campaigns, assets, social content, and timely promotion opportunities."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contentAreas.map((area) => {
          const Icon = area.icon;
          const card = (
            <div className={`h-full rounded-xl border border-border bg-card p-5 ${area.disabled ? "opacity-60" : "transition hover:border-primary/40 hover:shadow-sm"}`}>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl text-foreground">{area.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">{area.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {area.disabled ? "Coming into this module" : "Open"}
                {!area.disabled ? <ArrowRight className="h-4 w-4" /> : null}
              </div>
            </div>
          );

          return area.disabled ? (
            <div key={area.title}>{card}</div>
          ) : (
            <Link key={area.title} to={area.to}>
              {card}
            </Link>
          );
        })}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current data strategy</div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The existing Survival Tabs Content system remains the source for Knowledge Center and social/content operations while Promotion OS is being proven. No content data has been copied or deleted.
        </p>
      </section>
    </div>
  );
}
