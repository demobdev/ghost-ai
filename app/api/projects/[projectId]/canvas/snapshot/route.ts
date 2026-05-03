import { put } from "@vercel/blob"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return Response.json({ error: "Not found" }, { status: 404 })

  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

  const contentType = request.headers.get("content-type") ?? "image/png"
  const body = await request.arrayBuffer()

  const blob = await put(
    `snapshots/${projectId}/${Date.now()}.png`,
    body,
    {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    }
  )

  return Response.json({ url: blob.url }, { status: 201 })
}
