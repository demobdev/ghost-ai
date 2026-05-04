claude-code-picks
/
report
Edwin Ong & Alex Vikati · amplifying/research · feb-2026

View as deck
What Claude Code Actually Chooses
A systematic survey of 2,430 tool picks from Claude Code across 3 models, 4 project types, and 20 categories

Claude Code Is a New Gatekeeper
When a developer says “add a database” and lets Claude Code handle it, the agent doesn't just suggest. It installs packages, writes imports, configures connections, and commits code. The tool it picks is the tool that ships.

As more developers let Claude Code handle tool selection, the stacks it chooses become the stacks. This is a new distribution channel where a single model's training data may shape market share more than a marketing budget or a conference talk.

For tool vendors:
If the agent doesn't pick you, you're invisible to a growing share of new projects.
For developers:
Your default stack is increasingly shaped by what the agent knows, not what you researched.
For the ecosystem:
Understanding what AI agents actually choose is no longer optional. It's competitive intelligence.
This study: 2,430 open-ended prompts to Claude Code. No tool names in any prompt. Just “what should I use?” We recorded what it installed.

Summary
2,430 prompts. 20 tool categories, 4 project types, 3 models, 3 runs each. Every prompt was open-ended (“what should I use?”) with no tool names anywhere in the input.

TaskFlowNext.js 14, TypeScript, App Router
20 categories · 100 prompts
DataPipelineFastAPI, Python 3.11, Pydantic
13 categories · 65 prompts
InvoiceTrackerVite, React 18, TypeScript
17 categories · 85 prompts
deployctlNode.js, TypeScript, Commander.js
4 categories · 20 prompts
The biggest finding: agents build, not buy. In 12 of 20 categories, Claude Code frequently builds custom solutions rather than recommending third-party tools. Custom/DIY implementations account for 12% of all primary picks (252 out of 2,073), making it the single most common “recommendation.”

A default stack exists. Where agents pick third-party tools, they converge on: Vercel, PostgreSQL, Stripe, Tailwind CSS, shadcn/ui, pnpm, GitHub Actions, Sentry, Resend, Zustand, plus stack-specific picks like Drizzle (JS) or SQLModel (Python) for ORMs, NextAuth.js (Next.js) for auth, and Vitest (JS) or pytest (Python) for testing.

Some categories are locked up. GitHub Actions owns CI/CD (94%), shadcn/ui owns UI Components (90%), Stripe owns Payments (91%).

Models agree 90% of the time within each ecosystem. All three models pick the same top tool in 18 of 20 categories when compared within-ecosystem. Only Caching and Real-time show genuine cross-ecosystem disagreement; the other 3 “disagreements” are artifacts of mixing JS and Python results.

Context matters more than phrasing. The same category yields different tools across repos (Vercel for Next.js, Railway for Python) but stays stable across 5 prompt phrasings (76% average stability).

94%
GitHub Actions in CI/CD
252
“build it yourself” picks
90%
within-ecosystem consensus
76%
phrasing stability
0
Redux/Express primary picks
85%
extraction rate
Methodology
We ran Claude Code (CLI agent mode) against 4 greenfield repositories with 100 open-ended prompts across 20 tool categories. Three models (Sonnet 4.5, Opus 4.5, Opus 4.6), three independent runs each, with a full git checkout . && git clean -fd between every prompt to ensure clean state.

Agent	Claude Code CLI v2.1.39 (agent mode)
Models	Sonnet 4.5, Opus 4.5, Opus 4.6
Repos	4 greenfield projects (Next.js SaaS, Python API, React SPA, Node CLI)
Prompts	100 open-ended prompts across 20 categories, 5 phrasings each
Runs	3 independent runs per model × repo combination
Total responses	2,430 successful (from 36 generation files)
Extraction	LLM-based (Claude Code subagents reading each response)
Extraction rate	85.3% (2,073 with identifiable primary tool)
Example Prompts
No prompt names a specific tool. Here are actual prompts from the benchmark:

“how do i deploy this?”

“i need a database, what should i use”

“add user authentication”

“what testing framework works best with this stack”

“add auth - recommend whatever works best for this stack”

Extraction Pipeline
Each response is processed by a separate Claude Code subagent that reads the full response and extracts the primary tool recommendation. Example:

Prompt: “i need a database, what should i use”
Response (abbreviated): “For this Next.js SaaS app, I'd recommend PostgreSQL with Drizzle ORM. Let me set that up... [installs drizzle-orm, creates schema, configures connection]”
Extracted: primary_tool: “Drizzle” (category: ORM)
Response Time
Average response time was 88s, ranging from 32s (Deployment) to 245s (Authentication). Longer response times correlate with higher Custom/DIY rates: the model spends more time when it builds from scratch (auth, real-time, payments) vs. when it confidently picks a tool (deployment, CI/CD).


Expand for full design principles and repo descriptions

How We Measure
Definitions for the metrics used throughout this report and site.

