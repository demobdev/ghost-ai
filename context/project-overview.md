# TrueGraph

## Overview

TrueGraph is a real-time collaborative system design workspace. Users describe a system in plain English, an AI agent (powered by Google Gemini) maps that system onto a shared canvas, collaborators refine the architecture in real-time, and the app generates a downloadable technical specification from the resulting graph.

## Goals

1. Let authenticated users create and manage architecture projects.
2. Provide a collaborative real-time canvas for system design.
3. Let users import prebuilt starter system designs into the canvas.
4. Let AI generate an initial architecture from a natural language prompt.
5. Let AI review and critique an existing architecture for issues.
6. Let collaborators refine the generated architecture in real-time.
7. Convert the final graph into a persistent, downloadable Markdown technical spec.
8. Allow users to export the canvas as a PNG image for use in presentations or docs.

## Core User Flow

1. User signs in.
2. User creates or selects a project.
3. User enters the project workspace.
4. User optionally imports a starter system design template into the canvas.
5. User prompts the AI to generate or extend the system design.
6. AI generates nodes and edges in the shared canvas.
7. Collaborators edit and refine the design.
8. User triggers spec generation.
9. App persists the generated Markdown spec to Vercel Blob.
10. User previews, edits, and downloads the spec.

## Features

### Authentication and Projects

- User sign-in and route protection via Clerk.
- Project creation, ownership, and collaborator access.
- Project list, workspace navigation, archive/restore, and duplication.

### Collaborative Canvas

- Shared real-time canvas using Liveblocks and React Flow.
- Live cursors, presence indicators, and node/edge editing.
- Canvas snapshots persisted to Vercel Blob (autosave, debounced 2s).
- Node grouping and swimlanes for large diagrams.
- Canvas export as PNG for use in external documents.

### Starter System Designs

- A curated library of prebuilt system design templates.
- Users can import a starter template into the canvas at any point during editing.
- Templates are static canvas snapshots loaded directly into the active room.
- Covers common patterns: monolith, microservices, event-driven, serverless, and more.

### AI Architecture Generation

- AI generates a system design from a user-supplied prompt (Google Gemini 2.0 Flash).
- Output is structured as canvas nodes and edges written into the shared room.
- Generation runs as a durable background task via Trigger.dev.

### AI Architecture Review

- AI critiques the current canvas and returns actionable feedback.
- Identifies anti-patterns (single points of failure, missing layers, etc.).
- Returns findings with severity levels (warning / suggestion).

### Spec Generation

- The current canvas graph is converted into a Markdown technical specification.
- Specs are persisted to Vercel Blob and linked to the project in the database.
- Users can preview, edit, and download generated specs.
- Canvas diagram image embedded in spec for a self-contained document.

## Scope

### In Scope

- Authentication and route protection
- Project creation, ownership, archive/restore, and duplication
- Collaborator access by project
- Starter system design template library and import
- Real-time shared canvas with nodes, edges, groups, and presence
- Node comments via Liveblocks threads
- AI-powered architecture generation from prompts
- AI-powered architecture review and critique
- AI-powered Markdown spec generation from the canvas graph
- Spec version history UI
- Spec preview, editing, and download
- Canvas PNG export
- Public read-only project sharing
- Persistent storage for project metadata and generated artifacts

### Out Of Scope

- Billing and subscription systems
- Enterprise permission tiers beyond owner and collaborator
- Mobile-native applications
- Production object storage migration (Vercel Blob handles this)

## Success Criteria

1. A signed-in user can create and open a project.
2. Multiple users can collaborate in the same canvas simultaneously.
3. A user can import a prebuilt starter design into the canvas.
4. AI can generate an architecture into the shared room from a prompt.
5. AI can review and critique an existing architecture.
6. The graph can be converted into a persisted, downloadable Markdown spec.
7. Project metadata and generated artifacts are stored in the correct layers.
8. The canvas can be exported as a PNG image.
