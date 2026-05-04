import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { NextRequest } from "next/server"

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = (await request.json().catch(() => ({}))) as any
  
  const data: any = {}
  if (body.name) data.name = body.name.trim()
  if (body.description !== undefined) data.description = body.description
  if (body.githubRepoUrl !== undefined) data.githubRepoUrl = body.githubRepoUrl

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 })
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  })

  return Response.json({ project: updated })
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

  await prisma.project.delete({ where: { id: projectId } })

  return new Response(null, { status: 204 })
}
