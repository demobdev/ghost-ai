# Architecture Context

## Stack

| Layer            | Technology                  | Role                                                           |
| ---------------- | --------------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript     | Full-stack app with server/client boundaries                   |
| UI               | Tailwind v4 + shadcn/ui     | Component composition and styling                              |
| Auth             | Clerk                       | User identity and route protection                             |
| Database         | Prisma 7 + PostgreSQL       | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow     | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev v3              | Durable AI generation workflows (cloud workers)                |
| AI model         | Google Gemini 2.0 Flash     | Architecture generation, spec writing, and design review       |
| Artifact storage | Vercel Blob                 | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation, spec generation. Deployed to Trigger.dev cloud via `npx trigger.dev@latest deploy`. Run locally via `npx trigger.dev@latest dev`.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema (split across `prisma/models/*.prisma`) and generated client output at `app/generated/prisma`.

## Storage Model

- **Database (PostgreSQL via Prisma)**: project metadata, ownership, collaborators, task run records, spec records (URL reference only), and canvas blob URL.
- **Vercel Blob**: generated artifacts only — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{timestamp}.md`.
- The blob URL is stored in the database (`canvasBlobUrl` on Project, `filePath` on ProjectSpec) as the reference to the artifact.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob — never in the database directly.
- Private blobs are accessed server-side using `getDownloadUrl()` from `@vercel/blob` to generate a signed URL, then fetched from that URL.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators (stored by email via `ProjectCollaborator`).
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.
- Collaborator emails are normalized to lowercase before storage and lookup.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase (`components/editor/starter-templates.ts`).
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: `design-agent` (TrueGraph AI) durable background task via Trigger.dev v3.
- AI: Google Gemini 2.0 Flash via `@ai-sdk/google` (`createGoogleGenerativeAI`).
- Output: structured node and edge updates written into the shared Liveblocks room via `mutateStorage`.
- Status events broadcast to collaborators via Liveblocks `broadcastEvent` and `setPresence`.

### Spec Generation

- Input: current canvas graph (nodes/edges), chat history, and project context.
- Execution: `generate-spec` durable background task via Trigger.dev v3.
- AI: Google Gemini 2.0 Flash via `@ai-sdk/google`.
- Output: Markdown technical spec uploaded to Vercel Blob (`specs/{projectId}/{timestamp}.md`, private access) and linked to the project via a `ProjectSpec` record in PostgreSQL. Technical specification documents are branded as TrueGraph Specs.

## Liveblocks Room Data

- **Presence**: `{ cursor: { x, y } | null, thinking: boolean }`
- **Storage**: `{ flow: { nodes: LiveMap<string, LiveObject<CanvasNode>>, edges: LiveMap<string, LiveObject<CanvasEdge>> } }`
- **RoomEvents**: `{ type: "ai-status", message: string, status: "thinking" | "complete" | "error" }`
- **FeedMessageData**: `{ type: "ai-status" | "chat", ... }` — used for `ai-status-feed` and `ai-chat` feeds.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
6. Private blobs must be read server-side using `getDownloadUrl()`, not `get()` (which returns metadata only).
