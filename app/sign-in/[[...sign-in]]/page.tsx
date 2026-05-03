import { SignIn } from "@clerk/nextjs"
import Image from "next/image"

const features = [
  {
    title: "AI Architecture Generation",
    description: "Describe your system in plain English. AI maps it to nodes and edges on a live canvas.",
  },
  {
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

// Mini architecture preview nodes
const previewNodes = [
  { x: 60, y: 40, w: 90, h: 32, label: "Client App", color: "#10233D", text: "#52A8FF" },
  { x: 240, y: 40, w: 90, h: 32, label: "API Gateway", color: "#2E1938", text: "#BF7AF0" },
  { x: 420, y: 40, w: 90, h: 32, label: "Auth Service", color: "#331B00", text: "#FF990A" },
  { x: 150, y: 120, w: 90, h: 32, label: "User Service", color: "#0F2E18", text: "#62C073" },
  { x: 330, y: 120, w: 90, h: 32, label: "PostgreSQL", color: "#062822", text: "#0AC7B4" },
  { x: 240, y: 200, w: 90, h: 32, label: "Cache Layer", color: "#3C1618", text: "#FF6166" },
]

const previewEdges = [
  { x1: 150, y1: 56, x2: 240, y2: 56 },
  { x1: 330, y1: 56, x2: 420, y2: 56 },
  { x1: 285, y1: 72, x2: 195, y2: 120 },
  { x1: 285, y1: 72, x2: 375, y2: 120 },
  { x1: 285, y1: 136, x2: 285, y2: 200 },
]

export default function SignInPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col relative overflow-hidden bg-bg-base border-r border-border-default">
        {/* Background gradient blobs */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #00c8d4, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #6457f9, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10 px-12 pt-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SpecFrame" width={32} height={32} priority />
            <span className="text-base font-semibold text-text-primary tracking-tight">SpecFrame</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 py-10">
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-subtle px-3 py-1 text-xs text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-primary inline-block" />
              Now with Gemini 2.0 Flash
            </span>
          </div>

          <h1 className="mt-4 text-5xl font-bold text-text-primary leading-[1.1] tracking-tight mb-5">
            Design systems<br />
            <span style={{ background: "linear-gradient(135deg, #00c8d4, #6457f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              at the speed of thought.
            </span>
          </h1>
          <p className="text-text-secondary text-base leading-relaxed mb-10 max-w-sm">
            Describe your architecture in plain English. SpecFrame maps it to a shared canvas your whole team can refine in real time.
          </p>

          {/* Mini canvas preview */}
          <div className="rounded-2xl border border-border-default bg-bg-surface p-4 mb-10 overflow-hidden">
            <div className="mb-2 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-state-error opacity-60" />
              <div className="h-2 w-2 rounded-full bg-state-warning opacity-60" />
              <div className="h-2 w-2 rounded-full bg-state-success opacity-60" />
              <span className="ml-2 text-xs text-text-faint">Architecture Canvas</span>
            </div>
            <svg viewBox="0 0 560 250" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Grid dots */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="#2a2a30" />
                </pattern>
              </defs>
              <rect width="560" height="250" fill="url(#grid)" />

              {/* Edges */}
              {previewEdges.map((e, i) => (
                <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke="#3a3a42" strokeWidth="1.5" strokeDasharray="4 2" />
              ))}

              {/* Nodes */}
              {previewNodes.map((n, i) => (
                <g key={i}>
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="6"
                    fill={n.color} stroke={n.text} strokeWidth="0.8" strokeOpacity="0.4" />
                  <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 4.5}
                    textAnchor="middle" fontSize="10" fontWeight="500"
                    fill={n.text} fontFamily="ui-monospace, monospace">
                    {n.label}
                  </text>
                </g>
              ))}

              {/* AI cursor */}
              <g>
                <polygon points="420,180 426,192 429,187 436,192 432,184 438,184"
                  fill="#6457f9" opacity="0.9" />
                <rect x="428" y="194" width="52" height="16" rx="4" fill="#2E1938" />
                <text x="454" y="205" textAnchor="middle" fontSize="8" fill="#BF7AF0" fontFamily="ui-sans-serif, sans-serif">SpecFrame AI</text>
              </g>
            </svg>
          </div>

          {/* Features */}
          <ul className="space-y-4">
            {features.map(({ title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00c8d4, #6457f9)" }}>
                  <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#080809" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary leading-snug">{title}</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 px-12 pb-10">
          <p className="text-xs text-text-faint">© 2026 SpecFrame. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 lg:w-1/2 items-center justify-center p-8 bg-bg-base">
        <SignIn />
      </div>
    </main>
  )
}
