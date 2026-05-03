import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, specId } = await params

  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Forbidden" }, { status: 403 })

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
  })
  if (!spec) return Response.json({ error: "Not found" }, { status: 404 })

  const blobHeaders = {
    Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
  }

  // Fetch spec markdown
  const specRes = await fetch(spec.filePath, { headers: blobHeaders })
  if (!specRes.ok) return Response.json({ error: "Spec file unavailable" }, { status: 502 })
  const specText = await specRes.text()

  const zip = new JSZip()
  zip.file("spec.md", specText)

  // Attach canvas PNG if available
  if (spec.snapshotUrl) {
    const imgRes = await fetch(spec.snapshotUrl, { headers: blobHeaders })
    if (imgRes.ok) {
      const imgBuffer = await imgRes.arrayBuffer()
      zip.file("architecture.png", imgBuffer)
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
  const zipBytes = new Uint8Array(zipBuffer)

  return new Response(zipBytes, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="specframe-bundle-${specId}.zip"`,
      "Content-Length": String(zipBytes.byteLength),
    },
  })
}
