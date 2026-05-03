import { getCurrentProjectIdentity } from "@/lib/project-access"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { MarkerType } from "@xyflow/react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"

const google = () =>
  createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

// Shape map: infer shapes from component roles
const ROLE_SHAPES: Record<string, string> = {
  database: "cylinder",
  db: "cylinder",
  storage: "cylinder",
  cache: "cylinder",
  redis: "cylinder",
  queue: "cylinder",
  gateway: "diamond",
  router: "diamond",
  load_balancer: "diamond",
  balancer: "diamond",
  decision: "diamond",
  client: "pill",
  mobile: "pill",
  browser: "pill",
  user: "circle",
  actor: "circle",
  service: "rectangle",
  api: "rectangle",
  server: "rectangle",
  worker: "hexagon",
  job: "hexagon",
  cron: "hexagon",
}

const COLOR_MAP: Record<string, (typeof NODE_COLORS)[number]> = {
  database: NODE_COLORS[7],   // teal
  cache: NODE_COLORS[7],
  storage: NODE_COLORS[7],
  queue: NODE_COLORS[3],      // orange
  gateway: NODE_COLORS[4],    // red
  router: NODE_COLORS[4],
  balancer: NODE_COLORS[4],
  client: NODE_COLORS[6],     // green
  user: NODE_COLORS[6],
  service: NODE_COLORS[1],    // blue
  api: NODE_COLORS[1],
  worker: NODE_COLORS[2],     // purple
  default: NODE_COLORS[0],    // dark
}

const outputSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      role: z.string().describe("One of: client, user, gateway, router, load_balancer, api, service, worker, database, cache, storage, queue, decision"),
    })
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert software architect. Extract the architecture components and their connections from the user's input.

The input may be:
- Free-form text describing a system
- Mermaid diagram syntax (graph TD, flowchart, sequenceDiagram, etc.)
- PlantUML
- A list of services/components
- A rough whiteboard description

For each component, assign a "role" that best describes it from this list:
client, user, gateway, router, load_balancer, api, service, worker, database, cache, storage, queue, decision

Rules:
- Generate compact IDs (e.g., "auth-service", "postgres-db")  
- Each node.label should be the display name (e.g., "Auth Service", "PostgreSQL")
- Capture all meaningful connections. For Mermaid, parse the graph literally.
- Keep to ≤ 30 nodes. Merge sub-components where possible.
- Preserve directionality of connections from the source material.`

function pickShape(role: string) {
  const shape = ROLE_SHAPES[role] ?? "rectangle"
  return shape as keyof typeof SHAPE_DEFAULTS
}

function pickColor(role: string): (typeof NODE_COLORS)[number] {
  return COLOR_MAP[role] ?? COLOR_MAP.default
}

let nodeSeq = 0
function uid() { return `ingest-${Date.now()}-${++nodeSeq}` }

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const input = typeof body.input === "string" ? body.input.trim() : ""

  if (!input || input.length < 10) {
    return Response.json({ error: "Input too short" }, { status: 400 })
  }

  if (input.length > 12000) {
    return Response.json({ error: "Input too long (max 12 000 chars)" }, { status: 400 })
  }

  const ai = google()
  const { object } = await generateObject({
    model: ai("gemini-2.5-flash"),
    schema: outputSchema,
    system: SYSTEM_PROMPT,
    prompt: input,
  })

  // Build canvas nodes with proper shapes/colors (positions handled client-side by dagre)
  const nodes: CanvasNode[] = object.nodes.map((n) => {
    const shape = pickShape(n.role)
    const color = pickColor(n.role)
    const size = SHAPE_DEFAULTS[shape]
    return {
      id: n.id,
      type: "canvasNode" as const,
      position: { x: 0, y: 0 }, // dagre will position
      data: {
        label: n.label,
        shape,
        color: color.fill,
        textColor: color.text,
      },
      width: size.width,
      height: size.height,
    }
  })

  const nodeIds = new Set(nodes.map((n) => n.id))
  const edges: CanvasEdge[] = object.edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({
      id: uid(),
      type: "canvasEdge" as const,
      source: e.source,
      target: e.target,
      sourceHandle: null,
      targetHandle: null,
      data: { label: e.label ?? "" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "rgba(255,255,255,0.4)",
        width: 16,
        height: 16,
      },
    }))

  return Response.json({ nodes, edges })
}
