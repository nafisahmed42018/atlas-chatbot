---
marp: true
theme: default
paginate: true
style: |
  :root {
    --primary: #18181b;
    --accent: #6366f1;
    --accent-light: #a5b4fc;
    --surface: #f4f4f5;
    --muted: #71717a;
    --white: #ffffff;
    --danger: #ef4444;
    --success: #22c55e;
    --warning: #f59e0b;
  }

  section {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background: var(--white);
    color: var(--primary);
    padding: 52px 60px;
    font-size: 18px;
    line-height: 1.6;
  }

  h1 {
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 0.3em;
    line-height: 1.2;
  }

  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--primary);
    border-bottom: 3px solid var(--accent);
    padding-bottom: 0.3em;
    margin-bottom: 0.8em;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 0.4em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  p { margin: 0.4em 0; }

  ul, ol {
    padding-left: 1.4em;
    margin: 0.4em 0;
  }

  li { margin: 0.35em 0; }

  code {
    background: var(--surface);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
    color: var(--accent);
  }

  pre {
    background: var(--primary);
    color: #e4e4e7;
    border-radius: 10px;
    padding: 20px 24px;
    font-size: 0.78em;
    line-height: 1.6;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85em;
    margin-top: 0.6em;
  }

  th {
    background: var(--primary);
    color: var(--white);
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 9px 14px;
    border-bottom: 1px solid #e4e4e7;
  }

  tr:nth-child(even) td { background: var(--surface); }

  blockquote {
    border-left: 4px solid var(--accent);
    padding: 10px 20px;
    background: #eef2ff;
    border-radius: 0 8px 8px 0;
    color: var(--primary);
    margin: 1em 0;
    font-style: normal;
  }

  .tag {
    display: inline-block;
    background: var(--accent);
    color: white;
    border-radius: 100px;
    padding: 2px 12px;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  section.cover {
    background: var(--primary);
    color: var(--white);
    justify-content: center;
    display: flex;
    flex-direction: column;
  }

  section.cover h1 {
    color: var(--white);
    font-size: 3rem;
  }

  section.cover h3 {
    color: var(--accent-light);
    font-size: 1rem;
  }

  section.cover p {
    color: #a1a1aa;
    font-size: 0.95rem;
  }

  section.dark {
    background: var(--primary);
    color: var(--white);
  }

  section.dark h2 {
    color: var(--white);
    border-color: var(--accent);
  }

  section.dark h3 { color: var(--accent-light); }
  section.dark td { border-color: #3f3f46; }
  section.dark tr:nth-child(even) td { background: #27272a; }
  section.dark th { background: #27272a; }
  section.dark blockquote {
    background: #1e1b4b;
    color: var(--accent-light);
  }

  section.accent {
    background: var(--accent);
    color: var(--white);
  }

  section.accent h1, section.accent h2 { color: var(--white); border-color: var(--accent-light); }
  section.accent h3 { color: var(--accent-light); }

  .cols-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-top: 0.6em;
  }

  .cols-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    margin-top: 0.6em;
  }

  .card {
    background: var(--surface);
    border-radius: 10px;
    padding: 20px 22px;
    border-left: 4px solid var(--accent);
  }

  .card-title {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.4em;
  }

  .pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 0.75em;
    font-weight: 600;
  }

  .pill-green { background: #dcfce7; color: #15803d; }
  .pill-yellow { background: #fef9c3; color: #854d0e; }
  .pill-red { background: #fee2e2; color: #b91c1c; }
  .pill-blue { background: #dbeafe; color: #1d4ed8; }

  footer {
    font-size: 0.72em;
    color: var(--muted);
  }
---

<!-- _class: cover -->
<!-- _paginate: false -->

### Atlas Chatbot — Technical Presentation

# AI-Powered Customer Support Platform

<br>

**Multi-tenant · RAG-backed · Real-time**

<br>

---

<!-- _class: dark -->
<!-- _paginate: false -->

## Agenda

<div class="cols-2">
<div>

**Product**
1. Problem & Solution
2. Key Features
3. User Flows

**Architecture**

4. System Architecture
5. Multi-Tenancy Model
6. Data Model (ERD)

</div>
<div>

**AI & Backend**

7. RAG Pipeline
8. AI Agent & Tools
9. API Surface

**Engineering**

10. Tech Stack
11. Security Model
12. Roadmap

</div>
</div>

---

## The Problem

Support teams face three compounding challenges:

<div class="cols-3">
<div class="card">
<div class="card-title">📈 Volume</div>
Repetitive questions consume agent time that should go to complex problems
</div>
<div class="card">
<div class="card-title">⏱ Availability</div>
Customers expect instant responses at any hour, but human agents are not always online
</div>
<div class="card">
<div class="card-title">🗂 Knowledge</div>
Answers live in PDFs, wikis, and docs — agents spend time finding before answering
</div>
</div>

<br>

> **Generic AI chatbots hallucinate.** They confidently give wrong answers because they have no access to your private knowledge base.

---

## The Solution — Atlas Chatbot

An embeddable AI support assistant that answers from **your documents only**.

<div class="cols-2">
<div>

**For operators**
- Web dashboard to manage conversations
- Upload knowledge base documents (PDF, CSV, TXT)
- Reply directly as a human when the AI can't help
- Real-time conversation monitoring

</div>
<div>

**For customers**
- Lightweight chat widget embedded on any website
- AI answers grounded in the org's knowledge base
- Seamless handoff to a human operator
- No account required — just name + email

</div>
</div>

---

## Key Features

| Feature | Description |
|---|---|
| **RAG Knowledge Base** | Upload documents — AI only answers from them, never guesses |
| **Embeddable Widget** | `<iframe>` drop-in, scoped to an org via `?organizationId=` |
| **Multi-Tenant** | One deployment serves many organizations, fully isolated |
| **Real-Time Sync** | Dashboard and widget update live via Convex reactive queries |
| **AI Enhance** | Operators can AI-polish their reply drafts before sending |
| **Conversation Status** | Unresolved → Escalated → Resolved lifecycle |
| **Session Persistence** | Widget remembers visitors for 24 hours (localStorage + DB) |
| **Input Security** | HTML stripping, prompt injection blocking, MIME allowlisting |

---

## User Flows

<div class="cols-2">
<div>

### Admin / Operator Flow

```
Sign Up
  └─► Create Organization
        └─► Dashboard
              ├─► Upload Documents
              │     └─► RAG indexed
              ├─► View Conversations
              │     └─► Review & Reply
              └─► Manage Settings
```

</div>
<div>

### Customer Chat Flow

```
Open Widget
  └─► Loading (org validated)
        └─► Auth (name + email)
              └─► Selection
                    └─► Ask Question
                          ├─► RAG Search
                          │     ├─► Generate Answer
                          │     └─► No Answer → Handoff
                          └─► Follow-up Question
```

</div>
</div>

---

<!-- _class: dark -->

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│                                                              │
│    ┌─────────────────┐         ┌──────────────────────┐     │
│    │  Dashboard App  │         │    Chat Widget App   │     │
│    │  apps/web :3000 │         │  apps/widget :3001   │     │
│    │  Clerk auth     │         │  No auth — public    │     │
│    └────────┬────────┘         └──────────┬───────────┘     │
└─────────────┼────────────────────────────┼──────────────────┘
              │  Convex SDK (authenticated) │  Convex SDK (public)
              ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│           CONVEX BACKEND  (packages/backend)                │
│   private/*          public/*            system/*           │
│   (JWT required)     (session-gated)     (internal only)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    ┌──────────┐             ┌────────────┐
    │  Clerk   │             │   OpenAI   │
    │  Org auth│             │ gpt-4o-mini│
    │  JWT     │             │ embeddings │
    └──────────┘             └────────────┘
```

---

## Frontend Architecture

<div class="cols-2">
<div>

### Dashboard (`apps/web`)

**Next.js 15 App Router**

Route groups:
- `(auth)/` — sign-in, sign-up, org-selection
- `(dashboard)/` — conversations, files, settings

Key patterns:
- Clerk middleware protects all dashboard routes
- Redirect to `/org-selection` if no active org
- Convex reactive queries — no polling needed
- Infinite scroll on message thread

</div>
<div>

### Widget (`apps/widget`)

**Next.js 15, single page**

URL contract:
```
/?organizationId=org_xxx
```

Screen state machine:

```
loading → auth → selection → chat
    └──────────────────────► error
```

- Screen driven by Jotai `screenAtom`
- Session stored in localStorage per org
- No Clerk — fully public
- Inline error warnings (no redirects)

</div>
</div>

---

## Multi-Tenancy Model

Every piece of data is isolated by `organizationId`.

<div class="cols-2">
<div>

**Isolation boundaries**

| Layer | Mechanism |
|---|---|
| Auth | Clerk org JWT |
| DB queries | `orgId` filter on every private fn |
| RAG search | Per-org namespace — no cross-org results |
| Sessions | `organizationId` on every `contactSession` |
| Files | `uploadedBy: orgId` checked before delete |

</div>
<div>

**Search isolation example**

```
Visitor → Org A widget
  │
  ▼
searchTool
  │
  ├─ getByThreadId
  │   └─ conversation.organizationId = "org_A"
  │
  └─ rag.search(namespace: "org_A")
      └─ Only Org A docs searched
         Org B namespace never touched
```

</div>
</div>

---

## Data Model

Based on the ERD diagram:

<div class="cols-2">
<div>

**`conversations`**
- `threadId` — AI agent thread
- `organizationId` — tenant scope
- `contactSessionId` → `contactSessions`
- `status`: unresolved · escalated · resolved

**`contactSessions`**
- `name`, `email` — visitor identity
- `organizationId` — org scope
- `expiresAt` — 24-hour TTL
- `metadata` — browser fingerprint

**`users`**
- Minimal internal record
- Full identity managed by Clerk

</div>
<div>

**Managed by Convex components**

`@convex-dev/agent` manages:
- Thread records
- Message history

`@convex-dev/rag` manages:
- Document entries
- Vector embeddings
- Namespaces

**Key indexes**
- `conversations.by_thread_id` — used by AI tools
- `conversations.by_status_and_organization_id` — dashboard filters
- `contactSessions.by_expires_at` — future cleanup job

</div>
</div>

---

## Conversation Lifecycle

```
                   create()
                      │
                      ▼
               ┌─────────────┐
               │ UNRESOLVED  │ ◄──────────────────────── operator resets
               └──────┬──────┘
                      │
         ┌────────────┴────────────────┐
         │                             │
AI detects frustration         operator or AI confirms resolved
escalateConversationTool        resolveConversationTool
         │                             │
         ▼                             ▼
   ┌──────────┐                 ┌──────────┐
   │ESCALATED │ ──────────────► │ RESOLVED │
   └──────────┘  operator acts  └──────────┘
```

- **Unresolved** — AI is actively handling
- **Escalated** — flagged for human intervention; appears highlighted in dashboard
- **Resolved** — closed; widget input disabled

---

<!-- _class: dark -->

## RAG Pipeline

Two distinct flows: **Ingestion** and **Query**

<div class="cols-2">
<div>

### Ingestion (Document Upload)

```
Operator uploads file
  │
  ▼
Frontend validation
(type, size, filename)
  │
  ▼
Convex Storage (blob)
  │
  ▼
extractTextContent()
(PDF / CSV / TXT → text)
  │
  ▼
contentHash check
(skip if duplicate)
  │
  ▼
text-embedding-3-small
(1536 dimensions)
  │
  ▼
RAG namespace (org_id)
```

</div>
<div>

### Query (Visitor Message)

```
Visitor sends message
  │
  ▼
supportAgent.generateText()
  │
  ▼
searchTool called
  │
  ▼
rag.search(namespace: orgId)
top-5 matching chunks
  │
  ▼
SEARCH_INTERPRETER_PROMPT
+ gpt-4o-mini
  │
  ▼
Conversational answer
grounded in documents
  │
  ▼
Saved to thread + returned
```

</div>
</div>

---

## RAG — Document Ingestion Detail

Following the workflow diagram:

| Step | What Happens | Technology |
|---|---|---|
| **1. Upload** | Operator selects PDF / CSV / TXT (max 10 MB) | React Dropzone + Zod |
| **2. Parse Text** | Binary → plain text extraction | `extractTextContent.ts` |
| **3. Chunk** | Text split into overlapping segments | `@convex-dev/rag` internal |
| **4. Embed** | Each chunk → 1536-dimension vector | OpenAI `text-embedding-3-small` |
| **5. Store Vectors** | Vectors stored in org's RAG namespace | Convex RAG component |
| **6. Content Hash** | SHA hash prevents re-indexing same file | `contentHashFromArrayBuffer` |

> Documents are **never mixed across organizations**. Each org has its own isolated namespace in the vector store.

---

## AI Agent Architecture

```
public/messages.create (Convex Action)
  │
  ▼
supportAgent.generateText()       Model: gpt-4o-mini
  │                               Max steps: 5
  │  System prompt: SUPPORT_AGENT_PROMPT
  │
  ├─ Greeting / farewell? ──────────────────► Respond directly
  │
  ├─ Product question? ─────────────────────► searchTool
  │                                              └─ RAG search (org-scoped)
  │                                              └─ SEARCH_INTERPRETER_PROMPT
  │                                              └─ Plain text answer
  │
  ├─ Frustrated / wants human? ─────────────► escalateConversationTool
  │                                              └─ system/conversations.escalate
  │
  └─ Issue confirmed resolved? ─────────────► resolveConversationTool
                                                 └─ system/conversations.resolve
```

---

## Agent Tools

<div class="cols-3">
<div class="card">
<div class="card-title">🔍 searchTool</div>

1. Resolve `orgId` from thread
2. `rag.search(namespace: orgId, limit: 5)`
3. Pass results + query to interpreter LLM
4. Save + return answer

**Trigger:** Any product/service question
</div>

<div class="card">
<div class="card-title">⬆️ escalateConversationTool</div>

1. Call `system/conversations.escalate`
2. Patch status → `"escalated"`
3. Save handoff message to thread

**Trigger:** Customer requests human, expresses frustration, AI cannot resolve
</div>

<div class="card">
<div class="card-title">✅ resolveConversationTool</div>

1. Call `system/conversations.resolve`
2. Patch status → `"resolved"`
3. Save closing message to thread

**Trigger:** Customer confirms issue resolved, says goodbye
</div>
</div>

<br>

> **Anti-hallucination rule (in system prompt):** If it's not in the search results, the agent does not know it — it offers human support instead of guessing.

---

## AI Prompts

Three prompts govern AI behavior, all in `system/ai/prompts.ts`:

| Prompt | Used By | Key Rules |
|---|---|---|
| `SUPPORT_AGENT_PROMPT` | `supportAgent` system instructions | Decision tree, anti-jailbreak, no markdown in output, never announce tool calls, no filler phrases |
| `SEARCH_INTERPRETER_PROMPT` | `searchTool` second LLM call | Extract answer from RAG chunks, cite sources, exact "not found" response, no guessing (ban "usually", "typically") |
| `OPERATOR_MESSAGE_ENHANCEMENT_PROMPT` | `private/messages.enhanceResponse` | Fix grammar/clarity, preserve intent + specifics, passthrough if already good, don't pad short messages |

---

## API Surface

<div class="cols-2">
<div>

### `public/*` — Widget API (no auth)

| Function | Type | Purpose |
|---|---|---|
| `organizations.validate` | Action | Verify org ID via Clerk |
| `contactSessions.create` | Mutation | Start visitor session |
| `contactSessions.validate` | Mutation | Re-validate stored session |
| `conversations.create` | Mutation | New conversation + thread |
| `conversations.getOne` | Query | Fetch conversation |
| `conversations.getMany` | Query | List visitor's conversations |
| `messages.create` | Action | Send message, run AI |
| `messages.getMany` | Query | Paginated message history |

</div>
<div>

### `private/*` — Dashboard API (Clerk JWT)

| Function | Type | Purpose |
|---|---|---|
| `conversations.getMany` | Query | List org conversations |
| `conversations.getOne` | Query | Single conversation + session |
| `conversations.updateStatus` | Mutation | Change status |
| `messages.create` | Mutation | Operator reply |
| `messages.enhanceResponse` | Action | AI-polish draft |
| `messages.getMany` | Query | Thread messages |
| `files.addFile` | Action | Upload + RAG index |
| `files.deleteFile` | Mutation | Remove from storage + RAG |
| `files.list` | Query | List org files |

</div>
</div>

---

## Tech Stack

<div class="cols-2">
<div>

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Components | `@workspace/ui` (shared) |
| State | Jotai (atomic) |
| Forms | React Hook Form + Zod |

</div>
<div>

| Layer | Technology |
|---|---|
| Auth | Clerk (operators only) |
| Backend | Convex (serverless) |
| Database | Convex built-in (document store) |
| AI Agent | `@convex-dev/agent` |
| RAG | `@convex-dev/rag` |
| LLM | OpenAI `gpt-4o-mini` |
| Embeddings | OpenAI `text-embedding-3-small` |

</div>
</div>

---

## Security Model

Every input is validated at two layers: frontend (fast feedback) and backend (authoritative).

<div class="cols-2">
<div>

**Input sanitization** (`lib/sanitize.ts`)

| Input | Rules |
|---|---|
| Visitor name | Max 16, letters/spaces only |
| Email | RFC format, max 254, lowercased |
| Widget message | Strip HTML, max 500, injection blocked |
| Operator reply | Strip HTML, max 2000 |
| Enhance prompt | Strip HTML, max 2000, injection blocked |
| Filename | No path traversal (`..`, `/`), allowed ext only |
| MIME type | Allowlist: pdf, csv, txt |
| File size | Max 10 MB |

</div>
<div>

**Prompt injection patterns blocked**

```
ignore (all) previous instructions
forget everything
you are now
act as a / an
[system] / <system>
new instructions:
disregard prior instructions
override instructions
jailbreak
do anything now
dan mode
```

**Authorization**
- All `private/*` functions verify `orgId` from Clerk JWT
- All `public/*` functions validate `contactSession` ownership
- `system/*` functions are `internal` — never callable from clients

</div>
</div>

---

## State Management

### Jotai Atoms (Widget)

| Atom | Persisted | Description |
|---|---|---|
| `screenAtom` | No | Active screen — starts at `"loading"` |
| `organizationIdAtom` | No | Set after Clerk validation on load |
| `contactSessionIdAtomFamily(orgId)` | **Yes** (localStorage) | Per-org session. Key: `atlas_contact_session_<orgId>` |
| `errorMessageAtom` | No | Message shown on error screen |
| `loadingMessageAtom` | No | Step description during loading |
| `conversationIdAtom` | No | Active conversation in chat screen |

`atomFamily` creates one atom instance per `orgId` — multiple orgs can coexist in the same browser session without collision.

---

## Build & Development

```bash
# Install all dependencies
pnpm install

# Initialize Convex (first time only)
cd packages/backend && pnpm run setup

# Run everything in parallel
pnpm dev
# → Dashboard    http://localhost:3000
# → Widget       http://localhost:3001
# → Convex       syncs automatically
```

### Turborepo Pipeline

```
dev   ──► all apps + Convex backend (concurrent, non-cached)
build ──► packages/ui → apps/web + apps/widget (dependency order)
lint  ──► all packages (parallel)
```

---

## Roadmap

<div class="cols-2">
<div>

### In Progress / Planned

<span class="pill pill-yellow">Soon</span> Widget customization per org
<br><br>
<span class="pill pill-yellow">Soon</span> Inbox screen (past conversations)
<br><br>
<span class="pill pill-blue">Planned</span> Session expiry cleanup cron

</div>
<div>

### Known Technical Items

<span class="pill pill-red">Fix</span> Wire tools to `supportAgent` constructor
<br><br>
<span class="pill pill-red">Fix</span> Search tool double-message artifact
<br><br>
<span class="pill pill-yellow">Improve</span> Push file category filter to DB layer
<br><br>
<span class="pill pill-yellow">Improve</span> Configurable initial greeting per org
<br><br>
<span class="pill pill-blue">Nice to have</span> Operator name fallback if `familyName` unset in Clerk

</div>
</div>

---

<!-- _class: accent -->
<!-- _paginate: false -->

<br><br>

# Thank You

<br>

**Atlas Chatbot** — AI customer support, grounded in your knowledge

<br>

`README.md` · `TECH_SPEC.md` · `PRESENTATION.md`

<br>

> Built with Next.js · Convex · Clerk · OpenAI · Turborepo
