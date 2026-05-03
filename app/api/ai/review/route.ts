import { getCurrentProjectIdentity } from "@/lib/project-access"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const google = () =>
  createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

const severitySchema = z.enum(["critical", "warning", "info"])

const findingSchema = z.object({
  id: z.string(),
  severity: severitySchema,
  category: z.string().describe(
    "One of: reliability, security, scalability, performance, cost, observability, design"
  ),
  title: z.string().describe("Short finding title, max 8 words"),
  description: z.string().describe("What the problem is and why it matters, 2-3 sentences"),
  recommendation: z.string().describe("Concrete actionable fix, 1-3 sentences"),
  affectedNodes: z.array(z.string()).describe("Node IDs from the canvas that are affected"),
})

const outputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall architecture health score 0-100"),
  summary: z.string().describe("2-3 sentence overall assessment"),
  findings: z.array(findingSchema),
})

const SYSTEM_PROMPT = `You are a senior software architect and system design expert. 
You review architecture diagrams and provide actionable, educational feedback to help teams build more reliable, secure, and scalable systems.

You will receive a JSON representation of a software architecture canvas: a list of nodes (services, databases, queues, etc.) and edges (connections between them).

Your job:
1. Identify real architectural problems — not surface-level observations
2. Be specific: reference actual node IDs and their roles
3. Prioritize: only flag true issues, not style preferences
4. Be educational: explain WHY each issue matters in plain language
5. Give concrete recommendations: what exactly should they add or change

Scoring guide:
- 90-100: Excellent — production-ready, well-thought-out
- 70-89: Good — solid foundation, minor gaps
- 50-69: Fair — functional but has meaningful risks
- 30-49: Needs work — significant reliability or security gaps
- 0-29: Problematic — fundamental architectural issues

Severity:
- critical: This could cause data loss, security breach, or complete outage
- warning: Real risk that will likely cause problems under production load
- info: Best practice improvement that increases reliability or developer experience

Categories:
- reliability: SPOFs, lack of redundancy, cascading failure risks
- security: Missing auth, exposed services, no rate limiting, insecure data flow
- scalability: Bottlenecks, lack of horizontal scaling, missing queues/caching
- performance: Missing caches, inefficient data access patterns, N+1 risks
- cost: Over-provisioned resources, missing cost controls
- observability: Missing logging, tracing, health checks, alerting
- design: Tight coupling, missing API gateway, circular dependencies

If the architecture is empty or has fewer than 2 nodes, return score: 0 and a single finding explaining there is nothing to review yet.`

interface NodeData {
  label?: string
  shape?: string
}

interface CanvasNodeInput {
  id: string
  data?: NodeData
  position?: { x: number; y: number }
}

interface CanvasEdgeInput {
  id: string
  source: string
  target: string
  data?: { label?: string }
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const nodes = (body.nodes as CanvasNodeInput[]) ?? []
  const edges = (body.edges as CanvasEdgeInput[]) ?? []

  if (nodes.length === 0) {
    return Response.json({
      score: 0,
      summary: "The canvas is empty. Add some nodes and connections first.",
      findings: [
        {
          id: "empty-canvas",
          severity: "info",
          category: "design",
          title: "Canvas is empty",
          description: "There are no components on the canvas yet. Start by describing your system to the AI Architect, importing a template, or dragging nodes onto the canvas.",
          recommendation: "Use the AI Architect tab to describe your system, or import a starter template from the Templates menu.",
          affectedNodes: [],
        },
      ],
    })
  }

  // Serialize the canvas into a human-readable format for the AI
  const nodeList = nodes.map((n) => ({
    id: n.id,
    label: n.data?.label ?? "(unlabeled)",
    shape: n.data?.shape ?? "rectangle",
  }))

  const edgeList = edges.map((e) => ({
    from: e.source,
    fromLabel: nodes.find((n) => n.id === e.source)?.data?.label ?? e.source,
    to: e.target,
    toLabel: nodes.find((n) => n.id === e.target)?.data?.label ?? e.target,
    label: e.data?.label ?? "",
  }))

  const architectureDescription = JSON.stringify({ nodes: nodeList, edges: edgeList }, null, 2)

  const ai = google()
  const { object } = await generateObject({
    model: ai("gemini-2.5-flash"),
    schema: outputSchema,
    system: SYSTEM_PROMPT,
    prompt: `Review this architecture:\n\n${architectureDescription}`,
  })

  return Response.json(object)
}
