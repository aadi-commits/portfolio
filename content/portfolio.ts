/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  🧑‍💻  ADIT NAVLE — PORTFOLIO SINGLE SOURCE OF TRUTH                        │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Everything the site + AI chat shows lives in THIS file.                  │
 * │  Prefilled from your résumé. Search "TODO" for the few things only you    │
 * │  can confirm (notice period, work authorization, deploy URL, OG image).   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

/* -------------------------------------------------------------------------- */
/*  1. IDENTITY / HERO                                                         */
/* -------------------------------------------------------------------------- */

export const identity = {
  name: "Adit Navle",

  tagline: "Full-Stack & Mobile Engineer · Node.js · Angular · React Native · AI/LLM",

  // Includes the Nov 2024 internship through your current role. Adjust freely.
  yearsOfExperience: 2,

  headline:
    "I build production apps end-to-end — frontend, backend, and the Android release pipeline. I shipped a healthcare app to the Play Store, cut load times 60%, and built a production RAG pipeline.",

  // Toggle the animated "Open to work" badge in the hero.
  openToWork: true,

  location: "Mumbai, India · Open to relocate / remote",

  links: {
    email: "aditnavle@gmail.com",
    github: "https://github.com/aadi-commits",
    linkedin: "https://linkedin.com/in/adit-navle-561872280",
    // TODO: Drop your résumé PDF in /public/resume.pdf (filename must match).
    resume: "/resume.pdf",
    website: "", // optional
  },
};

/* -------------------------------------------------------------------------- */
/*  2. ABOUT — the 3–4 line story                                             */
/* -------------------------------------------------------------------------- */

export const about = {
  // Drafted from your résumé — tweak the voice to sound like you.
  story: [
    "I'm a full-stack and mobile engineer in Mumbai who likes owning features end-to-end — frontend, backend, and everything up to the Android release on Google Play.",
    "In the last year and a half I shipped 911Care (a telehealth app with video consults and push notifications) to the Play Store, redesigned an Angular bundle pipeline to cut production load times by 60%, and built a production RAG pipeline with pgvector for context-aware LLM answers.",
    "I care about performance, clean architecture (SOLID, RBAC, sensible APIs), and shipping things real users actually depend on.",
  ],

  focusAreas: [
    "Full-stack (Node.js / Angular)",
    "React Native & mobile",
    "AI / LLM & RAG",
    "Performance optimization",
    "REST API design",
    "Android release pipeline",
  ],
};

/* -------------------------------------------------------------------------- */
/*  3. EXPERIENCE TIMELINE                                                     */
/* -------------------------------------------------------------------------- */

export type ExperienceItem = {
  role: string;
  company: string;
  period: string; // e.g. "2022 — Present"
  location?: string;
  summary: string;
  highlights: string[]; // bullet achievements, ideally with metrics
  stack: string[];
};

