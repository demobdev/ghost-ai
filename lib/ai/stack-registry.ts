/**
 * Based on the TrueGraph Stack Picks (Feb 2026).
 */

export interface StackTool {
  name: string;
  dominance: number; // Percentage from research
  rationale: string; // The "Why"
  context: string; // When to stick with the alternative
  migrationDifficulty: "low" | "medium" | "high";
}

export interface StackCategory {
  category: string;
  defaultPick: StackTool;
  alternatives?: string[];
}

export const STACK_REGISTRY: Record<string, StackCategory> = {
  "CI/CD": {
    category: "CI/CD",
    defaultPick: {
      name: "GitHub Actions",
      dominance: 94,
      rationale: "Seamless integration with GitHub, massive ecosystem of actions, and zero-config for most stacks.",
      context: "Stick with GitLab CI or Jenkins if you are already on those platforms or require air-gapped/on-prem runners.",
      migrationDifficulty: "medium",
    },
  },
  "Payments": {
    category: "Payments",
    defaultPick: {
      name: "Stripe",
      dominance: 91,
      rationale: "Gold standard API, exceptional developer experience, and support for almost every global payment method.",
      context: "Consider Paddle or LemonSqueezy if you need a Merchant of Record (MoR) to handle global sales tax automatically.",
      migrationDifficulty: "high",
    },
  },
  "UI Components": {
    category: "UI Components",
    defaultPick: {
      name: "shadcn/ui",
      dominance: 90,
      rationale: "Not a library, but a collection of reusable components you own. Highly customizable and built on Radix UI primitives.",
      context: "Use Material UI or Mantine if you need a massive library of pre-styled components and don't want to manage component code locally.",
      migrationDifficulty: "medium",
    },
  },
  "ORM": {
    category: "ORM (Next.js)",
    defaultPick: {
      name: "Drizzle ORM",
      dominance: 100, // For Opus 4.6
      rationale: "Headless, lightweight, and 'TypeScript-first'. Zero-overhead and perfect for Edge functions/Serverless.",
      context: "Stick with Prisma if you prefer a visual schema language (PSL), robust migrations, and don't mind the heavier 'Prisma Engine' overhead.",
      migrationDifficulty: "high",
    },
  },
  "State Management": {
    category: "State Management",
    defaultPick: {
      name: "Zustand",
      dominance: 65,
      rationale: "Bare minimum boilerplate, hooks-based, and extremely lightweight. The perfect middle ground between React Context and Redux.",
      context: "Use Redux Toolkit if you are building a massive enterprise app with complex side effects and debugging requirements.",
      migrationDifficulty: "low",
    },
  },
  "Authentication": {
    category: "Authentication (Next.js)",
    defaultPick: {
      name: "NextAuth.js (Auth.js)",
      dominance: 91,
      rationale: "Framework-native, supports 50+ providers, and integrates perfectly with Next.js middleware and SSR.",
      context: "Use Clerk or Supabase Auth if you want a managed service that handles user management, emails, and MFA out-of-the-box.",
      migrationDifficulty: "medium",
    },
  },
  "Background Jobs": {
    category: "Background Jobs",
    defaultPick: {
      name: "Inngest",
      dominance: 50,
      rationale: "Event-driven, serverless-ready, and supports complex workflows (fan-out, sleep, wait for event) without managing infrastructure.",
      context: "Use BullMQ if you are already running Redis and need high-throughput, low-latency queue processing in a long-lived server environment.",
      migrationDifficulty: "medium",
    },
  },
  "Email": {
    category: "Email",
    defaultPick: {
      name: "Resend",
      dominance: 63,
      rationale: "Modern API, beautiful React-based templates (React Email), and exceptional delivery rates for developers.",
      context: "Stick with SendGrid or Postmark if you have massive volume requirements or deep integration with legacy marketing automation.",
      migrationDifficulty: "low",
    },
  },
  "Observability": {
    category: "Observability",
    defaultPick: {
      name: "Sentry",
      dominance: 63,
      rationale: "Comprehensive error tracking, performance monitoring, and session replays with minimal setup.",
      context: "Use Datadog or New Relic for full-stack enterprise observability including infra monitoring and log aggregation.",
      migrationDifficulty: "low",
    },
  },
};

export function getFormattedStackRegistry(): string {
  return Object.values(STACK_REGISTRY)
    .map((cat) => {
      const p = cat.defaultPick;
      return `### ${cat.category}\n- **Recommended**: ${p.name}\n- **Why**: ${p.rationale}\n- **Context**: ${p.context}`;
    })
    .join("\n\n");
}
