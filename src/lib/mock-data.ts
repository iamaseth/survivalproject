export type Role = "Owner" | "Boss" | "Coordinator" | "Technical" | "Team";
export type Status =
  | "Draft"
  | "Ready for Boss Review"
  | "Changes Requested"
  | "Boss Approved"
  | "Sent to Team"
  | "In Production"
  | "Published"
  | "Archived";

export type Priority = "High" | "Medium" | "Low";

export type Category =
  | "Creator & Affiliate Program"
  | "Website Copy"
  | "Website Technical"
  | "Video Production"
  | "SEO & Articles"
  | "Email & Klaviyo"
  | "Claims & Compliance"
  | "Product Assets"
  | "Images & Brand"
  | "Amazon"
  | "Team Operations";

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  initials: string;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  resolved?: boolean;
}

export interface Activity {
  id: string;
  actorId: string;
  verb: string;
  at: string;
}

export interface Asset {
  id: string;
  title: string;
  description: string;
  category: Category;
  ownerId: string;
  assigneeId?: string;
  status: Status;
  priority: Priority;
  version: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  approvedById?: string;
  approvedAt?: string;
  produces: string;
  nextAction: string;
  attachment?: { kind: "pdf" | "md" | "xlsx" | "docx" | "image" | "video" | "zip" | "url"; label: string };
  comments: Comment[];
  activity: Activity[];
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  priority: Priority;
  status: "Not Started" | "In Progress" | "Waiting" | "Blocked" | "Done";
  dueAt?: string;
  relatedAssetId?: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: "Open" | "Proposed" | "Decided";
  proposal?: string;
}

export type OutreachStatus =
  | "Not Contacted"
  | "Contacted"
  | "Follow-up 1"
  | "Follow-up 2"
  | "Interested"
  | "Terms Pending"
  | "Approved"
  | "Sample Shipped"
  | "Content Pending"
  | "Content Received"
  | "Posted"
  | "Strong Performer"
  | "Do Not Renew";

export type ReviewDecision = "Researching" | "Hold" | "Approved for Rena" | "Rejected";

export interface Lead {
  id: string;
  priority: Priority;
  creator: string;
  handle: string;
  platforms: string[];
  profileUrl: string;
  niche: string;
  whyFit: string;
  contactRoute: string;
  postToMention: string;
  angle: string;
  suggestedConcept: string;
  verification: string;
  reviewDecision: ReviewDecision;
  outreach: OutreachStatus;
  renaNotes?: string;
  sampleStatus?: string;
  affiliateLink?: string;
  discountCode?: string;
  contentDeadline?: string;
  contentReceived?: boolean;
  postUrl?: string;
  views?: number;
  clicks?: number;
  orders?: number;
  revenue?: number;
  reuseRights?: string;
  nextAction: string;
}

// ---- Users ----
export const users: User[] = [
  { id: "seth", name: "Seth", role: "Owner", title: "Owner / Admin", initials: "SE" },
  { id: "perry", name: "Perry", role: "Boss", title: "Boss / Approver", initials: "PE" },
  { id: "rena", name: "Rena", role: "Coordinator", title: "Influencer Coordinator", initials: "RE" },
  { id: "tuan", name: "Tuan", role: "Technical", title: "Technical Implementation", initials: "TU" },
  { id: "hoang", name: "Hoang", role: "Team", title: "Responsibilities pending confirmation", initials: "HO" },
];

export const currentUser = users[0]; // Seth

export const userById = (id: string) => users.find((u) => u.id === id);

// ---- Assets (seed) ----
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();

