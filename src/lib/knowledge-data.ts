export type GuideStatus =
  | "Planning"
  | "Research"
  | "Writing"
  | "Review"
  | "Ready to Publish"
  | "Published";

export const GUIDE_STATUS_ORDER: GuideStatus[] = [
  "Planning",
  "Research",
  "Writing",
  "Review",
  "Ready to Publish",
  "Published",
];

export const guideStatusTone: Record<GuideStatus, string> = {
  Planning: "bg-secondary text-foreground",
  Research: "bg-[color:var(--gold)]/20 text-[color:var(--gold)]",
  Writing: "bg-primary/15 text-primary",
  Review: "bg-[color:var(--olive)]/20 text-[color:var(--olive)]",
  "Ready to Publish": "bg-[color:var(--forest)]/20 text-[color:var(--forest)]",
  Published: "bg-[color:var(--forest)] text-primary-foreground",
};

export type ChapterStatus = "Not Started" | "Drafting" | "In Review" | "Approved";
export type LegacyAction = "Keep" | "Rewrite" | "Merge" | "Redirect" | "Delete";
export type Priority = "High" | "Medium" | "Low";

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  status: ChapterStatus;
  wordTarget: number;
  wordCurrent: number;
  updatedAt: string;
}

export interface LegacyArticle {
  id: string;
  title: string;
  url: string;
  status: "Live" | "Draft" | "Unpublished";
  action: LegacyAction;
  priority: Priority;
}

export interface Download {
  id: string;
  title: string;
  kind: "PDF Guide" | "Checklist" | "Emergency Plan" | "Worksheet";
  size: string;
}

export interface GuideImage {
  id: string;
  url: string;
  caption: string;
}

export interface GuideVideo {
  id: string;
  title: string;
  source: "YouTube" | "Embedded";
  status: "Draft" | "Approved" | "Published";
  url: string;
}

export interface Revision {
  id: string;
  at: string;
  actor: string;
  note: string;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  targetAudience: string;
  coverImage: string;
  status: GuideStatus;
  completion: number;
  author: string;
  reviewer: string;
  approver: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: "Informational" | "Commercial" | "Navigational" | "Transactional";
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  internalLinks: string[];
  externalReferences: string[];
  schemaStatus: "Missing" | "Draft" | "Complete";
  draftStatus: string;
  reviewStatus: string;
  approvalStatus: string;
  publishDate?: string;
  lastRevision: string;
  updatedAt: string;
  chapters: Chapter[];
  legacyArticles: LegacyArticle[];
  downloads: Download[];
  images: GuideImage[];
  videos: GuideVideo[];
  revisions: Revision[];
}

const cover = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;