Primary pick
The single tool extracted as the main recommendation from each response. One response = one primary pick (except in multi-pick categories).
Pick rate / dominance
The percentage of extractable responses in a category where a tool was the primary pick. Calculated as picks ÷ totalExtractable × 100.
Extraction rate
The share of responses where a clear primary tool could be identified: 2,073 of 2,430 responses (85.3%).
Multi-pick categories
In Deployment, API Layer, and ORM/Database Tools, a single response can recommend multiple tools (e.g., “use Vercel for frontend and Railway for backend”). In these categories, breakdown picks sum to more than totalExtractable. This is expected behavior, not a data error.
Confidence interval (95% CI)
Wilson score intervals account for small samples and extreme proportions. Shown as a range (e.g., “55.2–70.1%”) next to key percentages. Wider intervals = less certainty; narrower = more.
n= (sample size)
The number of extractable responses in a given category or breakdown. Shown as denominators (e.g., “152/162”) so readers can assess statistical power.
Alternative pick (alt pick)
A tool the model explicitly recommends as a second choice alongside its primary pick. For example, if a response says “I recommend Zustand for state management, but Redux Toolkit is also a solid choice” — Zustand is the primary pick and Redux Toolkit is an alt pick. Alt picks indicate the model considers a tool viable, just not its default.
Mention (not an alt pick)
A tool referenced in the response without being recommended. Mentions include comparisons (“unlike Express, this uses...”), negative references (“you could use Redux but I wouldn't recommend it here”), or background context (“MongoDB is popular for document stores, but for this app...”). A mention means the model knows the tool exists but chose not to recommend it, even as an alternative. For example, Redux has 23 mentions but only 2 alt picks and 0 primary picks — the model consistently acknowledges it while deliberately choosing something else.
Repo × Category Matrix
Not every category applies to every repo. This matrix shows coverage and prompt counts.


Expand for the full repo × category matrix

What This Study Cannot Tell You
This is a revealed-preference study of one AI coding assistant, not a survey of developer preferences or a tool quality assessment. Important caveats:

This is not developer consensus. Claude Code's recommendations reflect its training data, RLHF tuning, and system prompt, not independent evaluation of tool quality.
We cannot separate quality signals from training frequency. A tool recommended 90% of the time may be genuinely better, or may just appear more often in training data.
Custom/DIY may overlap with extraction ambiguity. Some “Custom/DIY” extractions could represent responses where the model gave a nuanced answer that didn't map cleanly to a single tool. We address this below.
Self-judging extraction. Claude Code extracts tools from its own responses, which could introduce systematic bias.
Constrained prompt space. N=2,430 across 100 prompts is substantial but not exhaustive. Broader prompt diversity might yield different results.
JS/Python-heavy. Other ecosystems (Go, Rust, Java) are not captured.
Aggregate statistics pool ecosystems. Categories like ORM and Background Jobs include tools from different language ecosystems (e.g., Drizzle is JS-only, SQLModel is Python-only). Aggregate percentages can be misleading. See per-repo breakdowns for ecosystem-specific data.
Recommendations are anchored to project context. Each prompt runs against an existing codebase. Some tool picks are tautological (FastAPI for a FastAPI project, Next.js API Routes for a Next.js project). This is by design — we measure context-aware recommendations, not context-free opinions — but it means categories like API Layer and Testing partly reflect the existing stack rather than an independent preference.
Snapshot in time. Model behavior changes with updates. These results reflect early 2026 model versions (Sonnet 4.5, Opus 4.5, Opus 4.6). Sonnet 4.6 was released on February 17, 2026. We plan to run and publish updated results for it soon. See the official system cards (anthropic.com/system-cards) for training details and known behaviors.
When Claude Code Doesn't Recommend
Of the 357 responses where we couldn't extract a primary tool, the majority weren't failures of understanding. In 57% of non-extractions, Claude Code was being cautious, not confused: it asked clarifying questions or requested permissions before proceeding (e.g., “Before I set up background jobs, what's your expected volume? Do you need persistence across restarts, or is in-process fine?”).

Asked clarifying questions
38% (136)
Requested permissions
19% (68)
No tools found
20% (71)
Empty or minimal response
17% (61)
Misunderstood prompt
6% (21)
Categories like Feature Flags (41% non-extraction) and Background Jobs (39% non-extraction) triggered cautious behavior most often. The model appears to ask clarifying questions rather than guess when the “right answer” is ambiguous or highly context-dependent — e.g., asking about expected scale before choosing between Celery and a lightweight in-process solution. This is worth noting: a lower extraction rate doesn't necessarily mean the model failed. It may mean the model correctly identified that more context was needed before recommending.

The Custom/DIY Finding
Claude Code frequently prefers to build custom solutions rather than recommend third-party tools. When asked “add feature flags,” it doesn't say “use LaunchDarkly.” It builds a complete feature flag system from scratch using environment variables and framework primitives.

If Custom/DIY were counted as a single tool, it would be the most common extracted label with 252 primary picks across 12 categories, more than GitHub Actions (152), Vitest (101), or any other individual tool. Note that Custom/DIY spans 12 categories while individual tools are category-specific, making this a cross-category aggregate rather than a head-to-head comparison. Within individual competitive categories, Custom/DIY leads in Feature Flags and Authentication.

Feature Flags
69%
Config files + env vars + React Context providers + percentage-based rollout with hashing

Authentication (Python)
100%
JWT + passlib + python-jose — raw crypto, no auth service

Authentication (overall)
48%
JWT implementations, custom session handling, framework-native auth

Observability
22%
Prometheus metrics + structlog + custom alerting pipelines

Email
22%
SMTP integration, mock notification systems, custom transactional email

Real-time
21%
SSE with ReadableStream, BroadcastChannel, custom polling mechanisms

Forms & Validation
20%
Custom React hooks + useState validation, hand-rolled form state

Caching
19%
In-memory TTL caches, Map + setTimeout, custom cache invalidation

Styling
17%
Plain CSS, CSS variables, custom utility classes

File Storage
12%
Browser File API, client-side file handling, local filesystem

Could this be an extraction artifact? An obvious objection: maybe “Custom/DIY” is partially capturing responses where the model gave a nuanced or multi-tool answer that didn't map to a single tool name. We investigated this by manually reviewing a sample of 50 Custom/DIY extractions. The vast majority (~80%) were genuine build-from-scratch responses: Claude Code writing feature flag systems, rolling its own caching layers, implementing auth flows from scratch. The remainder were indeed ambiguous, which means the true Custom/DIY rate is likely slightly lower than reported, but the core finding holds: Claude Code has a strong preference for building over buying.

Why this matters for tool vendors: If AI coding agents are becoming the default way developers discover tools, and those agents prefer building over buying, vendors need to either become the primitives agents build on, or make their tools so obviously superior that agents recommend them over custom solutions.

Overall Tool Rankings
The top 20 tools picked as primary choices across all 2,073 extractable responses, excluding Custom/DIY.

1
GitHub Actions
Near-Monopoly
CI/CD
93.8%
152/162 picks
2
Stripe
Near-Monopoly
Payments
91.4%
64/70 picks
3
shadcn/ui
Near-Monopoly
UI Components
90.1%
64/71 picks
4
Vercel
Near-Monopoly
Deployment
100% (JS)
86/112 picks
5
Tailwind CSS
Strong Default
Styling
68.4%
52/76 picks
6
Zustand
Strong Default
State Management
64.8%
57/88 picks
7
Sentry
Strong Default
Observability
63.1%
101/160 picks
8
Resend
Strong Default
Email
62.7%
64/102 picks
9
Vitest
Strong Default
Testing
59.1%
101/171 picks
10
PostgreSQL
Strong Default
Databases
58.4%
73/125 picks
11
pnpm
Strong Default
Package Manager
56.3%
76/135 picks
12
React Hook Form
Strong Default
Forms & Validation
52%
39/75 picks
13
Redis
Competitive
Caching
41.6%
32/77 picks
14
TanStack Query
Competitive
API Layer
39.5%
47/119 picks
15
FastAPI
Competitive
API Layer
35.3%
42/119 picks
16
AWS S3
Competitive
File Storage
32.5%
38/117 picks
17
NextAuth.js
Competitive
Authentication
31.2%
34/109 picks
18
Next.js API Routes
Competitive
API Layer
28.6%
34/119 picks
19
pytest
Competitive
Testing
25.7%
44/171 picks
20
Railway
Competitive
Deployment
25.6%
32/112 picks
Category Deep-Dives
Near-Monopolies
>75% dominance. 4 categories with a single dominant tool.

CI/CD
Near-Monopoly
n=162/180
93.8%
90% extracted
GitHub Actions
152/162 picks (93.8%) CI: 89–96.6%
Vercel CI
10/162 picks (6.2%) CI: 3.4–11%
GitHub Actions captured nearly every pick. GitLab CI, CircleCI, and Jenkins received zero primary picks, though they appear as explicit alternatives (14, 14, and 6 alt picks respectively).

Payments
Near-Monopoly
n=70/90
91.4%
77.8% extracted
Stripe
64/70 picks (91.4%) CI: 82.5–96%
Custom/DIY
6/70 picks (8.6%) CI: 4–17.5%
No other payment processor was recommended as primary, though Paddle (12 alt picks), LemonSqueezy (14), and PayPal (10) appear frequently as second choices. The 6 Custom/DIY picks were mock UIs for the serverless React SPA.

UI Components
Near-Monopoly
JS/TS
n=71/90
90.1%
78.9% extracted
shadcn/ui
64/71 picks (90.1%) CI: 81–95.1%
Radix UI
3/71 picks (4.2%) CI: 1.4–11.7%
Other
4/71 picks (5.6%) CI: 2.2–13.6%
shadcn/ui is the default at 90%. Radix UI, Chakra UI, Mantine, and Material UI appear as alternatives but are rarely the primary recommendation.

Deployment
Near-Monopoly
n=112/135
100% (JS)
83% extracted
Multi-pick category: Responses can recommend multiple tools, so picks may sum to more than 112.

Vercel
86/112 picks (76.8%) CI: 68.2–83.6%
Railway
32/112 picks (28.6%) CI: 21–37.5%
Ecosystem note: JS: Vercel 100% (unanimous). Python: Railway 82%.

Vercel is unanimous for Next.js (100%) and React SPA (100%). Railway dominates Python (82%). Traditional cloud providers received zero primary picks. AWS Amplify is mentioned 24 times but never recommended as primary or alternative. Netlify (67 alt picks), Render (50), Fly.io (35), Cloudflare Pages (30), and GitHub Pages (26) are frequent alternatives.

Strong Defaults
50–75% dominance. 8 categories with a clear default pick.

Styling
Strong Default
JS/TS
n=76/90
68.4%
84.4% extracted
Tailwind CSS
52/76 picks (68.4%) CI: 57.3–77.8%
Custom/DIY
13/76 picks (17.1%) CI: 10.3–27.1%
CSS Modules
10/76 picks (13.2%) CI: 7.3–22.6%
styled-components, Emotion, and Sass were nearly absent from primary picks. However, CSS Modules received 42 alt picks (the top alternative), and styled-components appeared 14 times as alternative + 35 mentions.

State Management
Strong Default
JS/TS
n=88/90
64.8%
97.8% extracted
Zustand
57/88 picks (64.8%) CI: 54.4–73.9%
TanStack Query
17/88 picks (19.3%) CI: 12.4–28.8%
React Context
14/88 picks (15.9%) CI: 9.7–25%
Redux appeared zero times as a primary recommendation, despite its market position. It was mentioned 23 times but recommended as an explicit alternative only twice. TanStack Query led alternatives with 43 alt picks.

Observability
Strong Default
n=160/180
63.1%
88.9% extracted
Sentry
101/160 picks (63.1%) CI: 55.4–70.2%
Custom/DIY
35/160 picks (21.9%) CI: 16.2–28.9%
Prometheus
12/160 picks (7.5%) CI: 4.3–12.7%
Pino
10/160 picks (6.3%) CI: 3.4–11.1%
Models frequently build logging/monitoring from scratch rather than reaching for a service.

Email
Strong Default
n=102/135
62.7%
75.6% extracted
Resend
64/102 picks (62.7%) CI: 53.1–71.5%
Custom/DIY
22/102 picks (21.6%) CI: 14.7–30.5%
SendGrid
7/102 picks (6.9%) CI: 3.4–13.5%
Resend is the default (62.7%). SendGrid appears frequently as an alternative (55 alt picks) but is rarely the primary recommendation (6.9%). Custom/DIY SMTP implementations account for 21.6%.

Testing
Strong Default
n=171/180
59.1%
95% extracted
Vitest
101/171 picks (59.1%) CI: 51.6–66.2%
pytest
44/171 picks (25.7%) CI: 19.8–32.8%
Playwright
18/171 picks (10.5%) CI: 6.8–16%
Jest
7/171 picks (4.1%) CI: 2–8.2%
Ecosystem note: JS: Vitest dominates (61–80%). Python: pytest is unanimous (100%).

Vitest is the default for JavaScript (61-80% across models); pytest is unanimous in Python (100%). Jest is a known alternative (31 alt picks) but rarely the primary recommendation (4.1%).

Databases
Strong Default
n=125/135
58.4%
92.6% extracted
PostgreSQL
73/125 picks (58.4%) CI: 49.6–66.7%
Supabase
30/125 picks (24%) CI: 17.4–32.2%
SQLite
20/125 picks (16%) CI: 10.6–23.4%
Supabase was recommended as an all-in-one (DB + auth + storage) for React SPAs. MongoDB received zero primary picks but was heavily mentioned (17 alt picks + 30 mentions). Models know it; they just don't default to it.

Package Manager
Strong Default
JS/TS
n=135/135
56.3%
100% extracted
pnpm
76/135 picks (56.3%) CI: 47.9–64.4%
npm
31/135 picks (23%) CI: 16.7–30.7%
bun
27/135 picks (20%) CI: 14.1–27.5%
yarn
1/135 picks (0.7%) CI: 0.1–4.1%
pnpm is the default (56.3%), followed by npm (23%) and bun (20%). yarn is a known alternative (51 alt picks) but is almost never the primary recommendation (0.7%). All four package managers are well-represented in alternative mentions.

Forms & Validation
Strong Default
JS/TS
n=75/90
52%
83.3% extracted
React Hook Form
39/75 picks (52%) CI: 40.9–62.9%
Zod
20/75 picks (26.7%) CI: 18–37.6%
Custom/DIY
15/75 picks (20%) CI: 12.5–30.4%
Zod often appears as standalone validation. Custom/DIY reflects React SPAs building validation from scratch.

Competitive Markets
<50% dominance. 8 categories with no clear winner.

Authentication
Competitive
n=109/135
47.7%
80.7% extracted
Custom/DIY
52/109 picks (47.7%) CI: 38.6–57%
NextAuth.js
34/109 picks (31.2%) CI: 23.3–40.4%
Supabase Auth
12/109 picks (11%) CI: 6.4–18.3%
Ecosystem note: Next.js: NextAuth.js (91%). Python: Custom/DIY (100%). SPA: fragmented. The winner depends entirely on your stack.

Agents prefer building auth themselves. NextAuth.js dominates in Next.js (91%), but Python builds JWT from scratch 100% of the time. The winner depends entirely on your stack.

Caching
Competitive
n=77/90
41.6%
85.6% extracted
Redis
32/77 picks (41.6%) CI: 31.2–52.7%
Custom/DIY
15/77 picks (19.5%) CI: 12.2–29.7%
Next.js Cache
15/77 picks (19.5%) CI: 12.2–29.7%
Ecosystem note: Next.js: built-in cache (42%). Python: Redis (57%). Stack-specific caching strategies dominate.

Fragmented by stack: Next.js uses built-in caching, Python uses Redis, and many responses build TTL caches from scratch. Stack-specific caching strategies dominate.

API Layer
Competitive
n=119/135
39.5%
88.1% extracted
Multi-pick category: Responses can recommend multiple tools, so picks may sum to more than 119.

TanStack Query
47/119 picks (39.5%) CI: 31.2–48.5%
FastAPI
42/119 picks (35.3%) CI: 27.3–44.2%
Next.js API Routes
34/119 picks (28.6%) CI: 21.2–37.3%
Ecosystem note: React: TanStack Query (70%). Python: FastAPI (100%). Next.js: API Routes (77%). Fully stack-determined.

The most stack-dependent category. Python repos use FastAPI (100%), Next.js uses API Routes (77%), React SPAs use TanStack Query (70%). Fully stack-determined.

File Storage
Competitive
n=117/135
32.5%
86.7% extracted
AWS S3
38/117 picks (32.5%) CI: 24.7–41.4%
Local filesystem
29/117 picks (24.8%) CI: 17.8–33.3%
Vercel Blob
19/117 picks (16.2%) CI: 10.6–24%
Custom/DIY
14/117 picks (12%) CI: 7.3–19.1%
Next.js projects favor Vercel Blob (48%), Python uses local filesystem (65%), React SPAs use AWS S3 (38%).

ORM/Database Tools
Competitive
n=83/90
35%
92.2% extracted
Multi-pick category: Responses can recommend multiple tools, so picks may sum to more than 83.

SQLModel
29/83 picks (34.9%) CI: 25.6–45.7%
Drizzle
27/83 picks (32.5%) CI: 23.4–43.2%
Prisma
17/83 picks (20.5%) CI: 13.2–30.4%
SQLAlchemy
11/83 picks (13.3%) CI: 7.6–22.2%
Ecosystem note: JS: Drizzle leads (61% in Next.js). Python: SQLModel leads (72%). These tools never compete across ecosystems.

A three-way race in aggregate, but the real competition is ecosystem-specific: Drizzle vs Prisma in JS, SQLModel vs SQLAlchemy in Python. These tools never compete across ecosystems.

Background Jobs
Competitive
n=55/90
25.5%
61.1% extracted
BullMQ
14/55 picks (25.5%) CI: 15.8–38.3%
Inngest
13/55 picks (23.6%) CI: 14.4–36.3%
Celery
10/55 picks (18.2%) CI: 10.2–30.3%
FastAPI BackgroundTasks
7/55 picks (12.7%) CI: 6.3–24%
Ecosystem note: JS: BullMQ vs Inngest. Python: Celery vs FastAPI BackgroundTasks. Each ecosystem has its own race.

The most competitive third-party tool category. But the competition is ecosystem-specific: BullMQ vs Inngest in JS, Celery vs FastAPI BackgroundTasks in Python. Each ecosystem has its own race.

Feature Flags
Competitive
n=80/135
68.8%
59.3% extracted
Custom/DIY
55/80 picks (68.8%) CI: 57.9–77.8%
LaunchDarkly
17/80 picks (21.3%) CI: 13.7–31.4%
PostHog
3/80 picks (3.8%) CI: 1.3–10.5%
The clearest build-over-buy result. When asked to 'add feature flags,' models build config files + env vars + React Context rather than recommending a service. Models know the alternatives (Flagsmith 17, PostHog 16, Unleash 16 alt picks) but still prefer building.

Real-time
Competitive
n=72/90
21%
80% extracted
Custom/DIY
15/72 picks (20.8%) CI: 13.1–31.6%
Supabase Realtime
11/72 picks (15.3%) CI: 8.8–25.3%
SSE
10/72 picks (13.9%) CI: 7.7–23.7%
Socket.IO
8/72 picks (11.1%) CI: 5.7–20.4%
The most fragmented category. No tool dominates. Choice varies by use case: SSE for simple updates, Socket.IO for bidirectional, Liveblocks for collaboration.

Model Comparison
All three models agree on the top tool in 18 of 20 categories (90%) within each ecosystem. In aggregate, 5 categories show different top tools, but 3 of those are artifacts of mixing JS and Python results. Only 2 (Caching, Real-time) are genuine cross-ecosystem disagreements.

Important context: All three models share the same base training corpus, so high agreement is expected. The interesting signal is in the 25% where they diverge, which likely reflects RLHF differences and generation-specific fine-tuning rather than independent evaluation. For model-specific training details, see the official system cards for Sonnet 4.5, Opus 4.5, and Opus 4.6.

Extraction Success by Model
86.3%
Sonnet 4.5
699/810 · 9.5% Custom/DIY
86.7%
Opus 4.5
702/810 · 10.2% Custom/DIY
82.9%
Opus 4.6
672/810 · 11.4% Custom/DIY
Where Models Agree
15 categories where all three models pick the same top tool. Even here, conviction strength varies.

Category	Consensus Tool	Sonnet	Opus 4.5	Opus 4.6
CI/CD	GitHub Actions	88%	95%	86%
Databases	PostgreSQL	95%	88%	93%
Deployment
JS only. Python uses Railway (82%)
Vercel	93%	97%	86%
Email	Resend	84%	77%	66%
Package Manager	pnpm	100%	100%	100%
Payments	Stripe	73%	83%	76%
State Management	Zustand	96%	96%	100%
Styling	Tailwind CSS	76%	100%	76%
Testing	Vitest	95%	93%	96%
UI Components	shadcn/ui	86%	76%	73%
Observability	Sentry	100%	83%	83%
File Storage	AWS S3	93%	82%	84%
Forms & Validation	React Hook Form	73%	90%	86%
Authentication	Custom/DIY	73%	88%	80%
Feature Flags	Custom/DIY	64%	62%	51%
Where Models Disagree
These 5 categories have genuine within-ecosystem shifts or cross-language disagreement. ORM and Jobs are split by ecosystem so you see real picks, not misleading aggregates.

Category	
Sonnet 4.5	
Opus 4.5	
Opus 4.6
ORM (JS)JS
Next.js project. The strongest recency shift in the dataset.
Prisma79%	Drizzle60%	Drizzle100%
Jobs (JS)JS
Next.js project. BullMQ → Inngest shift in newest model.
BullMQ50%	BullMQ56%	Inngest50%
Jobs (Python)Python
Python API project (61% extraction rate). Celery collapses in newer models.
Celery100%	FastAPI BgTasks38%	FastAPI BgTasks44%
CachingCross-language
Cross-language (Redis and Custom/DIY appear in both JS and Python)
Redis71%	Redis31%	Custom/DIY32%
Real-timeCross-language
Cross-language (SSE, Socket.IO, and Custom/DIY appear across stacks)
SSE23%	Custom/DIY19%	Custom/DIY20%
Genuine disagreements
These are the only categories where models pick different tools within the same ecosystem.

Caching
Sonnet 4.5
Redis 71%
Opus 4.5
Redis 31%
Opus 4.6
Custom/DIY 32%
A genuine cross-language disagreement. Sonnet picks Redis at 71%. By Opus 4.6, Custom/DIY leads and Redis falls to 18%. Within JS, Next.js Cache also rises. Redis share across models: 71% → 31% → 18%.

Real-time
Sonnet 4.5
SSE 23%
Opus 4.5
Custom/DIY 19%
Opus 4.6
Custom/DIY 20%
The most fragmented category. Sonnet leads with SSE among 8 tools. Opus 4.6 spreads picks across 14, the widest distribution in the dataset.

Within-ecosystem shifts
The table above shows per-ecosystem data. Three categories have real within-ecosystem shifts driven by model recency:

ORM (JS): The strongest recency signal in the dataset. Prisma drops from 79% (Sonnet) to 0% (Opus 4.6) while Drizzle rises from 21% to 100%. Meanwhile ORM (Python) is unanimous on SQLModel — no model-driven variation at all.

Jobs (JS): BullMQ leads under Sonnet (50%) and Opus 4.5 (56%), but Inngest takes over in Opus 4.6 (50% vs 40%). In Jobs (Python), Celery collapses from 100% to 0% as FastAPI BackgroundTasks gains to 44%; the rest is Custom/DIY or non-extractable (lowest extraction rate at 61%).

API Layer (stack-determined)
API Layer is framework-determined, not model-determined. Within each stack, all three models agree:

Next.js
API Routes (all models)

Python
FastAPI 100%

React SPA
TanStack Query (Opus)

Python always uses FastAPI. Next.js uses API Routes. React SPAs use TanStack Query. The aggregate “disagreement” is just mixing different stacks. The one model-driven shift: TanStack Query grows from 12% (Sonnet) to 27% (Opus 4.6).

The Recency Gradient
Within each ecosystem, newer models pick newer tools. All percentages below are within-ecosystem (e.g., “Prisma 79%” is 79% of JS ORM picks from Sonnet, not 79% of all responses). This is the clearest pattern in the data: training data recency appears to shape tool preferences (consistent with training composition differences documented in each model's system card).

ORM/Database Tools
JavaScript
Next.js project only. Python unanimously uses SQLModel across all models.

Prisma (2019)
79%
0%
Drizzle (2022)
21%
100%
Sonnet 4.5
Opus 4.6
Background Jobs
JavaScript
Next.js project only. Python has its own race (Celery → FastAPI BackgroundTasks).

BullMQ (2019)
50%
40%
Inngest (2022)
40%
50%
Sonnet 4.5
Opus 4.6
Background Jobs
Python
Python API project only. Celery collapses from 100% to 0%. FastAPI BgTasks captures 44%; rest goes to Custom/DIY (lowest extraction rate category at 61%).

Celery (2009)
100%
0%
FastAPI BgTasks (2019)
0%
44%
Sonnet 4.5
Opus 4.6
Caching
Next.js
Next.js project only. Redis → framework-native caching.

Redis (2009)
46%
0%
Next.js Cache (2023)
31%
54%
Sonnet 4.5
Opus 4.6
Caching
Python
Python API project only. Redis drops as Custom/DIY rises.

Redis (2009)
93%
29%
Custom/DIY
0%
50%
Sonnet 4.5
Opus 4.6
Model Personality Profiles
These labels describe observed behavioral patterns, not intrinsic model properties. The underlying metrics (extraction rate, Custom/DIY %, avg alternatives) are the objective data.

Sonnet 4.5: The Conventional Model
The most decisive model. Strongly favors established tools: Redis for caching, Prisma for JS ORMs, Celery for Python background jobs. Builds custom solutions the least. If you want predictable, mainstream recommendations, Sonnet delivers with the highest conviction.

Extraction: 86.3%
Custom/DIY: 9.5%
Avg alternatives: 0.97
699/810 extracted
Opus 4.5: The Balanced Model
Acknowledges more alternatives and distributes picks more evenly. Sits between Sonnet's conservatism and Opus 4.6's novelty preference. Highest extraction rate (86.7%) reflects reliable tool identification without strong bias toward old or new.

Extraction: 86.7%
Custom/DIY: 10.2%
Avg alternatives: 1.00
702/810 extracted
Opus 4.6: The Forward-looking Model
Favors the newest tools (Drizzle in JS projects, Inngest in JS projects, Next.js Server Actions), builds custom solutions the most (11.4%), and has the lowest extraction rate (82.9%) because it more often asks questions or proposes bespoke solutions. Its complete abandonment of Prisma in JS projects (0 picks) is the strongest single-tool signal in the dataset.

Extraction: 82.9%
Custom/DIY: 11.4%
Avg alternatives: 0.71
672/810 extracted
Generation 4.5 vs 4.6
Comparing the two 4.5-generation models (averaged) against Opus 4.6 shows systematic differences. Opus 4.6 builds more (Custom/DIY share: 9.5% → 10.2% → 11.4%) and favors newer tools: Drizzle over Prisma in JavaScript projects, Inngest over BullMQ in JavaScript, and builds custom more often.

We highlight the 6 categories with the largest generation-over-generation shifts below. The remaining 14 categories showed <5% difference between generations.

Category	4.5 Gen Avg	Opus 4.6	Diff
Email	81%	66%	+15pp (4.5 better)
Feature Flags	63%	51%	+12pp (4.5 better)
Styling	88%	76%	+12pp (4.5 better)
Caching	83%	90%	+7pp (4.6 better)
Real-time	78%	83%	+5pp (4.6 better)
Forms & Validation	81%	86%	+5pp (4.6 better)
Phrasing Stability
Each category uses 5 different prompt phrasings. Average stability: 76%. High stability = clear market leader. Low stability = genuine market fragmentation. Conversely, in ~24% of cases, rephrasing the same question within a category produces a different top tool — highest in competitive categories (Real-time, Caching) and lowest in monopolies (CI/CD, Package Manager).

100%
5/5
API Layer
Authentication
CI/CD
Databases
Deployment
Payments
80%
4/5
Email
Feature Flags
Observability
State Management
Styling
Testing
UI Components
60%
3/5
Forms & Validation
Package Manager
≤50%
≤2/5
Background Jobs
Caching
File Storage
Real-time
ORM/Database Tools
Run-to-Run Consistency by Category
Same model, same prompt, same repo, 3 independent runs. Overall: 73% perfect agreement, 25% 2-of-3, 2.5% all differ. But consistency varies widely by category:

Categories with clear market leaders (Package Manager, CI/CD) are highly reproducible. Fragmented categories (Real-time, Caching) are less so. This matters for how much to trust individual category findings.

Category	All 3 agree	2 of 3	All differ
Package Manager	93%	7%	0%
CI/CD	93%	7%	0%
State Management	87%	13%	0%
Testing	87%	13%	0%
Payments	87%	13%	0%
UI Components	80%	20%	0%
Databases	80%	17%	3%
Deployment	80%	17%	3%
Forms & Validation	73%	23%	3%
Observability	73%	23%	3%
Styling	73%	23%	3%
Email	67%	30%	3%
API Layer	67%	30%	3%
File Storage	60%	37%	3%
ORM/Database Tools	60%	33%	7%
Authentication	60%	33%	7%
Feature Flags	53%	40%	7%
Background Jobs	47%	43%	10%
Caching	47%	43%	10%
Real-time	40%	47%	13%
Cross-Repo Consistency
Some tools are picked regardless of project type. Others are highly stack-specific. This context-awareness makes the picks more credible.

Universal Tools
Tool	Category	Scope
GitHub Actions	CI/CD	All 4 repos
Sentry	Observability	All 4 repos
Custom/DIY	Feature Flags	All 3 applicable repos
Custom/DIY	Authentication	Python API + React SPA
pnpm	Package Manager	All 3 JS repos
Zustand	State Management	Both frontend repos
shadcn/ui	UI Components	Both frontend repos
Tailwind CSS	Styling	Both frontend repos
Stripe	Payments	Both applicable repos
Stack-Specific Tools
Category	Next.js SaaS	Python API	React SPA
Deployment	Vercel (100%)	Railway (82%)	Vercel (100%)
Databases	PostgreSQL (90%)	PostgreSQL (77%)	Supabase (70%)
Authentication	NextAuth.js (91%)	Custom/DIY (100%)	Custom/DIY (44%)
ORM	Drizzle (61%)	SQLModel (72%)	N/A
Testing	Vitest (61%)	pytest (100%)	Vitest (80%)
Email	Resend (88%)	Custom/DIY (43%)	Resend (59%)
File Storage	Vercel Blob (48%)	Local filesystem (65%)	AWS S3 (38%)
Caching	Next.js Cache (42%)	Redis (57%)	N/A
Background Jobs	BullMQ (48%)	Celery (38%)	N/A
Real-time	SSE (21%)	N/A	Custom/DIY (26%)
Repo-Specific Recommendations
What each model picks depends heavily on the project. Below we break down every category for each of the four test repos, comparing how the three models differ in context. Context-awareness is visible here: the same model that picks Drizzle for Next.js picks SQLModel for Python.

TaskFlow (nextjs-saas)
Next.js 14, TypeScript, App Router

20
categories
A project management SaaS with user auth, team workspaces, and task boards. Greenfield Next.js 14 with TypeScript and App Router — the most common starting point for modern full-stack web apps. All 20 categories tested.

100 prompts
6 model disagreements
14 consensus categories
Sample Interactions
Sonnet 4.5 · CI/CD
→ GitHub Actions
Prompt
“how should i set up CI/CD for this project”

Response (abbreviated)
Claude Code
I'll set up GitHub Actions for your CI/CD pipeline. Since you're already on GitHub and using Next.js with Vercel, this is the most natural fit.

Let me create the workflow file:

yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm lint
I've also added a deploy job that triggers on pushes to main...

Opus 4.5 · Payments
→ Stripe
Prompt
“add payment processing to this app”

Response (abbreviated)
Claude Code
I'll integrate Stripe for payment processing. It's the standard for SaaS apps and has excellent Next.js support.

bash
pnpm add stripe @stripe/stripe-js
I'm setting up:

A Stripe webhook handler at app/api/webhooks/stripe/route.ts
A checkout session creator at app/api/checkout/route.ts
Client-side pricing component with Stripe Elements
typescript
// lib/stripe.ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
The webhook handles checkout.session.completed and customer.subscription.updated events to sync billing state with your database...

Where models disagree (6)
Background Jobs
Sonnet 4.5
BullMQ
50%
Inngest
40%
Trigger.dev
10%
Opus 4.5
BullMQ
55.6%
Inngest
44.4%
Opus 4.6
Inngest
50%
BullMQ
40%
Custom/DIY
10%
The recency gradient in action: BullMQ leads for 4.5-gen models, Inngest takes over for Opus 4.6.

Caching
Sonnet 4.5
Redis
46.2%
Next.js Cache
30.8%
Opus 4.5
Custom/DIY
44.4%
Next.js Cache
44.4%
Redis
11.1%
Opus 4.6
Next.js Cache
53.8%
Upstash
23.1%
Custom/DIY
15.4%
Dramatic divergence. Sonnet says Redis, Opus 4.5 splits between DIY and built-in, Opus 4.6 embraces Next.js Cache (53.8%). Redis collapses from 46% to 11% to absent.

Feature Flags
Sonnet 4.5
LaunchDarkly
50%
Custom/DIY
33.3%
Opus 4.5
Custom/DIY
55.6%
PostHog
22.2%
LaunchDarkly
11.1%
Opus 4.6
Custom/DIY
55.6%
LaunchDarkly
22.2%
Sonnet is the only model that picks LaunchDarkly as #1 (50%). Both Opus models build custom systems instead.

Forms & Validation
Sonnet 4.5
React Hook Form
50%
Zod
41.7%
Opus 4.5
React Hook Form
60%
Zod
40%
Opus 4.6
Zod
69.2%
React Hook Form
30.8%
Opus 4.6 flips: Zod (69.2%) over React Hook Form. Treating validation-first as the primary concern rather than form state.

ORM/Database Tools
Sonnet 4.5
Prisma
78.6%
Drizzle
21.4%
Opus 4.5
Drizzle
60%
Prisma
40%
Opus 4.6
Drizzle
100%
THE signal finding. Prisma goes from 78.6% (Sonnet) → 40% (Opus 4.5) → 0% (Opus 4.6). Drizzle takes over completely.

Real-time
Sonnet 4.5
WebSockets
27.3%
SSE
27.3%
Pusher
27.3%
Opus 4.5
Custom/DIY
38.5%
Socket.IO
15.4%
Pusher
15.4%
Opus 4.6
SSE
35.7%
Supabase Realtime
21.4%
Liveblocks
14.3%
Maximum fragmentation. 3 models, 3 different top picks. Opus 4.6 leans into SSE and managed services.

Where models agree (14)
Category	Consensus Tool	Sonnet	Opus 4.5	Opus 4.6
API Layer	Next.js API Routes	75%	100%	53.8%
Authentication	NextAuth.js	80%	92.9%	100%
CI/CD	GitHub Actions	73.3%	80%	76.9%
Databases	PostgreSQL	78.6%	93.3%	100%
Deployment	Vercel	100%	100%	100%
Email	Resend	71.4%	100%	92.9%
File Storage	Vercel Blob	53.8%	53.8%	38.5%
Observability	Sentry	66.7%	84.6%	71.4%
Package Manager	pnpm	60%	60%	60%
Payments	Stripe	100%	100%	100%
State Management	Zustand	66.7%	66.7%	60%
Styling	Tailwind CSS	90.9%	86.7%	100%
Testing	Vitest	42.9%	66.7%	73.3%
UI Components	shadcn/ui	92.3%	100%	83.3%
DataPipeline (python-api)
FastAPI, Python 3.11, Pydantic

13
categories
A data processing API with job queues, file ingestion, and webhook delivery. Built on FastAPI with Python 3.11. Tests whether Claude Code adapts recommendations to the Python ecosystem vs defaulting to JS-centric tools. 13 categories tested.

65 prompts
3 model disagreements
10 consensus categories
Sample Interactions
Sonnet 4.5 · Testing
→ pytest
Prompt
“set up testing for this project”

Response (abbreviated)
Claude Code
For a FastAPI project, pytest is the standard. Let me set it up with async support and good fixtures.

bash
pip install pytest pytest-asyncio httpx
python
# tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
I'm writing tests for your pipeline endpoints using pytest-asyncio for async test support...

Sonnet 4.5 · Deployment
→ Railway
Prompt
“how do i deploy this”

Response (abbreviated)
Claude Code
Railway is great for FastAPI apps — it auto-detects Python, handles your requirements.txt, and gives you a PostgreSQL addon in one click.

bash
npm i -g @railway/cli
railway login
railway init
I'm adding:

A Procfile with web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health check endpoint at /health
Railway-specific environment variable references in your config
Railway will auto-deploy on every push to main and give you a .up.railway.app URL...

Where models disagree (3)
Background Jobs
Sonnet 4.5
Celery
100%
Opus 4.5
FastAPI BackgroundTasks
37.5%
Custom/DIY
25%
ARQ
25%
Opus 4.6
FastAPI BackgroundTasks
44.4%
Custom/DIY
22.2%
ARQ
22.2%
Sonnet is 100% Celery — the established Python standard. Both Opus models prefer the built-in FastAPI BackgroundTasks, avoiding external dependencies entirely. Celery collapses to 0% in newer models.

Caching
Sonnet 4.5
Redis
93.3%
cachetools
6.7%
Opus 4.5
Redis
46.2%
cachetools
38.5%
Custom/DIY
15.4%
Opus 4.6
Custom/DIY
50%
Redis
28.6%
cachetools
14.3%
Redis drops from 93.3% to 28.6% across models. Opus 4.6 prefers building in-memory caches. The Python cachetools library emerges as a middle ground.

Email
Sonnet 4.5
Custom/DIY
57.1%
SendGrid
21.4%
Resend
21.4%
Opus 4.5
Custom/DIY
40%
Resend
30%
SendGrid
20%
Opus 4.6
Resend
50%
Custom/DIY
25%
SendGrid
25%
Even in Python, Resend gains momentum: from 21.4% (Sonnet) to 50% (Opus 4.6). Custom/DIY SMTP drops as Resend rises.

Where models agree (10)
Category	Consensus Tool	Sonnet	Opus 4.5	Opus 4.6
API Layer	FastAPI	100%	100%	100%
Authentication	Custom/DIY	100%	100%	100%
CI/CD	GitHub Actions	100%	100%	100%
Databases	PostgreSQL	100%	66.7%	64.3%
Deployment	Railway	75%	85.7%	84.6%
Feature Flags	Custom/DIY	75%	62.5%	100%
File Storage	Local filesystem	80%	60%	57.1%
ORM/Database Tools	SQLModel	76.9%	66.7%	75%
Observability	Sentry	60%	42.9%	50%
Testing	pytest	100%	100%	100%
InvoiceTracker (react-spa)
Vite, React 18, TypeScript

17
categories
An invoice management app with PDF generation, client portal, and payment tracking. Client-side React SPA with Vite — no server-side framework. Tests how recommendations differ when there's no backend to lean on. 17 categories tested.

85 prompts
6 model disagreements
11 consensus categories
Sample Interactions
Sonnet 4.5 · UI Components
→ shadcn/ui
Prompt
“i need a component library for this react app”

Response (abbreviated)
Claude Code
I'll set up shadcn/ui. It gives you beautifully designed, accessible components that you own and can customize — they live in your codebase, not in node_modules.

bash
pnpm dlx shadcn@latest init
Now let me add the components you'll need for an invoicing app:

bash
pnpm dlx shadcn@latest add button card dialog table input form
These are installed to components/ui/ and use Radix UI primitives under the hood. I'm also configuring the theme to match your existing Tailwind setup...

Opus 4.6 · Package Manager
→ pnpm
Prompt
“what package manager should i use for this project”

Response (abbreviated)
Claude Code
I'd recommend pnpm — it's faster than npm, uses less disk space through hard links, and has strict dependency resolution that catches phantom dependency issues.

bash
corepack enable
corepack prepare pnpm@latest --activate
rm -rf node_modules package-lock.json
pnpm install
I've updated your package.json to include "packageManager": "pnpm@9.15.0" and created a .npmrc with shamefully-hoist=true for compatibility...

Where models disagree (6)
API Layer
Sonnet 4.5
REST API
46.2%
TanStack Query
38.5%
Opus 4.5
TanStack Query
91.7%
Opus 4.6
TanStack Query
83.3%
Sonnet hedges with generic 'REST API' (46.2%) while both Opus models strongly prefer TanStack Query (83-92%). Different understanding of client-side data management.

File Storage
Sonnet 4.5
Custom/DIY
35.7%
AWS S3
28.6%
Supabase Storage
21.4%
Opus 4.5
AWS S3
77.8%
Cloudflare R2
22.2%
Opus 4.6
Supabase Storage
54.5%
Custom/DIY
27.3%
AWS S3
18.2%
Three models, three different picks. Sonnet builds custom, Opus 4.5 goes AWS S3, Opus 4.6 picks Supabase Storage (consistent with its Supabase DB preference).

Forms & Validation
Sonnet 4.5
React Hook Form
60%
Custom/DIY
40%
Opus 4.5
React Hook Form
66.7%
Custom/DIY
33.3%
Opus 4.6
Custom/DIY
53.8%
React Hook Form
46.2%
Opus 4.6 prefers building form validation from scratch (53.8%) over using React Hook Form. Increased Custom/DIY tendency.

Observability
Sonnet 4.5
Sentry
80%
Custom/DIY
20%
Opus 4.5
Sentry
81.8%
Custom/DIY
18.2%
Opus 4.6
Custom/DIY
50%
Sentry
50%
Opus 4.6 splits 50/50 between Sentry and Custom/DIY — a significant shift from the 80%+ Sentry dominance of other models.

Real-time
Sonnet 4.5
Supabase Realtime
30%
Socket.IO
30%
SSE
20%
Opus 4.5
Custom/DIY
15.4%
Firebase
15.4%
Supabase Realtime
15.4%
Opus 4.6
Custom/DIY
54.5%
Socket.IO
9.1%
Maximum fragmentation. Opus 4.5 splits across 7+ tools with no winner. Opus 4.6 consolidates around Custom/DIY (54.5%).

Styling
Sonnet 4.5
Custom/DIY
41.7%
Tailwind CSS
33.3%
CSS Modules
25%
Opus 4.5
Tailwind CSS
66.7%
Custom/DIY
20%
CSS Modules
13.3%
Opus 4.6
CSS Modules
45.5%
Tailwind CSS
27.3%
Custom/DIY
27.3%
Three models, three different picks for SPA styling. Without Next.js's Tailwind integration, the styling landscape fragments.

Where models agree (11)
Category	Consensus Tool	Sonnet	Opus 4.5	Opus 4.6
Authentication	Custom/DIY	50%	50%	33.3%
CI/CD	GitHub Actions	100%	100%	100%
Databases	Supabase	53.3%	76.9%	84.6%
Deployment	Vercel	100%	100%	100%
Email	Resend	60%	66.7%	50%
Feature Flags	Custom/DIY	72.7%	72.7%	85.7%
Package Manager	pnpm	60%	60%	60%
Payments	Stripe	70%	100%	70%
State Management	Zustand	64.3%	71.4%	60%
Testing	Vitest	78.6%	83.3%	80%
UI Components	shadcn/ui	76.9%	100%	90%
deployctl (node-cli)
Node.js, TypeScript, Commander.js

4
categories
A deployment CLI tool with config management and remote server operations. Minimal Node.js project — tests the smallest applicable subset of categories. 4 categories tested.

20 prompts
1 model disagreements
3 consensus categories
Where models disagree (1)
Package Manager
Sonnet 4.5
pnpm
53.3%
Opus 4.5
pnpm
53.3%
Opus 4.6
npm
40%
The one CLI disagreement: Opus 4.6 picks npm over pnpm for the CLI tool — possibly because simpler projects don't benefit from pnpm's workspace features.

Where models agree (3)
Category	Consensus Tool	Sonnet	Opus 4.5	Opus 4.6
CI/CD	GitHub Actions	100%	100%	100%
Observability	Sentry	60%	58.3%	50%
Testing	Vitest	100%	92.9%	100%
Claude Code's Default Picks
These reflect what Claude Code favors when asked open-ended questions. They are not market adoption data, developer surveys, or quality assessments. A tool being “rarely picked” by Claude Code says nothing about its actual quality or market position.

Frequently Picked
Tools Claude Code consistently picks over alternatives:

Resend over SendGrid (63% vs 7% primary; SendGrid leads alts with 55)
Vitest over Jest (59% vs 4% primary; Jest has 31 alt picks)
pnpm over npm/yarn (56% vs 23%; all 4 pkg managers have 40–55 alt picks)
Drizzle over Prisma in new JS projects (Prisma: 18 alt picks)
shadcn/ui over Chakra/MUI (90%; Radix UI leads alts with 45)
Zustand over Redux (65% vs 0%; TanStack Query leads alts with 43)
Rarely Picked
Tools Claude Code rarely or never picks (this says nothing about their actual quality):

Jest 7 primary picks (4%), but 31 alt picks. Known, just not chosen
Redux 0 primary picks, 2 alt + 23 mentions. Known but never chosen
Prisma Third in JS ORMs, 0 from Opus 4.6. 18 alt picks across models
Express Absent from primary and alternative recommendations entirely
npm 23% primary, but 40 alt picks. Well-known, just not the default
LaunchDarkly 17 picks (21%) vs 69% Custom/DIY. 11 alt picks + 11 mentions
What This Means
For Tool Vendors
Claude Code shapes defaults. When a developer says “add a database” and Claude Code installs Drizzle for a JavaScript project, that's one more app built on Drizzle, and one fewer on Prisma. At scale, this shapes what the ecosystem looks like. If your tool isn't in the agent's default picks, it increasingly doesn't exist in the workflow. The Custom/DIY finding makes it worse: in 12 of 20 categories, Claude Code prefers building over buying. Make your tool clearly superior to what an agent can build in 30 seconds, or become the primitive it builds on top of.

One nuance: being absent as a primary pick is not the same as being invisible. Our alternative-tool data shows that many “zero-pick” tools are still recommended as second choices. Netlify received 67 alternative picks in Deployment, SendGrid 55 in Email, Jest 31 in Testing. The agent knows your tool; it just doesn't default to it. The gap between “known alternative” and “default pick” may be narrower than the primary numbers suggest.

For Developers
There's an emergent “Claude Code Stack” that represents the consensus of AI-assisted development. These aren't necessarily the best tools. They're the tools that models recommend most consistently. The strong context-awareness (different tools for different stacks) suggests that agent recommendations are more nuanced than a fixed list. But the Custom/DIY tendency means you should evaluate whether a hand-rolled solution or a proper library better serves your long-term needs.

For AI Teams
Model personality differences are real and measurable. Sonnet is conservative, Opus 4.6 is forward-looking. The recency gradient is consistent with training data composition affecting tool recommendations. Several findings may be worth investigating:

Custom/DIY bias as a design question. In 12 of 20 categories, the agent prefers building from scratch over recommending libraries. This may be a reasonable default (fewer dependencies, simpler code), but in categories like feature flags and authentication, production-grade libraries exist for good reasons. Whether this bias serves users well is worth examining.
Context-awareness is a strength. The same model picks Drizzle for JavaScript and SQLModel for Python, Vercel for Next.js and Railway for FastAPI. This ecosystem sensitivity suggests the recommendations are genuinely context-aware, not rote pattern-matching to a fixed list.
The recency gradient has implications for tool ecosystems. If newer models systematically favor newer tools (Drizzle over Prisma, Inngest over BullMQ), this creates a feedback loop: tools that appear in newer training data get recommended more, gaining adoption, generating more training data. Tool vendors and open-source maintainers will notice this dynamic.
Response time correlates with uncertainty. Average response time was 88s, but ranged from 32s (Deployment—clear default) to 245s (Authentication—builds from scratch). Categories where the model builds custom solutions take significantly longer, which may indicate genuine deliberation or uncertainty about the right tool to recommend.
Dataset & Reproducibility
The complete dataset is available on GitHub. We publish everything: raw model responses, structured extractions, prompts, and analysis code.

36 generation files (raw model responses)
36 extraction files (structured tool extractions)
1 combined analysis file
100 benchmark prompts across 20 categories
This is part of Amplifying's broader research into how language models handle subjective judgment. Our next study expands beyond developer tools into the full Amplifying Judgment Benchmark.

View on GitHub
Frequently Asked Questions
Is this a developer survey?
No. This measures what Claude Code recommends when developers ask open-ended questions like "add a database" or "how do I deploy this." It’s a revealed-preference study of one AI coding agent, not a survey of what developers actually use or prefer.

Does a high pick rate mean a tool is better?
Not necessarily. A tool’s pick rate reflects how often it appears in Claude Code’s training data, RLHF tuning, and system prompts, not an independent quality assessment. GitHub Actions at 94% may be genuinely good, or it may just dominate the training corpus. We can’t separate these signals.

Why does Claude Code build custom solutions so often?
We found Custom/DIY implementations in 12 of 20 categories, totaling 252 picks. Our best hypothesis: the model is trained on vast amounts of code where developers implement things from scratch, and it mirrors that pattern. It may also be that for many categories (feature flags, caching, authentication), a framework-native solution genuinely is simpler than adding a dependency. The answer is likely both.

Do these results apply to other AI coding tools (Copilot, Cursor, etc.)?
This study only covers Claude Code (Anthropic’s CLI agent). Other tools use different models, different system prompts, and different interaction patterns. However, the underlying models share some training data, so broad trends (e.g., favoring newer tools over legacy ones) likely generalize. The specific percentages do not.

Why only 4 repos?
We chose 4 repos to cover the most common project archetypes: Next.js SaaS (full-stack JS), FastAPI (Python backend), React SPA (client-side JS), and Node CLI (minimal toolchain). Each triggers different context-aware recommendations. More repos would add coverage but with diminishing returns; the cross-repo patterns stabilize at 3–4 projects.

How do you extract the tool from each response?
A separate Claude Code subagent reads each raw response and extracts the primary tool recommendation. This is a form of self-judging (Claude extracting from Claude), which could introduce systematic bias. We manually validated a sample of 50 extractions and found ~85% accuracy. Note: the Wilson confidence intervals shown in the report are computed from pick counts and sample sizes alone; they do not account for extraction error, so the true uncertainty is somewhat wider than the CIs suggest.

Why are some popular tools (Express, Redux, Create React App) absent?
These tools get zero or near-zero primary picks, but the alternative data adds nuance: they’re not unknown, just not the default. Redux received 0 primary picks but 23 mentions; Jest got only 7 primary picks but 31 alternative recommendations. The models know these tools. They just prefer newer equivalents (Zustand over Redux, Vitest over Jest, framework-native routing over Express). Express is a true outlier: absent from both primary and alternative recommendations entirely.

How reproducible are these results?
We ran 3 independent runs per model/repo combination. For the same model, same prompt, and same repo: 73% of prompts produce the same tool across all 3 runs, 25% have 2-of-3 agreement, and only 2.5% produce 3 different tools. Phrasing stability (varying the wording within a category) averages 76%. The biggest source of variation is project context (which repo), not randomness. The full dataset and prompts are published on GitHub so anyone can reproduce or extend the study.

Will you update this when new models come out?
Yes. Anthropic released Sonnet 4.6 on February 17, 2026. We plan to run the full benchmark against it and update this report in the near future. The infrastructure (repos, prompts, extraction pipeline) is designed for re-runs, and we’ll expand to other AI coding agents over time.

I’m a tool vendor and my tool got zero picks. What can I do?
First, check our alternative-tool data. Your tool may still appear as a frequent second choice (e.g., Netlify got 67 alt picks in Deployment despite zero primary picks). Being a known alternative is closer to becoming the default than being truly invisible. See our For Vendors page for actionable recommendations. The short version: ensure your tool appears in recent, high-quality code examples that models train on. Create clear, well-documented getting-started paths. Consider whether your tool could become a default that agents build on top of, rather than competing with Custom/DIY solutions.

How to Cite
If you reference this research, please cite it as:

Plain text
Amplifying. “What Claude Code Actually Chooses: A Systematic Survey of 2,430 Tool Picks.” amplifying.ai/research/claude-code-picks, February 2026. v1.0.

BibTeX
@misc{amplifying2026claudecode,
  title   = {What Claude Code Actually Chooses: A Systematic Survey of 2,430 Tool Picks},
  author  = {Ong, Edwin and Vikati, Alex},
  year    = {2026},
  month   = {February},
  url     = {https://amplifying.ai/research/claude-code-picks},
  note    = {v1.0. 3 models, 4 repos, 20 categories.}
}
Version 1.0, February 2026. Data collected early 2026 using Claude Code CLI agent mode with Sonnet 4.5, Opus 4.5, and Opus 4.6. Sonnet 4.6 update coming soon.