# Atlas Chatbot

A multi-tenant AI customer support platform built as a pnpm monorepo. It consists of an operator dashboard for managing conversations and a lightweight embeddable chat widget for end users, both backed by a Convex serverless backend with RAG-powered knowledge base and an OpenAI-driven support agent.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Embedding the Widget](#embedding-the-widget)
- [Adding UI Components](#adding-ui-components)
- [Reference Documentation](#reference-documentation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│                                                     │
│   ┌─────────────────┐    ┌────────────────────┐    │
│   │  Dashboard App  │    │   Widget App        │    │
│   │  (apps/web)     │    │   (apps/widget)     │    │
│   │  :3000          │    │   :3001             │    │
│   └────────┬────────┘    └─────────┬──────────┘    │
│            │                       │                │
└────────────┼───────────────────────┼────────────────┘
             │                       │
             ▼                       ▼
     ┌───────────────────────────────────────┐
     │         Convex Backend                │
     │         (packages/backend)            │
     │                                       │
     │  public/   ← widget API surface       │
     │  private/  ← dashboard API surface    │
     │  system/   ← AI agent & RAG           │
     └───────────────┬───────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌──────────┐         ┌────────────┐
    │  OpenAI  │         │   Clerk    │
    │  GPT-4o  │         │   Auth     │
    │  mini +  │         │            │
    │  embeds  │         └────────────┘
    └──────────┘
```

**Data flow for a widget conversation:**
1. Widget loads → fetches `organizationId` from URL param → validates against Clerk
2. Visitor submits name + email → creates a `contactSession` (24-hour TTL)
3. Visitor starts chat → creates a `conversation` + AI thread
4. Each message → triggers `supportAgent` (GPT-4o-mini) with three tools:
   - `searchTool` → queries the org's RAG namespace for relevant docs
   - `escalateConversationTool` → flags for human operator review
   - `resolveConversationTool` → marks conversation complete
5. Operator replies from the dashboard → saved directly to the thread

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo tooling | [pnpm](https://pnpm.io) workspaces + [Turborepo](https://turbo.build) |
| Frontend framework | [Next.js 15](https://nextjs.org) (App Router) + [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (new-york) |
| State management | [Jotai](https://jotai.org) |
| Forms & validation | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Authentication | [Clerk](https://clerk.com) (operators only; widget is public) |
| Backend | [Convex](https://convex.dev) (serverless functions + database) |
| AI agent | [Convex Agent](https://github.com/get-convex/agent) + OpenAI `gpt-4o-mini` |
| RAG | [Convex RAG](https://github.com/get-convex/rag) + OpenAI `text-embedding-3-small` |
| Icons | [Lucide React](https://lucide.dev) |
| Language | TypeScript 5.7 |

---

## Project Structure

```
atlas-chatbot/
├── apps/
│   ├── web/                        # Operator dashboard (Next.js, port 3000)
│   │   ├── app/
│   │   │   ├── (auth)/             # Public auth routes
│   │   │   │   ├── sign-in/        # Clerk sign-in page
│   │   │   │   ├── sign-up/        # Clerk sign-up page
│   │   │   │   └── org-selection/  # Organization picker
│   │   │   └── (dashboard)/        # Protected operator routes
│   │   │       ├── page.tsx        # Dashboard home
│   │   │       ├── conversations/  # Conversation list + detail
│   │   │       ├── files/          # Knowledge base file management
│   │   │       ├── customization/  # Widget appearance settings
│   │   │       ├── integrations/   # Third-party integrations
│   │   │       └── plugins/vapi/   # Voice AI plugin
│   │   ├── modules/
│   │   │   ├── auth/               # Auth guards, layouts, views
│   │   │   ├── dashboard/          # Sidebar, conversation views, state atoms
│   │   │   └── files/              # File upload/delete dialog, files view
│   │   └── middleware.ts           # Clerk middleware (route protection)
│   │
│   └── widget/                     # Embeddable chat widget (Next.js, port 3001)
│       ├── app/
│       │   └── page.tsx            # Single page, reads ?organizationId= from URL
│       └── modules/widget/
│           ├── atoms/              # Jotai atoms (screen, orgId, session, conversation)
│           ├── constants.ts        # Session storage key
│           ├── types.ts            # WidgetScreen union type
│           └── ui/
│               ├── components/     # Header, footer
│               ├── screens/        # One component per screen state:
│               │   ├── widget-loading-screen.tsx   # Validates org + session
│               │   ├── widget-auth-screen.tsx       # Name + email form
│               │   ├── widget-selection-screen.tsx  # Start chat button
│               │   ├── widget-chat-screen.tsx        # Live chat UI
│               │   ├── widget-inbox-screen.tsx       # Past conversations
│               │   └── widget-error-screen.tsx       # Error display
│               └── views/
│                   └── widget-view.tsx              # Screen router
│
├── packages/
│   ├── backend/                    # Convex backend (shared by both apps)
│   │   └── convex/
│   │       ├── schema.ts           # Database schema
│   │       ├── auth.config.ts      # Clerk auth provider config
│   │       ├── convex.config.ts    # RAG + Agent component registration
│   │       ├── public/             # API surface for the widget (no auth)
│   │       │   ├── organizations.ts    # Validate org via Clerk
│   │       │   ├── contactSessions.ts  # Create/validate visitor sessions
│   │       │   ├── conversations.ts    # CRUD for conversations
│   │       │   └── messages.ts         # Send messages, trigger AI agent
│   │       ├── private/            # API surface for the dashboard (auth required)
│   │       │   ├── conversations.ts    # Operator conversation management
│   │       │   ├── messages.ts         # Operator replies + AI enhancement
│   │       │   └── files.ts            # Knowledge base file upload/list/delete
│   │       ├── system/             # Internal functions (not callable from clients)
│   │       │   ├── ai/
│   │       │   │   ├── agents/supportAgent.ts  # Convex Agent definition
│   │       │   │   ├── rag.ts                  # RAG configuration
│   │       │   │   ├── prompts.ts              # All LLM system prompts
│   │       │   │   └── tools/                  # Agent tools (search, escalate, resolve)
│   │       │   ├── contactSessions.ts
│   │       │   └── conversations.ts
│   │       └── lib/
│   │           ├── sanitize.ts         # Input validation + sanitization
│   │           └── extractTextContent.ts  # Document text extraction for RAG
│   │
│   ├── ui/                         # Shared component library (@workspace/ui)
│   │   └── src/
│   │       ├── components/         # shadcn/ui + custom components
│   │       │   └── ai/             # AI-specific: conversation, input, message, response
│   │       ├── hooks/              # Shared React hooks
│   │       └── styles/globals.css  # Global Tailwind styles
│   │
│   ├── eslint-config/              # Shared ESLint rules (@workspace/eslint-config)
│   └── typescript-config/          # Shared tsconfig bases
│
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # pnpm workspace definition
└── package.json                    # Root scripts + devDependencies
```

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10 — install with `npm install -g pnpm`
- A [Convex](https://dashboard.convex.dev) account and project
- A [Clerk](https://dashboard.clerk.com) account and application
- An [OpenAI](https://platform.openai.com) API key

---

## Environment Variables

There are three separate `.env.local` files — one per app and one for the backend. None of these should be committed to version control.

### `apps/web/.env.local`

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud

# Clerk (get these from your Clerk dashboard → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_FRONTEND_API_URL=https://<your-clerk-frontend-api>.clerk.accounts.dev

# Clerk redirect URLs (keep these as-is)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### `apps/widget/.env.local`

```env
# Convex (same deployment as the web app)
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
```

### `packages/backend/.env.local`

```env
# Convex (generated by `convex dev` — do not edit manually)
CONVEX_DEPLOYMENT=dev:<your-deployment-slug>

# OpenAI (used by the AI agent and RAG embeddings)
OPENAI_API_KEY=sk-...
```

### Convex Dashboard Environment Variables

The following must be set in your **Convex project dashboard** under **Settings → Environment Variables** — they are read server-side by Convex functions and are not in any local file:

| Variable | Description |
|---|---|
| `CLERK_SK` | Your Clerk secret key (`sk_test_...`) |
| `CLERK_FRONTEND_API_URL` | Your Clerk frontend API URL |
| `OPENAI_API_KEY` | Your OpenAI API key |

> **Note:** Convex has reserved names for some variables. If a variable does not take effect, rename it (e.g. `CLERK_SECRET_KEY` → `CLERK_SK`).

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd atlas-chatbot
pnpm install
```

### 2. Set up Convex

```bash
# From the packages/backend directory
cd packages/backend
pnpm run setup
```

This runs `convex dev --until-success`, which will:
- Prompt you to log in to Convex if needed
- Create or link a Convex project
- Generate `packages/backend/convex/_generated/` files
- Write `CONVEX_DEPLOYMENT` and `CONVEX_URL` to `packages/backend/.env.local`

Copy the generated `CONVEX_URL` value into `NEXT_PUBLIC_CONVEX_URL` in both `apps/web/.env.local` and `apps/widget/.env.local`.

### 3. Configure Clerk

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Enable **Organizations** in your Clerk application settings
3. Under **API Keys**, copy your publishable key and secret key into `apps/web/.env.local`
4. Set the **Convex integration** in your Clerk dashboard:
   - Go to **JWT Templates** → create a new template
   - Select **Convex** as the template type
5. Add `CLERK_SK` and `CLERK_FRONTEND_API_URL` to your Convex dashboard environment variables

### 4. Configure OpenAI

Add your `OPENAI_API_KEY` to your Convex dashboard environment variables.

### 5. Create your `.env.local` files

Using the templates in the [Environment Variables](#environment-variables) section above, create:
- `apps/web/.env.local`
- `apps/widget/.env.local`
- `packages/backend/.env.local` (mostly auto-generated by step 2)

---

## Development

Run all apps and the Convex backend simultaneously from the root:

```bash
pnpm dev
```

This starts:
| Service | URL |
|---|---|
| Dashboard (`apps/web`) | http://localhost:3000 |
| Widget (`apps/widget`) | http://localhost:3001 |
| Convex backend | Syncs automatically via `convex dev` |

To run services individually:

```bash
# Dashboard only
pnpm --filter web dev

# Widget only
pnpm --filter widget dev

# Convex backend only
cd packages/backend && pnpm dev
```

---

## Building for Production

```bash
pnpm build
```

Turborepo builds all packages in dependency order. Individual builds:

```bash
pnpm --filter web build
pnpm --filter widget build
```

---

## Embedding the Widget

The widget is a standard Next.js app that renders a single-page chat UI. Embed it in any website using an `<iframe>`:

```html
<iframe
  src="https://your-widget-domain.com?organizationId=org_xxxxxxxxx"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);"
/>
```

The `organizationId` must be a valid Clerk organization ID (`org_...`). The widget validates it on load before showing the chat interface.

---

## Adding UI Components

Components from [shadcn/ui](https://ui.shadcn.com) are installed into `packages/ui/src/components` and shared across both apps. To add a new component, run this from the repo root:

```bash
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

Import it anywhere in either app:

```tsx
import { Button } from "@workspace/ui/components/button"
```

---

## Reference Documentation

| Technology | Docs |
|---|---|
| Convex | https://docs.convex.dev |
| Convex Agent | https://github.com/get-convex/agent |
| Convex RAG | https://github.com/get-convex/rag |
| Clerk (Next.js) | https://clerk.com/docs/quickstarts/nextjs |
| Clerk (Organizations) | https://clerk.com/docs/organizations/overview |
| Next.js App Router | https://nextjs.org/docs/app |
| Turborepo | https://turbo.build/repo/docs |
| pnpm Workspaces | https://pnpm.io/workspaces |
| shadcn/ui | https://ui.shadcn.com/docs |
| Vercel AI SDK | https://sdk.vercel.ai/docs |
| Jotai | https://jotai.org/docs/introduction |
| Zod | https://zod.dev |
