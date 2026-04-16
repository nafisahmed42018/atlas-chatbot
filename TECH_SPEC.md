# Atlas Chatbot — Technical Specification

**Version:** 0.1.0  
**Last Updated:** 2026-04-16  
**Status:** In Development

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [System Architecture](#2-system-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Data Model](#4-data-model)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Surface](#6-api-surface)
7. [AI Subsystem](#7-ai-subsystem)
8. [Widget Lifecycle](#8-widget-lifecycle)
9. [File Upload & RAG Pipeline](#9-file-upload--rag-pipeline)
10. [Conversation Lifecycle](#10-conversation-lifecycle)
11. [Input Validation & Security](#11-input-validation--security)
12. [Frontend Architecture](#12-frontend-architecture)
13. [State Management](#13-state-management)
14. [Multi-Tenancy Model](#14-multi-tenancy-model)
15. [Shared Component Library](#15-shared-component-library)
16. [Build & Deployment Pipeline](#16-build--deployment-pipeline)
17. [Known Limitations & Planned Work](#17-known-limitations--planned-work)

---

## 1. Purpose & Scope

Atlas Chatbot is a multi-tenant AI-powered customer support platform. It allows organizations to deploy an embeddable chat widget on their own website. End users (visitors) interact with an AI support agent that answers questions using the organization's private knowledge base. When the AI cannot help, it escalates the conversation to a human operator who responds from a web dashboard.

### In Scope

- Embeddable chat widget served from a dedicated Next.js app
- Operator dashboard for managing conversations, files, and settings
- AI support agent with RAG-backed knowledge base per organization
- Real-time conversation sync between widget and dashboard via Convex
- Multi-organization isolation at the data and search namespace level

### Out of Scope (current version)

- Voice/phone channel (route exists, not implemented)
- Email channel
- Billing and subscription enforcement (marked TODO in code)
- Public REST API
- Mobile native apps

---

## 2. System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                           │
│                                                                 │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐ │
│  │     apps/web            │   │      apps/widget            │ │
│  │     (Dashboard)         │   │      (Chat Widget)          │ │
│  │     Next.js :3000       │   │      Next.js :3001          │ │
│  │     Clerk auth required │   │      No auth — public       │ │
│  └────────────┬────────────┘   └──────────────┬──────────────┘ │
│               │                               │                 │
└───────────────┼───────────────────────────────┼─────────────────┘
                │  Convex React SDK             │  Convex React SDK
                │  (authenticated)              │  (unauthenticated)
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONVEX BACKEND                             │
│                                                                 │
│   private/*           │    public/*          │   system/*       │
│   (Clerk JWT required)│    (no auth)         │   (internal only)│
│                       │                      │                  │
│   - conversations     │    - organizations   │   - conversations│
│   - messages (CRUD)   │    - contactSessions │   - contactSess. │
│   - files (CRUD)      │    - conversations   │   - ai/          │
│                       │    - messages        │     agents/      │
│                       │                      │     rag.ts       │
│                       │                      │     tools/       │
│                       │                      │     prompts.ts   │
└───────────────────────┴──────────────────────┴──────────────────┘
                │                    │
       ┌────────┘                    └───────────────┐
       ▼                                             ▼
┌─────────────┐                            ┌─────────────────┐
│   Clerk     │                            │    OpenAI       │
│             │                            │                 │
│  - Org auth │                            │  gpt-4o-mini    │
│  - JWT      │                            │  text-embed-3-  │
│  - Org IDs  │                            │  small (1536d)  │
└─────────────┘                            └─────────────────┘
```

### Runtime Topology

| Component | Technology | Port |
|---|---|---|
| Operator Dashboard | Next.js 15 (App Router) | 3000 |
| Chat Widget | Next.js 15 (App Router) | 3001 |
| Backend | Convex serverless | Managed (cloud) |
| Database | Convex (built-in) | Managed (cloud) |
| Vector Store | Convex RAG component | Managed (cloud) |
| Auth | Clerk | Managed (cloud) |
| LLM / Embeddings | OpenAI | Managed (cloud) |

### Communication Pattern

All client-to-backend communication goes through the Convex React SDK. There is no traditional HTTP REST layer. Convex provides:

- **Queries** — reactive, real-time subscriptions. Components re-render automatically when underlying data changes.
- **Mutations** — transactional write operations.
- **Actions** — non-transactional operations that can call external APIs (OpenAI, Clerk) or run long-running tasks.

---

## 3. Repository Structure

This is a **pnpm monorepo** orchestrated with **Turborepo**.

```
atlas-chatbot/
├── apps/
│   ├── web/                        # Operator dashboard
│   └── widget/                     # Embeddable chat widget
├── packages/
│   ├── backend/                    # Convex backend (shared)
│   │   └── convex/
│   │       ├── _generated/         # Auto-generated by Convex CLI (do not edit)
│   │       ├── schema.ts           # Database schema definition
│   │       ├── auth.config.ts      # Clerk JWT provider config
│   │       ├── convex.config.ts    # Component registration (RAG, Agent)
│   │       ├── public/             # Unauthenticated API surface
│   │       ├── private/            # Authenticated API surface
│   │       ├── system/             # Internal functions, AI subsystem
│   │       └── lib/                # Shared utilities (sanitize, extractTextContent)
│   ├── ui/                         # Shared React component library
│   ├── eslint-config/              # Shared ESLint configuration
│   └── typescript-config/          # Shared TypeScript base configs
├── turbo.json                      # Turborepo pipeline
├── pnpm-workspace.yaml             # Workspace definition
└── package.json                    # Root devDependencies and scripts
```

### Workspace Package Names

| Directory | Package Name | Imported As |
|---|---|---|
| `packages/backend` | `@workspace/backend` | Convex-generated API types |
| `packages/ui` | `@workspace/ui` | `@workspace/ui/components/*` |
| `packages/eslint-config` | `@workspace/eslint-config` | ESLint extends |
| `packages/typescript-config` | `@workspace/typescript-config` | tsconfig extends |

---

## 4. Data Model

### Database: Convex (built-in document store)

All tables are defined in `packages/backend/convex/schema.ts`.

---

### Table: `conversations`

Represents a single support conversation between a visitor and the organization.

| Field | Type | Description |
|---|---|---|
| `_id` | `Id<"conversations">` | Auto-generated Convex document ID |
| `_creationTime` | `number` | Auto-set Unix timestamp (ms) |
| `threadId` | `string` | Convex Agent thread ID for message history |
| `organizationId` | `string` | Clerk organization ID — scopes the conversation |
| `contactSessionId` | `Id<"contactSessions">` | Reference to the visitor's session |
| `status` | `"unresolved" \| "escalated" \| "resolved"` | Current state of the conversation |

**Indexes:**

| Index Name | Fields | Used For |
|---|---|---|
| `by_organization_id` | `[organizationId]` | Dashboard: list all conversations for an org |
| `by_contact_session_id` | `[contactSessionId]` | Widget: list visitor's own conversations |
| `by_thread_id` | `[threadId]` | AI tools: look up conversation by agent thread |
| `by_status_and_organization_id` | `[status, organizationId]` | Dashboard: filter conversations by status |

---

### Table: `contactSessions`

Represents an authenticated visitor session in the widget. Created when a visitor submits their name and email. Sessions expire after 24 hours.

| Field | Type | Description |
|---|---|---|
| `_id` | `Id<"contactSessions">` | Auto-generated Convex document ID |
| `_creationTime` | `number` | Auto-set Unix timestamp (ms) |
| `name` | `string` | Visitor's display name (sanitized, max 16 chars) |
| `email` | `string` | Visitor's email address (sanitized, lowercased) |
| `organizationId` | `string` | Clerk org ID the session belongs to |
| `expiresAt` | `number` | Unix timestamp (ms) — `_creationTime + 86400000` |
| `metadata` | `object?` | Browser fingerprint collected at session creation |

**Metadata fields** (all optional strings unless noted):

`userAgent`, `language`, `languages`, `platform`, `vendor`, `screenResolution`, `viewportSize`, `timezone`, `timezoneOffset` (number), `cookieEnabled` (boolean), `referrer`, `currentUrl`

All string metadata fields are HTML-stripped and truncated to 500 characters before storage.

**Indexes:**

| Index Name | Fields | Used For |
|---|---|---|
| `by_organization_id` | `[organizationId]` | Admin queries across sessions |
| `by_expires_at` | `[expiresAt]` | Potential future cleanup job |

---

### Table: `users`

Minimal internal user record. Currently only stores `name`.

> **Note:** Full user identity management is handled by Clerk. This table exists for Convex-internal references if needed.

---

### Implicit Tables (managed by Convex components)

The `@convex-dev/agent` and `@convex-dev/rag` components create and manage their own internal tables (threads, messages, embeddings, namespaces, entries). These are not defined in `schema.ts` and should not be accessed directly — use the component APIs.

---

## 5. Authentication & Authorization

### Model Overview

The system has two distinct user types with entirely separate auth mechanisms:

| User Type | Who | Auth Method | Scope |
|---|---|---|---|
| **Operator** | Company staff using the dashboard | Clerk (OAuth / password) | Organization-scoped |
| **Visitor** | End users using the widget | Contact session (name + email) | Single org, 24-hour TTL |

### Operator Authentication (Dashboard)

- Handled by **Clerk** via `@clerk/nextjs`
- Middleware in `apps/web/middleware.ts` protects all dashboard routes
- Users without an active Clerk organization are redirected to `/org-selection`
- Convex receives a Clerk-signed JWT with every request; `ctx.auth.getUserIdentity()` extracts:
  - `identity.subject` — Clerk user ID
  - `identity.orgId` — Active organization ID (used for all data isolation)
  - `identity.familyName` — Used as operator display name in messages

**Auth flow:**

```
Browser → Clerk sign-in → JWT issued
       → Next.js middleware validates JWT on every request
       → Convex functions call ctx.auth.getUserIdentity()
       → orgId extracted and used for all data queries
```

**Route protection rules (middleware.ts):**

- `/sign-in`, `/sign-up` — public
- `/org-selection` — requires Clerk session, no org required
- All other routes — requires Clerk session + active organization

### Visitor Authentication (Widget)

Visitors are not Clerk users. They authenticate by submitting a name and email, which creates a `contactSession` document. The `contactSession._id` is stored in `localStorage` (keyed by org ID) and sent with every widget API request.

**Session validation:** Every public Convex function that acts on visitor data calls `ctx.db.get(contactSessionId)` and checks `expiresAt < Date.now()` before proceeding.

**Organization validation:** On widget load, the `organizationId` URL parameter is validated against the Clerk API (`clerkClient.organizations.getOrganization`). If invalid, the widget shows an error screen.

### Authorization Enforcement

All Convex functions enforce authorization at the handler level:

| Layer | Check |
|---|---|
| `private/*` functions | `ctx.auth.getUserIdentity()` must return non-null; `orgId` must exist |
| `private/*` functions (data access) | `conversation.organizationId === orgId` before any read/write |
| `public/*` functions | `contactSession.organizationId` is implicitly scoped by the session |
| `system/*` functions | `internalQuery` / `internalMutation` — not callable from clients at all |

---

## 6. API Surface

Convex functions are the only API. They are divided into three access layers.

### Public API (`convex/public/`) — No authentication

Used exclusively by the widget app.

#### `public/organizations.validate` — Action

Validates that an organization ID exists in Clerk.

| Arg | Type | Validation |
|---|---|---|
| `organizationId` | `string` | Non-empty; looked up via Clerk SDK |

Returns `{ valid: true }` or `{ valid: false, reason: string }`. Never throws.

---

#### `public/contactSessions.create` — Mutation

Creates a new visitor session. Called when a visitor submits the auth form.

| Arg | Type | Validation |
|---|---|---|
| `name` | `string` | `sanitizeName()` — letters/spaces/hyphens/apostrophes, max 16 |
| `email` | `string` | `sanitizeEmail()` — RFC format, max 254, lowercased |
| `organizationId` | `string` | Passed through (validated earlier by `organizations.validate`) |
| `metadata` | `object?` | All string fields run through `sanitizeMetadataString()` |

Returns `Id<"contactSessions">`. Session TTL is 24 hours.

#### `public/contactSessions.validate` — Mutation

Checks whether a stored session is still valid (exists and not expired).

Returns `{ valid: true, contactSession }` or `{ valid: false, reason: string }`.

---

#### `public/conversations.create` — Mutation

Creates a new conversation and Convex Agent thread. Saves an initial greeting message from the AI.

| Arg | Type |
|---|---|
| `organizationId` | `string` |
| `contactSessionId` | `Id<"contactSessions">` |

Returns `Id<"conversations">`.

#### `public/conversations.getOne` — Query

Returns `{ _id, status, threadId }` for a single conversation. Verifies the session owns the conversation.

#### `public/conversations.getMany` — Query

Returns a paginated list of conversations for the visitor's session, each with a `lastMessage` field.

---

#### `public/messages.create` — Action

Sends a visitor message and triggers the AI support agent.

| Arg | Type | Validation |
|---|---|---|
| `prompt` | `string` | `sanitizeMessage()` — strips HTML, max 500, blocks injection patterns |
| `threadId` | `string` | Must match a conversation belonging to the session |
| `contactSessionId` | `Id<"contactSessions">` | Must be valid and unexpired |

Calls `supportAgent.generateText()` which invokes the AI and may call tools.

#### `public/messages.getMany` — Query

Returns a paginated list of thread messages. Requires a valid session.

---

### Private API (`convex/private/`) — Clerk JWT required

Used exclusively by the dashboard app. All functions extract `orgId` from the Clerk identity and use it to scope every database query.

#### `private/conversations.getMany` — Query

Returns paginated conversations for the authenticated org, each with `lastMessage` and `contactSession`. Accepts an optional `status` filter.

#### `private/conversations.getOne` — Query

Returns a single conversation with its full `contactSession` object. Verifies the conversation belongs to the org.

#### `private/conversations.updateStatus` — Mutation

Changes a conversation's status to `"unresolved"`, `"escalated"`, or `"resolved"`. Verifies org ownership.

---

#### `private/messages.create` — Mutation

Sends an operator reply to a conversation. Saved as an `assistant`-role message in the thread.

| Arg | Type | Validation |
|---|---|---|
| `prompt` | `string` | `sanitizeOperatorMessage()` — strips HTML, max 2000 |
| `conversationId` | `Id<"conversations">` | Must belong to the operator's org |

#### `private/messages.enhanceResponse` — Action

Rewrites an operator's draft message using GPT-4o-mini before sending.

| Arg | Type | Validation |
|---|---|---|
| `prompt` | `string` | `sanitizeEnhancePrompt()` — strips HTML, max 2000, blocks injection |

Returns the enhanced message string. Does not save to the database — the operator reviews it before sending.

#### `private/messages.getMany` — Query

Returns paginated thread messages for a given `threadId`. Verifies the thread belongs to a conversation owned by the org.

---

#### `private/files.addFile` — Action

Uploads a document to Convex storage and indexes it into the org's RAG namespace.

| Arg | Type | Validation |
|---|---|---|
| `filename` | `string` | `sanitizeFilename()` — max 100 chars, no path traversal, allowed extensions |
| `mimeType` | `string` | `sanitizeMimeType()` — allowlist: `application/pdf`, `text/csv`, `text/plain` |
| `bytes` | `ArrayBuffer` | `sanitizeFileSize()` — non-empty, max 10 MB |
| `category` | `string?` | `sanitizeCategory()` — alphanumeric/spaces/hyphens/underscores, max 50 |

Returns `{ url, entryId }`. Content hash prevents duplicate indexing.

#### `private/files.deleteFile` — Mutation

Removes a file from Convex storage and deletes its RAG entry. Verifies the file was uploaded by the org.

#### `private/files.list` — Query

Returns a paginated list of files in the org's RAG namespace with storage metadata (size, status, URL). Accepts optional `category` filter (applied client-side after fetch).

---

### Internal API (`convex/system/`) — Not callable from clients

`internalQuery` and `internalMutation` functions that are only callable by other Convex functions.

| Function | Purpose |
|---|---|
| `system/conversations.escalate` | Patches conversation status to `"escalated"` |
| `system/conversations.resolve` | Patches conversation status to `"resolved"` |
| `system/conversations.getByThreadId` | Looks up a conversation by Agent thread ID |
| `system/contactSessions.getOne` | Fetches a contact session by ID |

---

## 7. AI Subsystem

### Overview

The AI subsystem consists of three cooperating components:

1. **Support Agent** — a stateful Convex Agent that handles visitor conversations
2. **RAG Pipeline** — vector search over organization-scoped document embeddings
3. **Search Interpreter** — a one-shot LLM call that translates raw RAG results into a conversational answer

### Support Agent (`system/ai/agents/supportAgent.ts`)

Built on `@convex-dev/agent`. Wraps OpenAI `gpt-4o-mini` with persistent thread history.

```
Model:        gpt-4o-mini
Framework:    @convex-dev/agent
Instructions: SUPPORT_AGENT_PROMPT (see prompts.ts)
Max Steps:    5 (limits tool-call loops per turn)
```

The agent is invoked from `public/messages.create` via `supportAgent.generateText()`. The agent manages its own conversation memory using the Convex Agent thread.

**Agent decision tree (from system prompt):**

```
Incoming message
      │
      ├─ Greeting / farewell? ──────────────────────► Respond naturally, no tool call
      │
      ├─ Requests human / frustrated? ─────────────► escalateConversationTool
      │
      ├─ Product / service question? ──────────────► searchTool → relay answer verbatim
      │                                               │
      │                                              (if no result) → offer escalation
      │
      └─ Issue confirmed resolved? ────────────────► Ask "anything else?" → resolveConversationTool
```

---

### Agent Tools

#### `searchTool` (`system/ai/tools/search.ts`)

1. Resolves the `organizationId` from the thread's conversation record
2. Calls `rag.search()` scoped to the org's namespace (top 5 results)
3. Passes results to a second `generateText` call using `SEARCH_INTERPRETER_PROMPT`
4. Saves the interpreted response to the thread as an assistant message
5. Returns the interpreted response to the parent agent

> The interpreter runs as a separate LLM call so that it can focus purely on extraction — it has no conversation history and no tool access.

#### `escalateConversationTool` (`system/ai/tools/escalateConversation.ts`)

Calls `system/conversations.escalate` (internal mutation) to patch the conversation status to `"escalated"`. Saves a customer-facing message confirming escalation.

#### `resolveConversationTool` (`system/ai/tools/resolveConversation.ts`)

Calls `system/conversations.resolve` (internal mutation) to patch the conversation status to `"resolved"`. Saves a closing message to the thread.

---

### RAG Pipeline (`system/ai/rag.ts`)

Built on `@convex-dev/rag`.

```
Embedding model:   text-embedding-3-small (OpenAI)
Embedding dim:     1536
Namespace scope:   organizationId (strict isolation — no cross-org search)
```

**Indexing flow** (triggered by `private/files.addFile`):

```
File upload
    │
    ▼
Convex Storage (blob)
    │
    ▼
extractTextContent() → plain text extraction
    │                    (PDF → text, CSV → text, TXT → text)
    ▼
rag.add() → embed text → store vectors in RAG namespace
    │         (skipped if contentHash already exists)
    ▼
Return { entryId, url }
```

**Search flow** (triggered by `searchTool`):

```
User query string
    │
    ▼
rag.search(namespace: orgId, query, limit: 5)
    │
    ▼
Top-5 matching chunks + source titles
    │
    ▼
SEARCH_INTERPRETER_PROMPT + generateText (gpt-4o-mini)
    │
    ▼
Conversational answer string
```

---

### Prompts (`system/ai/prompts.ts`)

| Constant | Used By | Purpose |
|---|---|---|
| `SUPPORT_AGENT_PROMPT` | `supportAgent` system instructions | Agent persona, decision tree, anti-jailbreak rules, tool usage policy |
| `SEARCH_INTERPRETER_PROMPT` | `searchTool` second LLM call | Extract and present RAG results as plain conversational text |
| `OPERATOR_MESSAGE_ENHANCEMENT_PROMPT` | `private/messages.enhanceResponse` | Polish operator drafts while preserving intent and details |

---

## 8. Widget Lifecycle

The widget is a single Next.js page that renders one screen at a time, driven by the `screenAtom` Jotai atom.

### Screen State Machine

```
                    ┌─────────┐
         App load   │         │
         ──────────►│ loading │
                    │         │
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │ org valid?          │
              │                     │
         Yes ▼                  No ▼
              │              ┌──────────┐
      session valid?         │  error   │
              │              └──────────┘
     ┌────────┴────────┐
     │                 │
  Yes ▼             No ▼
     │           ┌──────────┐
     │           │   auth   │  ← visitor submits name + email
     │           └────┬─────┘
     │                │ session created
     └────────────────┘
              │
              ▼
       ┌─────────────┐
       │  selection  │  ← visitor clicks "Start chat"
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │    chat     │  ← live conversation
       └─────────────┘
```

### Screen Responsibilities

| Screen | File | Responsibility |
|---|---|---|
| `loading` | `widget-loading-screen.tsx` | Step 1: validate org via Clerk. Step 2: validate stored session. Navigate to next screen. |
| `error` | `widget-error-screen.tsx` | Display error message from `errorMessageAtom`. No recovery action. |
| `auth` | `widget-auth-screen.tsx` | Name + email form. On submit, call `contactSessions.create`, store session ID in localStorage. |
| `selection` | `widget-selection-screen.tsx` | Single "Start chat" button. Creates conversation + thread. Navigates to `chat`. |
| `chat` | `widget-chat-screen.tsx` | Real-time message thread. Form with max-500 textarea. HTML-strips input, shows inline warning on rejected messages. |
| `inbox` | `widget-inbox-screen.tsx` | Past conversations list. |

### Persistent State (localStorage)

Contact session IDs are persisted across page reloads using `jotai/utils` `atomWithStorage`. The storage key is:

```
atlas_contact_session_<organizationId>
```

This allows one session per org per browser. On next load, `WidgetLoadingScreen` reads the stored ID and validates it with Convex before trusting it.

---

## 9. File Upload & RAG Pipeline

### Accepted File Types

| MIME Type | Extension | Validated By |
|---|---|---|
| `application/pdf` | `.pdf` | Frontend dropzone + `sanitizeMimeType()` backend |
| `text/csv` | `.csv` | Frontend dropzone + `sanitizeMimeType()` backend |
| `text/plain` | `.txt` | Frontend dropzone + `sanitizeMimeType()` backend |

**Size limit:** 10 MB (enforced by `sanitizeFileSize()` in the backend action).

### Upload Flow

```
Operator selects file in UploadDialog
    │
    ▼
Frontend validation (Zod schema)
  - category: required, max 50, [a-zA-Z0-9 _-]
  - filename: optional override, max 100, no path traversal
  - file: allowed MIME type, max 10 MB, non-empty
    │
    ▼ (on submit)
private/files.addFile (Convex Action)
    │
    ├─ sanitizeFilename(), sanitizeMimeType(), sanitizeFileSize(), sanitizeCategory()
    │
    ├─ ctx.storage.store(blob) → storageId
    │
    ├─ extractTextContent(storageId, filename, bytes, mimeType) → plaintext
    │
    ├─ contentHashFromArrayBuffer(bytes)
    │   └─ if hash already in namespace → skip, delete uploaded blob
    │
    └─ rag.add(namespace: orgId, text, key: filename, title: filename, metadata)
        → embed → store vectors
```

### Deletion Flow

```
Operator clicks delete in FilesView
    │
    ▼
private/files.deleteFile (Convex Mutation)
    │
    ├─ Verify entry.metadata.uploadedBy === orgId
    ├─ ctx.storage.delete(storageId)
    └─ rag.deleteAsync(entryId)
```

---

## 10. Conversation Lifecycle

### Status Transitions

```
             create()
                │
                ▼
          ┌──────────┐
          │UNRESOLVED│ ◄──────────────────────────────┐
          └────┬─────┘                                │
               │                                      │
     ┌─────────┴──────────┐               operator updateStatus()
     │                    │               or agent resolveConversationTool
     │ AI detects         │ operator
     │ frustration /      │ updateStatus()
     │ escalateConv.Tool  │
     ▼                    ▼
┌──────────┐       ┌──────────┐
│ESCALATED │       │ RESOLVED │
└────┬─────┘       └──────────┘
     │
     │ operator updateStatus()
     └──────────────────────────────────────────────►RESOLVED
```

### Status Semantics

| Status | Meaning | Who Can Set |
|---|---|---|
| `unresolved` | Active, AI is handling | Created by default; operator can reset to this |
| `escalated` | Needs human attention | AI tool, operator dropdown |
| `resolved` | Complete, no further action needed | AI tool, operator dropdown |

When a conversation is `resolved`, the widget chat input is disabled with the message "This conversation has been resolved."

---

## 11. Input Validation & Security

All validation is implemented in `packages/backend/convex/lib/sanitize.ts`. Frontend Zod schemas mirror backend rules for fast feedback, but the backend is the authoritative enforcement layer.

### Sanitizer Reference

| Function | Applied To | Rules |
|---|---|---|
| `sanitizeName` | Visitor name | Trim, max 16, `[a-zA-Z \'\-]` only |
| `sanitizeEmail` | Visitor email | Trim, lowercase, max 254, RFC regex |
| `sanitizeMessage` | Widget chat input | Strip `<script>`, strip HTML tags, max 500, 12 prompt injection patterns blocked |
| `sanitizeOperatorMessage` | Operator dashboard reply | Strip `<script>`, strip HTML tags, max 2000 |
| `sanitizeEnhancePrompt` | Operator AI enhancement input | Strip HTML, max 2000, 12 injection patterns blocked |
| `sanitizeFilename` | Uploaded file name | Max 100, no `/\<>:"\|?*` or `..`, allowed extensions only |
| `sanitizeCategory` | File category | Max 50, `[a-zA-Z0-9 _-]` only |
| `sanitizeMimeType` | Uploaded file MIME type | Allowlist: pdf, csv, txt only |
| `sanitizeFileSize` | Uploaded file bytes | Non-zero, max 10 MB (10,485,760 bytes) |
| `sanitizeMetadataString` | All browser metadata strings | Strip HTML, truncate to 500 chars |

### Prompt Injection Patterns Blocked

Messages sent to the AI are checked against these patterns (case-insensitive):

- `ignore (all) (previous|above|prior) instructions`
- `forget (everything|all|your|previous)`
- `you are now`
- `act as (a|an)`
- `[system]` / `<system>`
- `new instructions:`
- `disregard (all) (previous|above|prior)`
- `override (previous) (instructions|commands|prompt)`
- `jailbreak`
- `do anything now`
- `dan mode`

### Error Response Format

All `ConvexError` throws use a consistent structure:

```ts
throw new ConvexError({ code: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND", message: string })
```

Frontend catch blocks read `error.data.code` and `error.data.message` to display targeted messages to users.

---

## 12. Frontend Architecture

### Dashboard (`apps/web`)

Built with **Next.js 15 App Router**. All pages in the `(dashboard)` route group are server-component layouts wrapping client-component views.

#### Route → View Mapping

| Route | View Component | Description |
|---|---|---|
| `/` | `ConversationsView` | Placeholder / empty state |
| `/conversations` | `ConversationsLayout` + `ConversationsPanel` | Sidebar of conversations |
| `/conversations/[id]` | `ConversationIdView` | Message thread + operator reply form |
| `/files` | `FilesView` | Knowledge base management |
| `/customization` | — | Widget appearance settings (in development) |
| `/integrations` | — | Third-party integrations (in development) |
| `/plugins/vapi` | — | Voice AI plugin (in development) |
| `/sign-in` | `SignInView` | Clerk `<SignIn />` component |
| `/sign-up` | `SignUpView` | Clerk `<SignUp />` component |
| `/org-selection` | `OrgSelectionView` | Clerk `<OrganizationList />` component |

#### Dashboard UI Patterns

- **Real-time data:** All Convex queries subscribe reactively — the conversations panel and message thread update without polling.
- **Forms:** React Hook Form + Zod for the operator reply textarea and the file upload dialog.
- **Pagination:** Infinite scroll on the message thread using a custom `useInfiniteScroll` hook.
- **Status management:** `ConversationStatusButton` renders a dropdown to transition conversation status directly from the thread view.

---

### Widget (`apps/widget`)

Single-page Next.js app. The root `page.tsx` reads `searchParams.organizationId` and passes it to `WidgetView`, which renders the active screen.

#### URL Contract

```
https://widget.yourdomain.com?organizationId=org_xxxxxxxxx
```

The `organizationId` is the only external input to the widget. All other state is derived from Convex queries and Jotai atoms.

#### Widget UI Patterns

- **Screen routing:** Driven by `screenAtom`. `WidgetView` maps each screen value to its component — no Next.js routing involved.
- **Inline error feedback:** The chat screen displays `ConvexError` messages inline above the input (yellow warning banner) rather than navigating to the error screen.
- **Message form:** Zod schema strips HTML client-side before submission. The `transform + refine` chain ensures stripped content is non-empty.

---

## 13. State Management

### Jotai Atoms (`apps/widget/modules/widget/atoms/widget-atoms.ts`)

| Atom | Type | Persisted | Description |
|---|---|---|---|
| `screenAtom` | `WidgetScreen` | No | Current active screen. Initial value: `"loading"` |
| `organizationIdAtom` | `string \| null` | No | Set by loading screen after Clerk validation |
| `contactSessionIdAtomFamily` | `Id<"contactSessions"> \| null` | **Yes** (localStorage) | Per-org session ID. Key: `atlas_contact_session_<orgId>` |
| `errorMessageAtom` | `string \| null` | No | Message shown on the error screen |
| `loadingMessageAtom` | `string \| null` | No | Step description shown on the loading screen |
| `conversationIdAtom` | `Id<"conversations"> \| null` | No | Active conversation in the chat screen |

`contactSessionIdAtomFamily` uses `atomWithStorage` from `jotai/utils` — it reads/writes `localStorage` automatically and is keyed per organization so multiple orgs can coexist in the same browser.

### Dashboard State (`apps/web/modules/dashboard/atoms.ts`)

The dashboard uses Jotai for lightweight UI state (e.g. selected conversation, panel open/closed). Convex reactive queries drive all server data — no manual caching or client state for data.

---

## 14. Multi-Tenancy Model

Atlas is fully multi-tenant. A single deployment serves all organizations.

### Isolation Boundaries

| Layer | Isolation Mechanism |
|---|---|
| Auth | Clerk organizations — operators only see their own org's data |
| Database queries | Every private function filters by `identity.orgId` |
| RAG / Vector search | Each org has its own RAG namespace (`namespace: orgId`). `rag.search()` never crosses namespaces. |
| Contact sessions | `organizationId` is stored on every session; public functions validate the session belongs to the correct org |
| Conversations | `organizationId` stored on every conversation; validated on every access |
| File storage | Files are namespaced in RAG by org; `uploadedBy: orgId` in metadata is checked before deletion |

### Data Flow for a Multi-Tenant Search

```
Visitor sends message to Org A's widget
    │
    ▼
searchTool called
    │
    ▼
getByThreadId → conversation.organizationId = "org_A"
    │
    ▼
rag.search(namespace: "org_A", ...)
    │
    └─ Only Org A's uploaded documents are searched
       Org B's documents are in namespace "org_B" — never touched
```

---

## 15. Shared Component Library

**Package:** `@workspace/ui`  
**Source:** `packages/ui/src/`

Built on **shadcn/ui** (new-york style) with Tailwind CSS 4. Components are installed here and imported by both `apps/web` and `apps/widget`.

### AI-Specific Components (`components/ai/`)

Custom components built for the chat interface:

| Component | File | Description |
|---|---|---|
| `AIConversation` | `conversation.tsx` | Scrollable message container with auto-scroll |
| `AIInput` | `input.tsx` | Textarea + toolbar container for message composition |
| `AIMessage` | `message.tsx` | Individual message bubble with `from` prop (`"user"` or `"assistant"`) |
| `AIResponse` | `response.tsx` | Renders message content (markdown-aware) |
| `AISuggestion` | `suggestion.tsx` | Chip-style quick reply suggestion |

### Notable Utilities

| Export | Description |
|---|---|
| `@workspace/ui/hooks/use-infinite-scroll` | Intersection Observer-based infinite scroll with load-more callback |
| `@workspace/ui/components/dicebear-avatar` | Deterministic avatar generation from a seed string |
| `@workspace/ui/components/dropzone` | File drop zone built on `react-dropzone` |
| `@workspace/ui/components/hint` | Tooltip wrapper using Radix `HoverCard` |

### Adding Components

```bash
# Run from repo root — components are installed to packages/ui
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

---

## 16. Build & Deployment Pipeline

### Turborepo Task Graph

```
dev   → runs all: convex dev + next dev (web) + next dev (widget)
build → packages/ui build → apps/web build + apps/widget build
lint  → all packages (parallel)
check-types → all packages (parallel)
```

Tasks that depend on `^build` wait for all upstream packages to finish. The `dev` task is non-cacheable and persistent.

### Environment Summary

| Variable | Location | Set By |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `apps/web/.env.local`, `apps/widget/.env.local` | Copied from Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/web/.env.local` | Clerk dashboard |
| `CLERK_SECRET_KEY` | `apps/web/.env.local` | Clerk dashboard |
| `CLERK_FRONTEND_API_URL` | `apps/web/.env.local` | Clerk dashboard |
| `NEXT_PUBLIC_CLERK_*_URL` | `apps/web/.env.local` | Static route constants |
| `CONVEX_DEPLOYMENT` | `packages/backend/.env.local` | Auto-generated by `convex dev` |
| `CLERK_SK` | Convex dashboard env vars | Clerk dashboard |
| `CLERK_FRONTEND_API_URL` | Convex dashboard env vars | Clerk dashboard |
| `OPENAI_API_KEY` | Convex dashboard env vars | OpenAI platform |

> Convex functions read env vars from the Convex dashboard, not from local `.env` files. Local `.env` variables are only read by Next.js at build/dev time.

---

## 17. Known Limitations & Planned Work

The following are tracked as `TODO` comments in the codebase or identified gaps:

### Planned Features

| Feature | Location | Notes |
|---|---|---|
| Subscription enforcement | `public/messages.create` | Commented TODO — no usage limits currently |
| Widget appearance customization | `apps/web/(dashboard)/customization` | Route exists, view not implemented |
| Third-party integrations | `apps/web/(dashboard)/integrations` | Route exists, view not implemented |
| Voice channel (Vapi) | `apps/web/(dashboard)/plugins/vapi` | Route exists, plugin not implemented |
| Inbox screen (past conversations) | `widget-inbox-screen.tsx` | Screen exists, data not wired |
| Session expiry cleanup job | `contactSessions` table | `by_expires_at` index exists for a future scheduled cron |
| Initial message from widget settings | `public/conversations.create` | Hardcoded "Hello, how can I help you today?" — should be configurable per org |
| Operator agent name attribution | `private/messages.create` | `agentName: identity.familyName` — falls back to `undefined` if familyName not set in Clerk |

### Architectural Notes

| Item | Detail |
|---|---|
| AI tools not wired to agent | `supportAgent.ts` defines tools in its constructor but the tool call chain depends on the Agent framework resolving them at runtime. If tools do not fire, verify `@convex-dev/agent` version supports the `tools` constructor option. |
| Search tool saves its own message | `searchTool` saves the interpreter response directly to the thread AND returns it to the parent agent. If the parent agent also generates a response, two assistant messages may appear. Review agent step behavior. |
| `list()` category filter is client-side | `private/files.list` fetches all files and filters by category in-process. This will degrade at scale. Should be pushed into the RAG component query when supported. |
| `contactSessions` metadata XSS surface | Metadata is collected client-side from browser APIs. All string fields are sanitized server-side, but the values are operator-visible in the dashboard — ensure they are rendered as text, not HTML. |