export const assets: Asset[] = [
  {
    id: "a1",
    title: "Survival Tabs UGC Creator Kit v1.0",
    description:
      "Complete brief packet for UGC creators: brand voice, do/don't list, hook prompts, product-in-hand shot list, and delivery specs.",
    category: "Creator & Affiliate Program",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "High",
    version: "1.0",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    dueAt: daysAhead(2),
    produces: "Ready-to-send PDF for approved creators, plus internal reference for Rena's outreach.",
    nextAction: "Perry to review tone, claims, and delivery expectations.",
    attachment: { kind: "pdf", label: "UGC-Creator-Kit-v1.pdf" },
    comments: [
      {
        id: "c1",
        authorId: "seth",
        body: "First pass — leaning on food-security angle, not disaster. Flag anything that feels off-brand.",
        createdAt: daysAgo(1),
      },
    ],
    activity: [
      { id: "ac1", actorId: "seth", verb: "created asset", at: daysAgo(3) },
      { id: "ac2", actorId: "seth", verb: "submitted for review", at: daysAgo(1) },
    ],
  },
  {
    id: "a2",
    title: "Survival Tabs Creator Brief v1.0",
    description: "Short-form brief given to each approved creator with talking points and required disclosures.",
    category: "Creator & Affiliate Program",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "High",
    version: "1.0",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    dueAt: daysAhead(2),
    produces: "One-page brief attached to every outreach message.",
    nextAction: "Perry to confirm required disclosures and commission language.",
    attachment: { kind: "docx", label: "Creator-Brief-v1.docx" },
    comments: [],
    activity: [{ id: "ac3", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
  {
    id: "a3",
    title: "Survival Tabs Accelerated Affiliate and Creator Campaign v1.0",
    description:
      "90-day plan: sample allocation, commission structure, discount code strategy, attribution window, and weekly targets.",
    category: "Creator & Affiliate Program",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "High",
    version: "1.0",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    dueAt: daysAhead(2),
    produces: "The governing plan Rena and Tuan execute against.",
    nextAction: "Perry to lock sample count, commission %, and discount %.",
    attachment: { kind: "md", label: "Accelerated-Campaign-v1.md" },
    comments: [],
    activity: [{ id: "ac4", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
  {
    id: "a4",
    title: "Survival Tabs Influencer Leads v1.0",
    description: "Initial researched list of 24 creator prospects with fit rationale, contact route, and suggested angle.",
    category: "Creator & Affiliate Program",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "High",
    version: "1.0",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    produces: "Approved leads flow into Rena's outreach queue.",
    nextAction: "Perry to approve the first five leads.",
    attachment: { kind: "xlsx", label: "Influencer-Leads-v1.xlsx" },
    comments: [],
    activity: [{ id: "ac5", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
  {
    id: "a5",
    title: "Survival Tabs Approved Claims and Product Fact Sheet v1.0",
    description:
      "Compliance-safe list of claims we can make about nutrition, shelf life, and use cases. Reference for all copy and creator content.",
    category: "Claims & Compliance",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "High",
    version: "1.0",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    produces: "The single source of truth for what we say about the product.",
    nextAction: "Perry to review claims language line-by-line.",
    attachment: { kind: "pdf", label: "Approved-Claims-Fact-Sheet-v1.pdf" },
    comments: [],
    activity: [{ id: "ac6", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
  {
    id: "a6",
    title: "Survival Tabs Homepage Copy Package v1.0",
    description: "Full homepage rewrite: hero, three benefit blocks, social proof band, FAQ, and CTA.",
    category: "Website Copy",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "High",
    version: "1.0",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    produces: "Copy handed to Tuan for staging.",
    nextAction: "Perry to review headline and benefit framing.",
    attachment: { kind: "md", label: "Homepage-Copy-v1.md" },
    comments: [],
    activity: [{ id: "ac7", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
  {
    id: "a7",
    title: "Survival Tabs Homepage Video Package v1.0",
    description: "Storyboard + script + shot list for the 45-second hero video. Voiceover draft included.",
    category: "Video Production",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "Medium",
    version: "1.0",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    produces: "Production-ready package for the hero video.",
    nextAction: "Perry to approve script and pacing.",
    attachment: { kind: "pdf", label: "Homepage-Video-Package-v1.pdf" },
    comments: [],
    activity: [{ id: "ac8", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
  {
    id: "a8",
    title: "Survival Tabs 72-Hour Emergency Kit Lead Magnet Package v1.0",
    description: "Downloadable checklist + welcome email sequence + Klaviyo flow spec.",
    category: "Email & Klaviyo",
    ownerId: "seth",
    assigneeId: "perry",
    status: "Ready for Boss Review",
    priority: "Medium",
    version: "1.0",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    produces: "Lead magnet + 5-email nurture, ready for Tuan to build in Klaviyo.",
    nextAction: "Perry to review the checklist claims and welcome sequence tone.",
    attachment: { kind: "zip", label: "Lead-Magnet-Package-v1.zip" },
    comments: [],
    activity: [{ id: "ac9", actorId: "seth", verb: "submitted for review", at: daysAgo(1) }],
  },
];

// ---- Tasks ----
export const tasks: Task[] = [
  { id: "t1", title: "Approve first five creator leads", assigneeId: "seth", priority: "High", status: "Not Started" },
  { id: "t2", title: "Send review package to Perry", assigneeId: "seth", priority: "High", status: "In Progress" },
  { id: "t3", title: "Review lead and outreach workflow", assigneeId: "rena", priority: "High", status: "Waiting" },
  { id: "t4", title: "Confirm Shopify Collabs and tracking", assigneeId: "tuan", priority: "High", status: "Not Started" },
  {
    id: "t5",
    title: "Approve samples, commission, discount, and UGC budget",
    assigneeId: "perry",
    priority: "High",
    status: "Not Started",
  },
  { id: "t6", title: "Confirm role", assigneeId: "hoang", priority: "Medium", status: "Waiting" },
];

// ---- Decisions ----
export const decisions: Decision[] = [
  {
    id: "d1",
    title: "Maximum samples for initial test",
    description: "How many free product units we ship to creators during the accelerated campaign.",
    owner: "Perry",
    status: "Open",
    proposal: "Seth proposes 30.",
  },
  {
    id: "d2",
    title: "Shipping markets",
    description: "Which countries we ship samples and fulfill orders to during phase 1.",
    owner: "Perry",
    status: "Open",
    proposal: "US + Canada only for phase 1.",
  },
  {
    id: "d3",
    title: "Customer discount",
    description: "Discount percentage baked into creator codes.",
    owner: "Perry",
    status: "Open",
    proposal: "15% off, minimum $50 order.",
  },
  {
    id: "d4",
    title: "Creator commission",
    description: "Commission % on tracked sales.",
    owner: "Perry",
    status: "Open",
    proposal: "20% first order, 10% recurring.",
  },
  {
    id: "d5",
    title: "Affiliate attribution period",
    description: "Cookie / attribution window for creator links.",
    owner: "Perry",
    status: "Open",
    proposal: "30 days.",
  },
  {
    id: "d6",
    title: "Paid UGC budget",
    description: "Total spend for paid UGC content in the first 60 days.",
    owner: "Perry",
    status: "Open",
    proposal: "$4,000 cap.",
  },
  {
    id: "d7",
    title: "Organic reuse-rights period",
    description: "How long we can reuse a creator's organic post on our channels.",
    owner: "Perry",
    status: "Open",
    proposal: "90 days.",
  },
  {
    id: "d8",
    title: "Paid-advertising rights budget",
    description: "Budget to acquire paid-ad usage rights on top-performing posts.",
    owner: "Perry",
    status: "Open",
    proposal: "$2,500 cap.",
  },
  {
    id: "d9",
    title: "Amazon listings included",
    description: "Which Amazon ASINs creators are allowed to link to.",
    owner: "Perry",
    status: "Open",
    proposal: "12-tab and 24-tab primary listings only.",
  },
  {
    id: "d10",
    title: "Hoang's final role",
    description: "Confirm scope so Hoang can be onboarded properly.",
    owner: "Seth",
    status: "Open",
  },
];

// ---- Leads ----
export const leads: Lead[] = [
  {
    id: "l1",
    priority: "High",
    creator: "Amelia Frost",
    handle: "@ameliapreps",
    platforms: ["Instagram", "TikTok"],
    profileUrl: "https://instagram.com/ameliapreps",
    niche: "Household preparedness, family-first",
    whyFit: "Practical, non-fear framing. Kids-in-frame content overlaps with our food-security angle.",
    contactRoute: "Public business email in bio",
    postToMention: "Pantry tour reel (2.1M views)",
    angle: "72-hour kit fits in a shoebox — real food, real shelf life.",
    suggestedConcept: "Unbox + taste-test with her two kids, honest reaction.",
    verification: "Business verified, US-based, kid-safe content only.",
    reviewDecision: "Researching",
    outreach: "Not Contacted",
    nextAction: "Awaiting Perry approval.",
  },
  {
    id: "l2",
    priority: "High",
    creator: "Marcus Kane",
    handle: "@kane.outdoors",
    platforms: ["YouTube", "Instagram"],
    profileUrl: "https://youtube.com/@kane.outdoors",
    niche: "Backcountry, ultralight backpacking",
    whyFit: "Weight-per-calorie is his exact framing already.",
    contactRoute: "Manager email in About tab",
    postToMention: "Sub-8-lb base weight video",
    angle: "Calorie density for multi-day trips without cooking.",
    suggestedConcept: "3-day solo trip fueled entirely by Survival Tabs.",
    verification: "Real audience, engagement rate 6.4%.",
    reviewDecision: "Researching",
    outreach: "Not Contacted",
    nextAction: "Awaiting Perry approval.",
  },
  {
    id: "l3",
    priority: "High",
    creator: "Dr. Priya Shah",
    handle: "@drpriyareviews",
    platforms: ["Instagram", "YouTube"],
    profileUrl: "https://instagram.com/drpriyareviews",
    niche: "Registered dietitian, honest reviews",
    whyFit: "RD credibility — perfect for the nutrition claim story.",
    contactRoute: "Talent agency (public)",
    postToMention: "Emergency food comparison series",
    angle: "Dietitian breaks down what's actually in a tab.",
    suggestedConcept: "Nutrition label deep-dive vs. common emergency foods.",
    verification: "Verified RD credentials.",
    reviewDecision: "Researching",
    outreach: "Not Contacted",
    nextAction: "Awaiting Perry approval.",
  },
  {
    id: "l4",
    priority: "Medium",
    creator: "Jenna & Cole Rowe",
    handle: "@therowehomestead",
    platforms: ["Instagram", "TikTok"],
    profileUrl: "https://instagram.com/therowehomestead",
    niche: "Modern homesteading, pantry stocking",
    whyFit: "Pantry-stocking content, calm tone. No prepper aesthetic.",
    contactRoute: "Public email",
    postToMention: "Deep pantry rotation reel",
    angle: "The last shelf of the pantry — long shelf life without a bunker vibe.",
    suggestedConcept: "Pantry integration + 12-month check-in.",
    verification: "Legit homestead, verifiable location.",
    reviewDecision: "Researching",
    outreach: "Not Contacted",
    nextAction: "Awaiting Perry approval.",
  },
  {
    id: "l5",
    priority: "Medium",
    creator: "Sam Ortiz",
    handle: "@sam.overlands",
    platforms: ["YouTube", "Instagram"],
    profileUrl: "https://youtube.com/@sam.overlands",
    niche: "Overlanding, vehicle-based travel",
    whyFit: "Compact, no-cook food is a real problem he talks about.",
    contactRoute: "Public business email",
    postToMention: "10-day Baja run food loadout",
    angle: "The one thing that never left the truck.",
    suggestedConcept: "Loadout video featuring tabs alongside his existing kit.",
    verification: "Real vehicle, real trips, clean history.",
    reviewDecision: "Researching",
    outreach: "Not Contacted",
    nextAction: "Awaiting Perry approval.",
  },
];

// ---- Helpers ----
export const STATUS_ORDER: Status[] = [
  "Draft",
  "Ready for Boss Review",
  "Changes Requested",
  "Boss Approved",
  "Sent to Team",
  "In Production",
  "Published",
  "Archived",
];

export const statusTone: Record<Status, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Ready for Boss Review": "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/40",
  "Changes Requested": "bg-destructive/10 text-destructive border-destructive/30",
  "Boss Approved": "bg-[color:var(--olive)]/20 text-[color:var(--forest)] border-[color:var(--olive)]/40",
  "Sent to Team": "bg-secondary text-secondary-foreground",
  "In Production": "bg-accent text-accent-foreground",
  Published: "bg-primary text-primary-foreground",
  Archived: "bg-muted text-muted-foreground",
};

export const priorityTone: Record<Priority, string> = {
  High: "text-destructive",
  Medium: "text-[color:var(--gold)]",
  Low: "text-muted-foreground",
};