export const experience: ExperienceItem[] = [
  {
    role: "Software Developer — Full Stack & Mobile",
    company: "Onelife Capital Advisors Ltd.",
    period: "May 2025 — Present",
    location: "Mumbai, India",
    summary:
      "Deliver production features end-to-end across web and mobile for a multi-product company (healthcare, automotive, CRM).",
    highlights: [
      "Redesigned the Angular bundle pipeline with lazy loading and eliminated redundant API calls, cutting production load times by 60%.",
      "Shipped 911Care (Ionic Angular + Capacitor): booking, Zoom video consults, FCM push with 15-min reminders, and consultation history.",
      "Owned the full Android release pipeline — Gradle builds, signed AAB/APK, manifest permissions, and Google Play deployment from test track to production.",
      "Eliminated N+1 DB calls and optimized MongoDB indexes and payload contracts, reducing latency on high-traffic Node.js/Express endpoints.",
      "Built a backend service that generates PDF invoices and delivers them via WhatsApp for post-purchase order notifications.",
      "Built a cross-product analytics API aggregating user activity to surface subscription/purchase data for targeted lead outreach.",
      "Leading the migration of 911Care from Ionic Angular to React Native using Claude agentic AI tooling in VS Code, maintaining feature parity.",
    ],
    stack: ["Node.js", "Express", "Angular", "Ionic", "Capacitor", "React Native", "MongoDB", "Zoom SDK", "FCM"],
  },
  {
    role: "MEAN Stack Developer Intern — Full Stack",
    company: "Onelife Capital Advisors Ltd.",
    period: "Nov 2024 — May 2025",
    location: "Mumbai, India",
    summary:
      "Built and hardened full-stack features across the healthcare product's web platform.",
    highlights: [
      "Embedded a third-party AI API mid-booking, parsed structured medical responses, and rendered contextual precaution guidance in the Angular UI.",
      "Designed and implemented Express.js REST APIs with middleware, validation, and structured responses.",
      "Resolved critical and regression bugs across the Angular web platform, reducing user-facing errors in key product flows.",
    ],
    stack: ["MongoDB", "Express", "Angular", "Node.js", "TypeScript"],
  },
];

/* -------------------------------------------------------------------------- */
/*  4. PROJECTS — case-study cards (problem → architecture → hardest → outcome)*/
/* -------------------------------------------------------------------------- */

export type Project = {
  slug: string;
  title: string;
  blurb: string; // one-liner shown on the card header
  tags: string[];
  problem: string;
  architecture: string[]; // steps/nodes rendered as a mini diagram
  hardestPart: string;
  outcome: string;
  links?: { label: string; href: string }[];
  // Marks the project whose live demo is embedded on the page.
  hasLiveDemo?: boolean;
  // Marks a card as a concept/learning demo rather than a shipped client project.
  isConceptDemo?: boolean;
};

export const projects: Project[] = [
  {
    slug: "911care-telehealth",
    title: "911Care — Telehealth App (Google Play)",
    blurb:
      "End-to-end patient consultation app: symptom-led booking, live doctor queue, video consults, and push updates — shipped to the Play Store.",
    tags: ["Ionic", "Angular", "Capacitor", "Zoom SDK", "FCM", "Node.js"],
    problem:
      "Patients needed a fast way to reach a doctor for both scheduled and emergency consultations, with clear real-time status the whole way through — not a black box between booking and the call.",
    architecture: [
      "Ionic/Angular app",
      "Node/Express API",
      "Live consult queue",
      "Zoom Video SDK",
      "FCM push",
      "Post-order summary",
    ],
    hardestPart:
      "Coordinating the live consultation queue: a patient books (or raises an emergency), an RMO assigns a doctor, and the patient is kept updated by push notification through every step — from doctor assignment to the doctor joining the call.",
    outcome:
      "Shipped to Google Play. Patients get symptom-led booking, emergency or scheduled consults with 15-min reminders, live video, and a post-consultation summary of notes, medicines, and lab tests.",
    hasLiveDemo: true,
  },
  {
    slug: "ai-customer-support-rag",
    title: "AI Customer Support Agent (RAG)",
    blurb:
      "Context-aware LLM answers grounded in your own documents via pgvector semantic search.",
    tags: ["Node.js", "PostgreSQL", "pgvector", "Prisma", "RAG", "Angular"],
    problem:
      "LLMs hallucinate when they lack domain knowledge; a support assistant has to answer from the company's real documents, not guesses.",
    architecture: [
      "Documents",
      "Chunk + embed",
      "pgvector store",
      "Semantic search (top-k)",
      "LLM",
      "Angular UI",
    ],
    hardestPart:
      "Building the retrieval pipeline: chunking and embedding documents, running vector-similarity search in pgvector, and assembling just the right context so the LLM answers accurately and stays grounded.",
    outcome:
      "A full-stack RAG assistant (Node.js + Prisma backend, Angular frontend) that retrieves semantically relevant document chunks to produce context-aware answers.",
    hasLiveDemo: true,
    links: [
      // { label: "GitHub", href: "https://github.com/aadi-commits/..." }, // TODO optional
    ],
  },
  {
    slug: "donor-management",
    title: "Donor Management System",
    blurb:
      "Donor-lifecycle backend with multi-stage approval workflows and role-based access.",
    tags: ["Java", "Spring Boot", "PostgreSQL", "Spring Security", "RBAC", "JPA"],
    problem:
      "Managing a donor lifecycle with approvals across different roles needs strict access control and a clean, maintainable structure that won't rot as rules grow.",
    architecture: [
      "Spring Boot API",
      "Spring Security (RBAC)",
      "Approval workflow",
      "JPA / Hibernate",
      "PostgreSQL",
    ],
    hardestPart:
      "Modeling multi-stage approval workflows with role-based access control in a layered architecture that follows SOLID principles.",
    outcome:
      "A full donor-lifecycle backend with role-gated, multi-stage approvals and a clean layered architecture.",
    hasLiveDemo: true,
  },
  {
    slug: "d-duty",
    title: "D-Duty — Duty Management System",
    blurb:
      "Real-time duty assignment and scheduling that replaced manual shift management.",
    tags: ["MongoDB", "Express", "Angular", "Node.js", "Real-time"],
    problem:
      "Shift and duty allocation was managed manually, which was slow, error-prone, and hard to keep everyone in sync on.",
    architecture: [
      "Angular UI",
      "Express API",
      "Real-time notifications",
      "MongoDB",
    ],
    hardestPart:
      "Turning an ad-hoc manual process into digital task allocation with real-time notifications so assignments reach people instantly.",
    outcome:
      "A MEAN-stack duty management system with digital scheduling and real-time updates replacing manual shift tracking.",
  },
];

