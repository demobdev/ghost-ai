import { getCurrentProjectIdentity } from "@/lib/project-access"
import { auth, clerkClient } from "@clerk/nextjs/server"
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
      decisionTrace: z.string().optional().describe("A brief explanation of why this component was identified from the codebase"),
      summary: z.string().describe("A 2-3 sentence technical summary of how this component works in the repo"),
      endpoints: z.array(z.string()).optional().describe("List of API endpoints or routes if this is an API/service"),
      fileLinks: z.array(z.string()).describe("Paths to the 2-3 most important files/directories for this component"),
      hygieneChecklist: z.array(
        z.object({
          task: z.string(),
          completed: z.boolean(),
        })
      ).describe("A list of 3-4 hygiene/best-practice checks for this component (e.g., 'Auth enabled', 'Tests present')"),
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

const SYSTEM_PROMPT = `You are an expert software architect and technical writer. You are given a file tree and key configuration files from a GitHub repository.
Your task is to deduce the high-level architecture AND deep implementation details of this system.

For each component:
1. Identify its "role" (e.g., api, database, client).
2. Write a concise technical summary of how it's implemented.
3. List key API endpoints or major routes if applicable.
4. Link the 2-3 most important files or directories that define this component.
5. Generate a "Hygiene Checklist" of 3-4 items tailored to the component's role and its current state in the repo (e.g., if you see a Next.js app without a middleware.ts, mark 'Auth middleware' as incomplete).

Roles:
client, user, gateway, router, load_balancer, api, service, worker, database, cache, storage, queue, decision

Rules:
- Generate compact IDs (e.g., "auth-service")
- Keep to ≤ 30 nodes.
- Provide a short \`decisionTrace\` for each node explaining your inference.
- Output ONLY the requested JSON schema.`

function pickShape(role: string) {
  const shape = ROLE_SHAPES[role] ?? "rectangle"
  return shape as keyof typeof SHAPE_DEFAULTS
}

function pickColor(role: string): (typeof NODE_COLORS)[number] {
  return COLOR_MAP[role] ?? COLOR_MAP.default
}

let nodeSeq = 0
function uid() { return `ingest-${Date.now()}-${++nodeSeq}` }

async function fetchGithubTree(owner: string, repo: string, branch: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const url = typeof body.url === "string" ? body.url.trim() : ""

  if (!url || !url.includes("github.com/")) {
    return Response.json({ error: "Invalid GitHub URL" }, { status: 400 })
  }

  // Parse owner and repo from URL
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) {
    return Response.json({ error: "Could not parse GitHub repository URL" }, { status: 400 })
  }

  const owner = match[1]
  const repo = match[2].replace(/\.git$/, "")

  let githubToken = ""
  try {
    const { userId } = await auth()
    if (userId) {
      const client = await clerkClient()
      const response = await client.users.getUserOauthAccessToken(userId, "oauth_github")
      if (response.data && response.data.length > 0) {
        githubToken = response.data[0].token
      }
    }
  } catch (e) {
    console.error("Failed to fetch GitHub token from Clerk", e)
  }

  // Try main, then master
  let treeData = await fetchGithubTree(owner, repo, "main", githubToken)
  if (!treeData) {
    treeData = await fetchGithubTree(owner, repo, "master", githubToken)
  }

  if (!treeData || !treeData.tree) {
    return Response.json({ error: "Failed to fetch repository tree. Ensure it is a public repository." }, { status: 400 })
  }

  // Filter out noisy directories to keep the prompt size reasonable
  const noisyDirs = ["node_modules", "dist", "build", ".git", ".next", "__pycache__", "coverage"]
  const treeFiles = (treeData.tree as any[])
    .filter(item => item.type === "blob")
    .map(item => item.path)
    .filter(path => !noisyDirs.some(dir => path.startsWith(`${dir}/`) || path.includes(`/${dir}/`)))

  if (treeFiles.length === 0) {
    return Response.json({ error: "No relevant files found in repository." }, { status: 400 })
  }

  // Fetch a key config file if present (e.g. package.json or docker-compose.yml) to get dependencies
  let configContent = ""
  const keyFiles = ["package.json", "docker-compose.yml", "docker-compose.yaml", "requirements.txt", "Cargo.toml"]
  
  for (const keyFile of keyFiles) {
    if (treeFiles.includes(keyFile)) {
      try {
        const headers: Record<string, string> = {}
        if (githubToken) {
          headers["Authorization"] = `Bearer ${githubToken}`
        }
        const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${keyFile}`, { headers })
        if (rawRes.ok) {
          configContent += `\n--- ${keyFile} ---\n${await rawRes.text()}\n`
        }
      } catch (e) {
        // ignore errors fetching individual files
      }
    }
  }

  // Construct the prompt
  const inputPrompt = `
Repository: ${owner}/${repo}

File Tree (filtered):
${treeFiles.slice(0, 1000).join("\n")}

Key Configurations:
${configContent ? configContent : "None found."}
  `.trim()

  const ai = google()
  const { object } = await generateObject({
    model: ai("gemini-2.5-flash"),
    schema: outputSchema,
    system: SYSTEM_PROMPT,
    prompt: inputPrompt,
  })

  // Build canvas nodes with proper shapes/colors
  const nodes: CanvasNode[] = object.nodes.map((n) => {
    const shape = pickShape(n.role)
    const color = pickColor(n.role)
    const size = SHAPE_DEFAULTS[shape]
    return {
      id: n.id,
      type: "canvasNode" as const,
      position: { x: 0, y: 0 }, // layout handled by client
      data: {
        label: n.label,
        shape,
        color: color.fill,
        textColor: color.text,
        decisionTrace: n.decisionTrace,
        summary: n.summary,
        endpoints: n.endpoints,
        fileLinks: n.fileLinks,
        hygieneChecklist: n.hygieneChecklist,
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
