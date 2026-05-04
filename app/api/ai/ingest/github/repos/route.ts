import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clerkClient()
    const response = await client.users.getUserOauthAccessToken(userId, "oauth_github")
    
    let githubToken: string | null = null
    if (response.data && response.data.length > 0) {
      githubToken = response.data[0].token
    }

    if (!githubToken) {
      return NextResponse.json({ repos: [] })
    }

    // Fetch the user's repositories from GitHub
    // per_page=100 gets a good chunk of their repos. If they have more, we might need pagination, but this is fine for v1.
    const githubRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!githubRes.ok) {
      const errorText = await githubRes.text()
      console.error("Failed to fetch GitHub repos:", errorText)
      return NextResponse.json({ error: "Failed to fetch repositories from GitHub" }, { status: 502 })
    }

    const repos = await githubRes.json()

    // Map to a simpler structure for the frontend to digest
    const mappedRepos = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      html_url: r.html_url,
      updated_at: r.updated_at,
    }))

    return NextResponse.json({ repos: mappedRepos })
  } catch (error) {
    console.error("Error in GET /api/ai/ingest/github/repos:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