export const guides: Guide[] = [
  {
    id: "g-prep",
    title: "Complete Guide to Emergency Preparedness",
    slug: "complete-emergency-preparedness",
    description:
      "The definitive resource for families building a resilient emergency plan — from risk assessment to 30-day readiness.",
    category: "Preparedness",
    targetAudience: "Families new to emergency planning",
    coverImage: cover("photo-1526779259212-939e64788e3c"),
    status: "Writing",
    completion: 62,
    author: "Seth",
    reviewer: "Perry",
    approver: "Perry",
    primaryKeyword: "emergency preparedness",
    secondaryKeywords: ["disaster readiness", "family emergency plan", "survival basics"],
    searchIntent: "Informational",
    metaTitle: "Complete Guide to Emergency Preparedness (2026)",
    metaDescription:
      "Step-by-step emergency preparedness for families — plans, supplies, food, water, and 72-hour kits.",
    canonicalUrl: "https://thesurvivaltabs.com/guides/emergency-preparedness",
    internalLinks: ["/guides/emergency-food-storage", "/guides/72-hour-kit"],
    externalReferences: ["ready.gov", "FEMA.gov", "Red Cross"],
    schemaStatus: "Draft",
    draftStatus: "In Progress",
    reviewStatus: "Not Started",
    approvalStatus: "Not Started",
    publishDate: undefined,
    lastRevision: "2026-07-18",
    updatedAt: "2026-07-19",
    chapters: [
      { id: "c1", number: 1, title: "Why Preparedness Matters", summary: "Framing risks and mindset.", status: "Approved", wordTarget: 1200, wordCurrent: 1240, updatedAt: "2026-07-10" },
      { id: "c2", number: 2, title: "Assessing Household Risk", summary: "Regional hazards and vulnerabilities.", status: "In Review", wordTarget: 1500, wordCurrent: 1420, updatedAt: "2026-07-14" },
      { id: "c3", number: 3, title: "Building Your Emergency Plan", summary: "Roles, contacts, meeting points.", status: "Drafting", wordTarget: 2000, wordCurrent: 900, updatedAt: "2026-07-17" },
      { id: "c4", number: 4, title: "Food & Water Foundations", summary: "Baseline supply targets.", status: "Drafting", wordTarget: 1800, wordCurrent: 640, updatedAt: "2026-07-18" },
      { id: "c5", number: 5, title: "72-Hour Kits", summary: "Kit contents by household size.", status: "Not Started", wordTarget: 1600, wordCurrent: 0, updatedAt: "2026-07-01" },
      { id: "c6", number: 6, title: "Long-Term Readiness", summary: "30-day and beyond.", status: "Not Started", wordTarget: 2200, wordCurrent: 0, updatedAt: "2026-07-01" },
    ],
    legacyArticles: [
      { id: "la1", title: "10 Things Every Prepper Needs", url: "/blog/10-things-every-prepper-needs", status: "Live", action: "Merge", priority: "High" },
      { id: "la2", title: "How to Start Prepping in 2019", url: "/blog/start-prepping-2019", status: "Live", action: "Rewrite", priority: "High" },
      { id: "la3", title: "Prepping Myths Debunked", url: "/blog/prepping-myths", status: "Live", action: "Keep", priority: "Medium" },
      { id: "la4", title: "Old Bug-Out Bag Roundup", url: "/blog/bug-out-bag-2017", status: "Live", action: "Redirect", priority: "Low" },
    ],
    downloads: [
      { id: "d1", title: "Family Emergency Plan Template", kind: "Emergency Plan", size: "1.2 MB" },
      { id: "d2", title: "72-Hour Kit Checklist", kind: "Checklist", size: "420 KB" },
    ],
    images: [
      { id: "i1", url: cover("photo-1526779259212-939e64788e3c"), caption: "Cover: family emergency planning session." },
      { id: "i2", url: cover("photo-1504198266287-1659872e6590"), caption: "Household risk map example." },
    ],
    videos: [
      { id: "v1", title: "Emergency Preparedness in 10 Minutes", source: "YouTube", status: "Published", url: "https://youtube.com/watch?v=example" },
    ],
    revisions: [
      { id: "r1", at: "2026-07-18", actor: "Seth", note: "Drafted Chapter 4 outline." },
      { id: "r2", at: "2026-07-14", actor: "Perry", note: "Approved Chapter 1." },
      { id: "r3", at: "2026-07-08", actor: "Seth", note: "Guide created and outlined." },
    ],
  },
  {
    id: "g-food",
    title: "Emergency Food Storage",
    slug: "emergency-food-storage",
    description: "Everything on shelf-stable food selection, rotation, and long-term storage for households.",
    category: "Food & Water",
    targetAudience: "Households building 30+ day supply",
    coverImage: cover("photo-1505253758473-96b7015fcd40"),
    status: "Review",
    completion: 78,
    author: "Seth",
    reviewer: "Rena",
    approver: "Perry",
    primaryKeyword: "emergency food storage",
    secondaryKeywords: ["long term food storage", "shelf stable food", "food rotation"],
    searchIntent: "Informational",
    metaTitle: "Emergency Food Storage: The Complete Guide",
    metaDescription: "How to plan, buy, and rotate long-term emergency food storage for your family.",
    canonicalUrl: "https://thesurvivaltabs.com/guides/emergency-food-storage",
    internalLinks: ["/guides/complete-emergency-preparedness"],
    externalReferences: ["USDA", "Utah State Extension"],
    schemaStatus: "Complete",
    draftStatus: "Complete",
    reviewStatus: "In Progress",
    approvalStatus: "Not Started",
    lastRevision: "2026-07-16",
    updatedAt: "2026-07-16",
    chapters: [
      { id: "c1", number: 1, title: "Shelf Life Basics", summary: "How long different foods last.", status: "Approved", wordTarget: 1400, wordCurrent: 1450, updatedAt: "2026-07-05" },
      { id: "c2", number: 2, title: "What to Store", summary: "Categories and calorie targets.", status: "Approved", wordTarget: 1800, wordCurrent: 1780, updatedAt: "2026-07-10" },
      { id: "c3", number: 3, title: "Storage Conditions", summary: "Temperature, humidity, pests.", status: "In Review", wordTarget: 1200, wordCurrent: 1180, updatedAt: "2026-07-14" },
      { id: "c4", number: 4, title: "Rotation Systems", summary: "FIFO and inventory tracking.", status: "Drafting", wordTarget: 1000, wordCurrent: 620, updatedAt: "2026-07-16" },
    ],
    legacyArticles: [
      { id: "la1", title: "Best Long-Term Foods", url: "/blog/best-long-term-foods", status: "Live", action: "Merge", priority: "High" },
      { id: "la2", title: "How to Rotate Emergency Food", url: "/blog/rotate-emergency-food", status: "Live", action: "Keep", priority: "Medium" },
      { id: "la3", title: "Mylar Bag Tutorial 2016", url: "/blog/mylar-bags-2016", status: "Live", action: "Rewrite", priority: "Medium" },
    ],
    downloads: [
      { id: "d1", title: "30-Day Food Storage Worksheet", kind: "Worksheet", size: "310 KB" },
      { id: "d2", title: "Pantry Inventory PDF", kind: "PDF Guide", size: "780 KB" },
    ],
    images: [
      { id: "i1", url: cover("photo-1505253758473-96b7015fcd40"), caption: "Cover: organized emergency pantry." },
    ],
    videos: [],
    revisions: [
      { id: "r1", at: "2026-07-16", actor: "Rena", note: "Started review pass." },
      { id: "r2", at: "2026-07-10", actor: "Seth", note: "Chapter 2 approved." },
    ],
  },
  {
    id: "g-water",
    title: "Emergency Water Storage",
    slug: "emergency-water-storage",
    description: "Safe water storage, purification, and daily-use planning for emergencies.",
    category: "Food & Water",
    targetAudience: "Any household",
    coverImage: cover("photo-1548839140-29a749e1cf4d"),
    status: "Writing",
    completion: 40,
    author: "Seth",
    reviewer: "Rena",
    approver: "Perry",
    primaryKeyword: "emergency water storage",
    secondaryKeywords: ["water purification", "water storage containers", "drinking water"],
    searchIntent: "Informational",
    metaTitle: "Emergency Water Storage — Safe, Simple, Long-Term",
    metaDescription: "How much water to store, containers to use, and how to purify safely.",
    canonicalUrl: "https://thesurvivaltabs.com/guides/emergency-water-storage",
    internalLinks: ["/guides/complete-emergency-preparedness"],
    externalReferences: ["EPA", "CDC"],
    schemaStatus: "Draft",
    draftStatus: "In Progress",
    reviewStatus: "Not Started",
    approvalStatus: "Not Started",
    lastRevision: "2026-07-15",
    updatedAt: "2026-07-15",
    chapters: [
      { id: "c1", number: 1, title: "How Much Water", summary: "Gallons per person per day.", status: "Approved", wordTarget: 900, wordCurrent: 920, updatedAt: "2026-07-06" },
      { id: "c2", number: 2, title: "Containers & Storage", summary: "Materials and placement.", status: "Drafting", wordTarget: 1400, wordCurrent: 600, updatedAt: "2026-07-15" },
      { id: "c3", number: 3, title: "Purification Methods", summary: "Boiling, filters, tablets.", status: "Not Started", wordTarget: 1600, wordCurrent: 0, updatedAt: "2026-07-01" },
    ],
    legacyArticles: [
      { id: "la1", title: "Water Storage 101", url: "/blog/water-storage-101", status: "Live", action: "Rewrite", priority: "High" },
      { id: "la2", title: "Old Water Purifier Reviews", url: "/blog/purifier-reviews-2015", status: "Live", action: "Delete", priority: "Low" },
    ],
    downloads: [
      { id: "d1", title: "Water Storage Calculator", kind: "Worksheet", size: "180 KB" },
    ],
    images: [
      { id: "i1", url: cover("photo-1548839140-29a749e1cf4d"), caption: "Cover: sealed water storage barrels." },
    ],
    videos: [],
    revisions: [
      { id: "r1", at: "2026-07-15", actor: "Seth", note: "Drafted container chapter." },
    ],
  },
  {
    id: "g-72hr",
    title: "72-Hour Emergency Kit",
    slug: "72-hour-emergency-kit",
    description: "Build a complete 72-hour kit for every member of the household — tested checklists included.",
    category: "Kits & Gear",
    targetAudience: "Families and individuals",
    coverImage: cover("photo-1580901368919-7738efb0f87e"),
    status: "Ready to Publish",
    completion: 95,
    author: "Seth",
    reviewer: "Perry",
    approver: "Perry",
    primaryKeyword: "72 hour emergency kit",
    secondaryKeywords: ["bug out bag", "go bag", "72 hour kit list"],
    searchIntent: "Informational",
    metaTitle: "72-Hour Emergency Kit: Complete Checklist",
    metaDescription: "Exact 72-hour kit contents for adults, kids, and pets. Free printable checklist.",
    canonicalUrl: "https://thesurvivaltabs.com/guides/72-hour-emergency-kit",
    internalLinks: ["/guides/complete-emergency-preparedness"],
    externalReferences: ["FEMA"],
    schemaStatus: "Complete",
    draftStatus: "Complete",
    reviewStatus: "Complete",
    approvalStatus: "Complete",
    publishDate: "2026-07-25",
    lastRevision: "2026-07-19",
    updatedAt: "2026-07-19",
    chapters: [
      { id: "c1", number: 1, title: "Kit Fundamentals", summary: "Purpose and structure.", status: "Approved", wordTarget: 900, wordCurrent: 940, updatedAt: "2026-07-05" },
      { id: "c2", number: 2, title: "Adult Kit Contents", summary: "Complete checklist.", status: "Approved", wordTarget: 1500, wordCurrent: 1520, updatedAt: "2026-07-08" },
      { id: "c3", number: 3, title: "Kids & Pet Kits", summary: "Age-specific adjustments.", status: "Approved", wordTarget: 1100, wordCurrent: 1080, updatedAt: "2026-07-11" },
      { id: "c4", number: 4, title: "Maintenance & Rotation", summary: "Yearly check schedule.", status: "In Review", wordTarget: 700, wordCurrent: 690, updatedAt: "2026-07-19" },
    ],
    legacyArticles: [
      { id: "la1", title: "Bug Out Bag Essentials", url: "/blog/bug-out-bag-essentials", status: "Live", action: "Merge", priority: "High" },
      { id: "la2", title: "72 Hour Kit for Kids", url: "/blog/72-hour-kit-kids", status: "Live", action: "Keep", priority: "Medium" },
    ],
    downloads: [
      { id: "d1", title: "72-Hour Adult Checklist", kind: "Checklist", size: "260 KB" },
      { id: "d2", title: "72-Hour Kids Checklist", kind: "Checklist", size: "240 KB" },
      { id: "d3", title: "Printable Kit Guide", kind: "PDF Guide", size: "1.6 MB" },
    ],
    images: [
      { id: "i1", url: cover("photo-1580901368919-7738efb0f87e"), caption: "Cover: laid-out 72-hour kit." },
    ],
    videos: [
      { id: "v1", title: "Pack a 72-Hour Kit in 15 Minutes", source: "YouTube", status: "Approved", url: "https://youtube.com/watch?v=example" },
    ],
    revisions: [
      { id: "r1", at: "2026-07-19", actor: "Perry", note: "Final review complete — cleared to publish." },
      { id: "r2", at: "2026-07-11", actor: "Seth", note: "Kids/pet chapter approved." },
    ],
  },
  {
    id: "g-plan",
    title: "Family Emergency Plan",
    slug: "family-emergency-plan",
    description: "Build a documented family emergency plan with contacts, meeting points, and drills.",
    category: "Planning",
    targetAudience: "Families with children",
    coverImage: cover("photo-1444703686981-a3abbc4d4fe3"),
    status: "Research",
    completion: 18,
    author: "Rena",
    reviewer: "Perry",
    approver: "Perry",
    primaryKeyword: "family emergency plan",
    secondaryKeywords: ["emergency contacts", "family drill", "meeting point"],
    searchIntent: "Informational",
    metaTitle: "How to Build a Family Emergency Plan",
    metaDescription: "A step-by-step family emergency plan you can complete this weekend.",
    canonicalUrl: "https://thesurvivaltabs.com/guides/family-emergency-plan",
    internalLinks: ["/guides/complete-emergency-preparedness"],
    externalReferences: ["ready.gov"],
    schemaStatus: "Missing",
    draftStatus: "Outlining",
    reviewStatus: "Not Started",
    approvalStatus: "Not Started",
    lastRevision: "2026-07-12",
    updatedAt: "2026-07-12",
    chapters: [
      { id: "c1", number: 1, title: "Plan Overview", summary: "What a plan should cover.", status: "Drafting", wordTarget: 800, wordCurrent: 240, updatedAt: "2026-07-12" },
      { id: "c2", number: 2, title: "Contacts & Meeting Points", summary: "Local and out-of-area contacts.", status: "Not Started", wordTarget: 1200, wordCurrent: 0, updatedAt: "2026-07-01" },
      { id: "c3", number: 3, title: "Running Drills", summary: "Quarterly practice framework.", status: "Not Started", wordTarget: 1000, wordCurrent: 0, updatedAt: "2026-07-01" },
    ],
    legacyArticles: [
      { id: "la1", title: "Family Communication Plan", url: "/blog/family-communication-plan", status: "Live", action: "Rewrite", priority: "High" },
    ],
    downloads: [],
    images: [
      { id: "i1", url: cover("photo-1444703686981-a3abbc4d4fe3"), caption: "Cover: family reviewing plan at kitchen table." },
    ],
    videos: [],
    revisions: [
      { id: "r1", at: "2026-07-12", actor: "Rena", note: "Guide scoped, outline drafted." },
    ],
  },
  {
    id: "g-power",
    title: "Power Outage Guide",
    slug: "power-outage-guide",
    description: "Prepare for short and extended power outages — food safety, heat, light, and communication.",
    category: "Situations",
    targetAudience: "Homeowners and renters",
    coverImage: cover("photo-1509395176047-4a66953fd231"),
    status: "Planning",
    completion: 8,
    author: "Seth",
    reviewer: "Perry",
    approver: "Perry",
    primaryKeyword: "power outage preparation",
    secondaryKeywords: ["blackout preparation", "food safety power outage", "generator basics"],
    searchIntent: "Informational",
    metaTitle: "Power Outage Guide: What To Do Before, During, After",
    metaDescription: "How to prepare for power outages and keep your family safe when the lights go out.",
    canonicalUrl: "https://thesurvivaltabs.com/guides/power-outage-guide",
    internalLinks: [],
    externalReferences: ["Red Cross", "CDC"],
    schemaStatus: "Missing",
    draftStatus: "Not Started",
    reviewStatus: "Not Started",
    approvalStatus: "Not Started",
    lastRevision: "2026-07-05",
    updatedAt: "2026-07-05",
    chapters: [
      { id: "c1", number: 1, title: "Before the Outage", summary: "Preparation checklist.", status: "Not Started", wordTarget: 1200, wordCurrent: 0, updatedAt: "2026-07-05" },
      { id: "c2", number: 2, title: "During the Outage", summary: "Food safety and safety practices.", status: "Not Started", wordTarget: 1400, wordCurrent: 0, updatedAt: "2026-07-05" },
    ],
    legacyArticles: [
      { id: "la1", title: "What to Do in a Blackout", url: "/blog/what-to-do-blackout", status: "Live", action: "Merge", priority: "Medium" },
    ],
    downloads: [],
    images: [
      { id: "i1", url: cover("photo-1509395176047-4a66953fd231"), caption: "Cover: candle-lit living room during outage." },
    ],
    videos: [],
    revisions: [
      { id: "r1", at: "2026-07-05", actor: "Seth", note: "Guide created." },
    ],
  },
];

export const guideCategories = Array.from(new Set(guides.map((g) => g.category)));
export const guideAuthors = Array.from(new Set(guides.map((g) => g.author)));
export const guideReviewers = Array.from(new Set(guides.map((g) => g.reviewer)));

export function guideById(id: string) {
  return guides.find((g) => g.id === id);
}
