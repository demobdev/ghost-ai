import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { userHasProjectAccess } from "@/lib/project-access"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { projectId } = await params
    const hasAccess = await userHasProjectAccess(userId, projectId)

    if (!hasAccess) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const reviews = await prisma.projectReview.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 1
    })

    return NextResponse.json(reviews.length > 0 ? reviews[0] : null)
  } catch (error) {
    console.error("[PROJECT_REVIEWS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { projectId } = await params
    const hasAccess = await userHasProjectAccess(userId, projectId)

    if (!hasAccess) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const body = await req.json()
    const { score, summary, findings } = body

    if (score === undefined || !summary || !findings) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const review = await prisma.projectReview.create({
      data: {
        projectId,
        score,
        summary,
        findings,
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("[PROJECT_REVIEWS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
