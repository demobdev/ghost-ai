import { getCurrentProjectIdentity } from "@/lib/project-access"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"

const google = () =>
  createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

interface NodeData {
  label?: string
  shape?: string
}

interface CanvasNodeInput {
  id: string
  data?: NodeData
}

interface CanvasEdgeInput {
  id: string
  source: string
  target: string
  data?: { label?: string }
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const nodeDataSchema = z
  .object({
    label: z.string().optional(),
    shape: z.string().optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
    decisionTrace: z.string().optional().describe("A brief explanation of why this component was chosen or modified"),
  })

const nodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: nodeDataSchema.optional(),
  })

const edgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z.object({ label: z.string().optional() }).optional(),
  })

const SYSTEM_PROMPT = `You are a senior software architect and system design expert.
You are helping a user design, review, or understand a software architecture diagram.
You will receive the current state of their architecture canvas as a list of nodes and edges.
You will also receive the conversation history.

Your job:
1. Answer the user's questions about the architecture directly and concisely.
2. If they ask for improvements, suggest concrete, actionable changes (e.g. "Add a Redis cache between X and Y").
3. IMPORTANT: If the user asks you to modify, update, add, or remove components from the architecture, YOU MUST call the \`updateArchitecture\` tool to automatically apply these changes to their canvas. When calling the tool, also provide a brief text explanation of the changes you made.
4. When calling \`updateArchitecture\`, ALWAYS provide a \`decisionTrace\` in the node data for any new or modified node explaining why you made that change.
5. Be educational but brief. Use markdown formatting for readability.
6. Only discuss the architecture. Do not generate code unless specifically requested.

Current Architecture Context:
`

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const nodes = (body.nodes as CanvasNodeInput[]) ?? []
  const edges = (body.edges as CanvasEdgeInput[]) ?? []
  const chatHistory = (body.chatHistory as ChatMessage[]) ?? []
  const prompt = typeof body.prompt === "string" ? body.prompt : ""

  if (!prompt) {
    return Response.json({ error: "Prompt is required" }, { status: 400 })
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

  const messages: Parameters<typeof generateText>[0]["messages"] = [
    { role: "system", content: SYSTEM_PROMPT + architectureDescription },
    ...chatHistory.map((msg) => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content,
    })),
    { role: "user", content: prompt },
  ]

  const ai = google()
  const { text, toolCalls } = await generateText({
    model: ai("gemini-2.5-flash"),
    messages,
    tools: {
      updateArchitecture: {
        description:
          "Update the canvas architecture by providing a completely revised set of nodes and edges. Use this whenever the user asks you to add, remove, or modify components of the system. You must include the original nodes and edges unless the user explicitly wants them removed.",
        parameters: z.object({
          nodes: z.array(nodeSchema),
          edges: z.array(edgeSchema),
        }),
      } as any,
    },
  })

  let finalResponse = text
  let architectureUpdate = undefined

  if (toolCalls && toolCalls.length > 0) {
    const updateCall = toolCalls.find((t) => t.toolName === "updateArchitecture")
    if (updateCall) {
      architectureUpdate = (updateCall as any).args
      if (!finalResponse) {
        finalResponse = "I have updated the architecture on the canvas for you."
      }
    }
  }

  return Response.json({ response: finalResponse, architectureUpdate })
}
