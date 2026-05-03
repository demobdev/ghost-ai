import { MarkerType } from "@xyflow/react"
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const C = NODE_COLORS

function n(
  id: string,
  label: string,
  colorIdx: number,
  shape: NodeShape,
  x: number,
  y: number,
  w?: number,
  h?: number
): CanvasNode {
  const def = SHAPE_DEFAULTS[shape]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: C[colorIdx].fill, textColor: C[colorIdx].text, shape },
    width: w ?? def.width,
    height: h ?? def.height,
  }
}

const MARKER_END = {
  type: MarkerType.ArrowClosed,
  color: "rgba(255,255,255,0.4)",
  width: 16,
  height: 16,
} as const

function e(id: string, source: string, target: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    data: { label: "" },
    markerEnd: MARKER_END,
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  // ─── existing 3 ────────────────────────────────────────────────────────────
  {
    id: "microservices",
    name: "Microservices",
    description: "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
    nodes: [
      n("ms-gw",    "API Gateway",       1, "rectangle", 240,   0),
      n("ms-auth",  "Auth Service",      2, "pill",        0, 160),
      n("ms-users", "User Service",      7, "rectangle",  200, 160),
      n("ms-orders","Order Service",     3, "rectangle",  380, 160),
      n("ms-pay",   "Payment Service",   5, "rectangle",  560, 160),
      n("ms-udb",   "User DB",           0, "cylinder",   200, 320),
      n("ms-odb",   "Order DB",          0, "cylinder",   380, 320),
    ],
    edges: [
      e("ms-e1", "ms-gw",    "ms-auth"),
      e("ms-e2", "ms-gw",    "ms-users"),
      e("ms-e3", "ms-gw",    "ms-orders"),
      e("ms-e4", "ms-gw",    "ms-pay"),
      e("ms-e5", "ms-users", "ms-udb"),
      e("ms-e6", "ms-orders","ms-odb"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description: "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
    nodes: [
      n("ci-src",   "Source Code",          1, "rectangle",    0, 60),
      n("ci-build", "Build",                3, "rectangle",  220, 60),
      n("ci-test",  "Test Suite",           6, "diamond",    440, 30),
      n("ci-pkg",   "Package",              1, "rectangle",  680, 60),
      n("ci-stg",   "Deploy Staging",       3, "rectangle",  900, 60),
      n("ci-int",   "Integration Tests",    2, "diamond",   1120, 30),
      n("ci-prod",  "Deploy Production",    7, "rectangle", 1360, 60),
    ],
    edges: [
      e("ci-e1", "ci-src",   "ci-build"),
      e("ci-e2", "ci-build", "ci-test"),
      e("ci-e3", "ci-test",  "ci-pkg"),
      e("ci-e4", "ci-pkg",   "ci-stg"),
      e("ci-e5", "ci-stg",   "ci-int"),
      e("ci-e6", "ci-int",   "ci-prod"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
    nodes: [
      n("ev-p1",     "Producer A",        1, "rectangle",   0, 100),
      n("ev-p2",     "Producer B",        1, "rectangle",   0, 240),
      n("ev-broker", "Message Broker",    3, "hexagon",   260, 130),
      n("ev-c1",     "Consumer A",        6, "rectangle", 540,  60),
      n("ev-c2",     "Consumer B",        7, "rectangle", 540, 220),
      n("ev-store",  "Event Store",       0, "cylinder",  260, 360),
      n("ev-dlq",    "Dead Letter Queue", 4, "rectangle", 540, 380),
    ],
    edges: [
      e("ev-e1", "ev-p1",     "ev-broker"),
      e("ev-e2", "ev-p2",     "ev-broker"),
      e("ev-e3", "ev-broker", "ev-c1"),
      e("ev-e4", "ev-broker", "ev-c2"),
      e("ev-e5", "ev-broker", "ev-store"),
      e("ev-e6", "ev-c1",     "ev-dlq"),
      e("ev-e7", "ev-c2",     "ev-dlq"),
    ],
  },

  // ─── 6 new templates ───────────────────────────────────────────────────────

  // 4. Serverless API — Lambda fan-out from a single API Gateway
  {
    id: "serverless-api",
    name: "Serverless API",
    description: "CDN and API Gateway fan out to isolated Lambda functions, each owning its own datastore and pulling secrets from a central manager.",
    nodes: [
      n("sv-cdn",  "CDN",           7, "hexagon",    300,   0),
      n("sv-gw",   "API Gateway",   1, "rectangle",  300, 160),
      n("sv-la",   "λ Auth",        2, "pill",         0, 320),
      n("sv-lu",   "λ Users",       1, "pill",       200, 320),
      n("sv-lp",   "λ Products",    6, "pill",       420, 320),
      n("sv-lm",   "λ Media",       7, "pill",       640, 320),
      n("sv-sec",  "Secrets Mgr",   3, "cylinder",     0, 480),
      n("sv-udb",  "Users DDB",     1, "cylinder",   200, 480),
      n("sv-pdb",  "Products DDB",  6, "cylinder",   420, 480),
      n("sv-s3",   "S3 Bucket",     7, "cylinder",   640, 480),
    ],
    edges: [
      e("sv-e1", "sv-cdn", "sv-gw"),
      e("sv-e2", "sv-gw",  "sv-la"),
      e("sv-e3", "sv-gw",  "sv-lu"),
      e("sv-e4", "sv-gw",  "sv-lp"),
      e("sv-e5", "sv-gw",  "sv-lm"),
      e("sv-e6", "sv-la",  "sv-sec"),
      e("sv-e7", "sv-lu",  "sv-udb"),
      e("sv-e8", "sv-lp",  "sv-pdb"),
      e("sv-e9", "sv-lm",  "sv-s3"),
    ],
  },

  // 5. Real-time Chat — WebSocket gateway, Redis pub/sub, media CDN
  {
    id: "realtime-chat",
    name: "Real-time Chat",
    description: "WebSocket gateway distributes messages via Redis Pub/Sub. Auth, push notifications, and media uploads are handled by dedicated services.",
    nodes: [
      n("rc-web",   "Web Client",        1, "rectangle",   0,   0),
      n("rc-mob",   "Mobile Client",     1, "rectangle",  240,   0),
      n("rc-wsg",   "WebSocket GW",      3, "hexagon",    100, 180),
      n("rc-cdn",   "Media CDN",         7, "hexagon",    400, 180),
      n("rc-red",   "Redis Pub/Sub",     4, "hexagon",      0, 380),
      n("rc-auth",  "Auth Service",      2, "rectangle",  240, 380),
      n("rc-push",  "Push Notif",        5, "rectangle",  440, 380),
      n("rc-msg",   "Message Store",     6, "cylinder",     0, 560),
      n("rc-usr",   "User Service",      1, "rectangle",  240, 560),
      n("rc-obj",   "Object Storage",    7, "cylinder",   440, 560),
    ],
    edges: [
      e("rc-e1", "rc-web",  "rc-wsg"),
      e("rc-e2", "rc-mob",  "rc-wsg"),
      e("rc-e3", "rc-wsg",  "rc-red"),
      e("rc-e4", "rc-wsg",  "rc-auth"),
      e("rc-e5", "rc-wsg",  "rc-cdn"),
      e("rc-e6", "rc-red",  "rc-msg"),
      e("rc-e7", "rc-auth", "rc-usr"),
      e("rc-e8", "rc-auth", "rc-push"),
      e("rc-e9", "rc-cdn",  "rc-obj"),
    ],
  },

  // 6. ML/AI Pipeline — data through training to live inference
  {
    id: "ml-pipeline",
    name: "ML / AI Pipeline",
    description: "Raw data flows from ingestion through a feature store into a training cluster. The resulting model is registered and served via an inference API with live monitoring.",
    nodes: [
      n("ml-raw",  "Raw Data",          1, "cylinder",      0,  40),
      n("ml-ing",  "Ingestion",         3, "rectangle",   220,  40),
      n("ml-feat", "Feature Store",     2, "rectangle",   440,  40),
      n("ml-trn",  "Train Cluster",     6, "rectangle",   680,   0),
      n("ml-reg",  "Model Registry",    7, "cylinder",    920,  40),
      n("ml-inf",  "Inference API",     1, "rectangle",  1140,  40),
      n("ml-mon",  "Monitoring",        3, "rectangle",  1380,  40),
      n("ml-lake", "Data Lake",         0, "cylinder",    220, 220),
      n("ml-exp",  "Experiment Tracker",5, "rectangle",   680, 220),
      n("ml-ab",   "A/B Testing",       2, "diamond",    1140, 220),
    ],
    edges: [
      e("ml-e1", "ml-raw",  "ml-ing"),
      e("ml-e2", "ml-ing",  "ml-feat"),
      e("ml-e3", "ml-ing",  "ml-lake"),
      e("ml-e4", "ml-feat", "ml-trn"),
      e("ml-e5", "ml-trn",  "ml-reg"),
      e("ml-e6", "ml-trn",  "ml-exp"),
      e("ml-e7", "ml-reg",  "ml-inf"),
      e("ml-e8", "ml-inf",  "ml-mon"),
      e("ml-e9", "ml-inf",  "ml-ab"),
    ],
  },

  // 7. Multi-tenant SaaS — shared control plane, isolated data plane
  {
    id: "multitenant-saas",
    name: "Multi-tenant SaaS",
    description: "A shared control plane handles auth and routing. A tenant router directs each request to an isolated per-tenant database while shared cache and search serve all tenants.",
    nodes: [
      n("mt-ta",  "Tenant A",         1, "rectangle",    0,   0),
      n("mt-tb",  "Tenant B",         1, "rectangle",  200,   0),
      n("mt-tc",  "Tenant C",         1, "rectangle",  400,   0),
      n("mt-lb",  "Load Balancer",    3, "rectangle",  160, 160),
      n("mt-auth","Auth Service",     2, "rectangle",  400, 160),
      n("mt-app", "App Server",       6, "rectangle",  160, 320),
      n("mt-rtr", "Tenant Router",    3, "diamond",    160, 500),
      n("mt-cch", "Shared Cache",     7, "cylinder",   400, 320),
      n("mt-dba", "DB — Tenant A",    1, "cylinder",     0, 660),
      n("mt-dbb", "DB — Tenant B",    6, "cylinder",   320, 660),
    ],
    edges: [
      e("mt-e1", "mt-ta",   "mt-lb"),
      e("mt-e2", "mt-tb",   "mt-lb"),
      e("mt-e3", "mt-tc",   "mt-auth"),
      e("mt-e4", "mt-lb",   "mt-app"),
      e("mt-e5", "mt-auth", "mt-app"),
      e("mt-e6", "mt-app",  "mt-rtr"),
      e("mt-e7", "mt-app",  "mt-cch"),
      e("mt-e8", "mt-rtr",  "mt-dba"),
      e("mt-e9", "mt-rtr",  "mt-dbb"),
    ],
  },

  // 8. Data Lakehouse — ETL pipeline from sources to BI & ML
  {
    id: "data-lakehouse",
    name: "Data Lakehouse",
    description: "Multiple event and CDC sources feed an ingestion layer. Raw data lands in S3, is transformed by Spark, and surfaces in a warehouse for BI dashboards and ML feature stores.",
    nodes: [
      n("dl-app",  "App Events",       1, "pill",          0,   0),
      n("dl-cdc",  "DB Change Feed",   6, "pill",        200,   0),
      n("dl-api",  "Third-party APIs", 7, "pill",        400,   0),
      n("dl-ing",  "Ingestion Svc",    3, "rectangle",   180, 160),
      n("dl-s3",   "S3 Data Lake",     0, "cylinder",    180, 320),
      n("dl-sp",   "Spark Transform",  2, "rectangle",   180, 480),
      n("dl-dw",   "Data Warehouse",   1, "cylinder",      0, 640),
      n("dl-ml",   "ML Feature Store", 6, "cylinder",    340, 640),
      n("dl-bi",   "BI Dashboard",     7, "rectangle",     0, 800),
      n("dl-alr",  "Alerts",           4, "rectangle",   340, 800),
    ],
    edges: [
      e("dl-e1", "dl-app", "dl-ing"),
      e("dl-e2", "dl-cdc", "dl-ing"),
      e("dl-e3", "dl-api", "dl-ing"),
      e("dl-e4", "dl-ing", "dl-s3"),
      e("dl-e5", "dl-s3",  "dl-sp"),
      e("dl-e6", "dl-sp",  "dl-dw"),
      e("dl-e7", "dl-sp",  "dl-ml"),
      e("dl-e8", "dl-dw",  "dl-bi"),
      e("dl-e9", "dl-dw",  "dl-alr"),
    ],
  },

  // 9. Mobile Backend — BaaS-style hub for iOS & Android
  {
    id: "mobile-backend",
    name: "Mobile Backend",
    description: "iOS and Android clients connect to an API gateway that fans out to auth, user profile, push notifications, offline sync, and a media CDN backed by object storage.",
    nodes: [
      n("mb-ios",  "iOS App",          1, "rectangle",    0, 100),
      n("mb-and",  "Android App",      6, "rectangle",    0, 280),
      n("mb-gw",   "API Gateway",      3, "hexagon",    220, 180),
      n("mb-auth", "Auth Service",     2, "rectangle",  480,   0),
      n("mb-usr",  "User Service",     1, "rectangle",  480, 140),
      n("mb-push", "Push Notif",       5, "rectangle",  480, 280),
      n("mb-sync", "Sync Service",     7, "rectangle",  480, 420),
      n("mb-cdn",  "Media CDN",        7, "hexagon",    220, 420),
      n("mb-obj",  "Object Storage",   0, "cylinder",   220, 600),
      n("mb-pg",   "PostgreSQL",       6, "cylinder",   720, 200),
    ],
    edges: [
      e("mb-e1", "mb-ios",  "mb-gw"),
      e("mb-e2", "mb-and",  "mb-gw"),
      e("mb-e3", "mb-gw",   "mb-auth"),
      e("mb-e4", "mb-gw",   "mb-usr"),
      e("mb-e5", "mb-gw",   "mb-push"),
      e("mb-e6", "mb-gw",   "mb-sync"),
      e("mb-e7", "mb-gw",   "mb-cdn"),
      e("mb-e8", "mb-cdn",  "mb-obj"),
      e("mb-e9", "mb-usr",  "mb-pg"),
      e("mb-e10","mb-sync", "mb-pg"),
    ],
  },
]