/* -------------------------------------------------------------------------- */
/*  5. AI CHAT — the context the "Ask my portfolio" assistant answers from.    */
/*     No RAG: this whole block is injected into the system prompt.            */
/*     Keep it factual and first-person. This is what recruiters effectively   */
/*     "talk to", so make it complete.                                         */
/* -------------------------------------------------------------------------- */

export const aiContext = {
  resumeText: `
Name: Adit Navle
Role: Full-Stack & Mobile Engineer (Node.js, Angular, React Native, AI/LLM integrations)
Based in: Mumbai, India
Contact: aditnavle@gmail.com · github.com/aadi-commits · linkedin.com/in/adit-navle-561872280
Education: B.Sc Computer Science, University of Mumbai (2024), CGPA 8.5/10.

Summary:
Full-stack engineer who delivers production apps end-to-end — frontend, backend, and mobile — with a
track record across healthcare, automotive, CRM, and AI-powered products. Comfortable owning a feature
from the first API to the signed Android build on Google Play.

Experience — Onelife Capital Advisors Ltd., Mumbai:
- Software Developer (Full Stack & Mobile), May 2025 – Present.
- MEAN Stack Developer Intern (Full Stack), Nov 2024 – May 2025.

Key accomplishments:
- Cut production frontend load times by 60% by redesigning the Angular bundle pipeline (lazy loading,
  code-splitting) and eliminating redundant API calls.
- Shipped 911Care, a telehealth app, to Google Play: built the end-to-end patient journey in Ionic
  Angular + Capacitor — symptom-led booking, a live consultation queue, Zoom Video SDK consults, FCM
  push notifications with 15-minute appointment reminders, and consultation history.
- Owned the full Android release pipeline: Gradle builds, signed AAB/APK, AndroidManifest permissions,
  and Google Play Console deployment from test track to production.
- Eliminated N+1 database calls and optimized MongoDB indexes and payload contracts to reduce latency
  on high-traffic Node.js/Express endpoints.
- Built a backend service generating PDF invoices and delivering them via WhatsApp for post-purchase
  order notifications.
- Built a cross-product analytics API aggregating user activity across products to surface subscription
  and purchase data for targeted lead outreach and upsells.
- Currently leading the migration of 911Care from Ionic Angular to React Native using Claude agentic AI
  tooling in VS Code, maintaining feature parity.
- (Internship) Embedded a third-party AI API mid-booking, parsed structured medical responses, and
  rendered contextual precaution guidance in the Angular UI; built Express.js REST APIs; fixed critical
  and regression bugs across the Angular web platform.

Projects:
- AI Customer Support Agent (Node.js, Angular, PostgreSQL, pgvector, Prisma, RAG): a RAG pipeline with
  document embeddings in pgvector for semantic search and context-aware LLM responses.
- Donor Management System (Java, Spring Boot, PostgreSQL, JPA/Hibernate, Spring Security): full donor
  lifecycle backend with multi-stage approval workflows, RBAC, and layered SOLID architecture.
- D-Duty — Duty Management System (MEAN): real-time duty assignment and scheduling replacing manual
  shift management.

AI / LLM experience:
Production RAG pipeline with pgvector (chunking, embeddings, vector/semantic search, context assembly),
LLM API integration, and an AI symptom assistant embedded in a live booking flow. Also uses Claude
agentic AI tooling for a real code migration.

Technical skills:
- Backend: Node.js, Express.js, Java Spring Boot, REST APIs, Prisma ORM, JWT, OAuth, Spring Security,
  RBAC, middleware, microservices.
- Frontend & Mobile: Angular, React, Ionic, React Native, Capacitor, TypeScript, JavaScript, Zoom Video
  SDK, FCM push notifications, WebSockets.
- Databases & AI: MongoDB, PostgreSQL, MySQL, Redis, pgvector, RAG, vector search, LLM API integration.
- DevOps & tools: Git, GitHub Actions, Docker, Gradle, Google Play Console, Postman, Swagger, Agile/
  Scrum, Jira, Render, Netlify.
- Testing: Jest, unit and integration testing.  Cloud: AWS (basic), CI/CD pipelines.
`.trim(),

  logistics: {
    noticePeriod: "TODO: e.g. 30 days (or 'immediate')",
    location: "Mumbai, India — open to relocation and remote roles",
    workAuthorization: "TODO: e.g. Indian citizen; specify visa needs for roles abroad",
    availability: "Open to full-time full-stack / mobile / AI-integration roles",
    preferredRoles: "Full-stack (Node.js/Angular), React Native mobile, or AI/LLM product engineering",
  },

  // Suggested question chips shown under the chat input.
  suggestedPrompts: [
    "Tell me about the 911Care app you shipped",
    "What's your experience with AI and RAG?",
    "How did you cut load times by 60%?",
    "What's your mobile / Android release experience?",
    "Where are you based and are you open to work?",
  ],
};

/* -------------------------------------------------------------------------- */
/*  6. SITE META (SEO)                                                         */
/* -------------------------------------------------------------------------- */

export const siteMeta = {
  title: "Adit Navle — Full-Stack & Mobile Engineer",
  description:
    "Adit Navle — full-stack & mobile engineer (Node.js, Angular, React Native, AI/LLM). Shipped a telehealth app to Google Play, cut load times 60%, built a production RAG pipeline. Explore live demos and ask my portfolio anything.",
  // TODO: Production URL once deployed (for canonical + OG). No trailing slash.
  url: "https://your-domain.com",
  // TODO: Optional social preview image in /public (1200×630).
  ogImage: "/og.png",
  // TODO: Your X/Twitter handle for card attribution (or leave "").
  twitter: "",
};

/* -------------------------------------------------------------------------- */
/*  Convenience aggregate (imported by the AI route + a few components).       */
/* -------------------------------------------------------------------------- */

export const portfolio = {
  identity,
  about,
  experience,
  projects,
  aiContext,
  siteMeta,
};

export default portfolio;
