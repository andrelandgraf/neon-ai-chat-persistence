# Template - Neon AI Chat Persistence

Persist AI SDK chats and messages to your Neon database. Message parts are stored in separate tables, rather than JSONB. This makes it easier to enforce the schema and version control as the AI SDK and message parts evolve over time.

## Stack

- Full-stack framework: **Next.js**
- ORM: **Drizzle**
- Agent framework: **AI SDK v6**
- UI components: **Shadcn & AI Elements**
- Database: **Neon Serverless Postgres**
- TypeScript runtime & package manager: **Bun**

## How It Works

1. **New Chat**: When a user clicks "New chat", they navigate to `/chats/{chatId}` with a new UUID v7
2. **Load History**: The chat page loads existing messages from the database
3. **Send Message**: The client sends the user message to the API
4. **Persist User Message**: The API persists the user message before streaming
5. **Stream Response**: The AI response is streamed to the client
6. **Persist Assistant Message**: `onFinish` callback persists the assistant response
7. **Reload**: If the user refreshes, they see the full conversation history

## Getting Started

1. Click the "Deploy" button to clone this repository, create a new Vercel project, set up the Neon integration, and provision a new Neon database:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fandrelandgraf%2Fneon-ai-chat-persistence%2Ftree%2Fmain&project-name=my-neon-ai-chat-app&repository-name=my-neon-ai-chat-app&products=[{%22type%22:%22integration%22,%22integrationSlug%22:%22neon%22,%22productSlug%22:%22neon%22,%22protocol%22:%22storage%22}])

2. Next, enable the Vercel AI Gateway for the project. Learn more [here](https://vercel.com/ai-gateway).

3. Once the process is complete, you can play around with the deployed template and clone the newly created GitHub repository to start making changes locally.

## Local Setup

1. Install dependencies:

```bash
bun i
```

2. Create a `.env` file in the project root

```bash
cp .env.example .env
```

3. Get your Neon database URL

Run `vercel env pull` to fetch the environment variables from your Vercel project.

Alternatively, obtain the database connection string from the Connection Details widget on the [Neon Dashboard](https://console.neon.tech/) and update the `.env` file with your database connection string:

```txt
DATABASE_URL=<your-string-here>
```

4. Schema setup

Use Drizzle to generate a database schema based on the schema definitions in `lib/db/schema.ts` and apply the schema to the Neon database.

```bash
bun run db:generate
bun run db:migrate
```

5. Get your Vercel AI Gateway API Key

If you deployed via Vercel, run `vercel env pull` to fetch the environment variables. Otherwise, create a Vercel AI Gateway API Key [here](https://vercel.com/ai-gateway) and add it to your `.env` file:

```txt
AI_GATEWAY_API_KEY=<your-string-here>
```

Alternatively, you can follow the [AI SDK provider docs](https://ai-sdk.dev/providers/ai-sdk-providers) and modify the model serving in the code to use a different provider instead of Vercel AI Gateway.

6. Run the development server

```bash
bun run dev
```

You're all set! 🚀 Visit the app in your browser and click on `New chat` to try out the Tweet drafting assistant. After having a conversation with the agent, refresh the browser page and verify that all changes are persisted and queried from the database on page load.

## Implementation Details

### Chat Components

This template is based on Shadcn UI and the AI SDK's AI Elements components.

For details on how to use Shadcn UI, refer to the [Shadcn Next.js docs](https://ui.shadcn.com/docs/installation/next). Follow the [Shadcn Next.js dark mode guide](https://ui.shadcn.com/docs/dark-mode/next) to learn how the dark mode is implemented.

You can find an introduction about the AI SDK AI Elements in the [AI SDK docs](https://ai-sdk.dev/elements).

### Neon Setup

On Vercel Fluid compute, we recommend using a pooled PostgreSQL connection that can be reused across requests (more details [here](https://neon.com/docs/guides/vercel-connection-methods)). This setup uses `node-postgres` with Drizzle as the ORM.

```bash
bun add drizzle-orm pg @vercel/functions
bun add -D drizzle-kit @types/pg
```

Follow the [Drizzle Postgres setup guide](https://orm.drizzle.team/docs/get-started/postgresql-new) for step-by-step instructions. Attach the database pool to your Vercel function to ensure it releases properly on function shutdown. For more information, see the [Vercel connection pooling guide](https://vercel.com/guides/connection-pooling-with-functions).

Optionally, configure the Neon MCP server by following the instructions in the [MCP server README](https://github.com/neondatabase/mcp-server-neon) or by running `bunx neonctl@latest init`.

### Database Schema

The schema uses separate tables for chats, messages, and all message part types (text, reasoning, tools, files, etc.).

### UUID v7 Postgres Function

The schema uses `uuid_generate_v7()` for default IDs. You have two options:

**Option 1: Use the `pg_uuidv7` extension (recommended for Neon)**

```sql
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
```

**Option 2: PostgreSQL 18+**

PostgreSQL 18 includes native UUID v7 support via `uuidv7()`. Update your schema to use `uuidv7()` instead of `uuid_generate_v7()`.

Run migrations to create your tables:

```bash
bun run db:generate
bun run db:migrate
```

### Why UUID v7?

This template uses UUID v7 for message and message part IDs. UUID v7 addresses performance concerns of UUID v4 (the previous default). Most importantly, it's **chronologically sortable**, meaning IDs generated later are lexicographically greater than earlier ones.

With UUID v7, we avoid havign to sort by `createdAt` index (which breaks if we insert all message parts in a single transaction) and avoid an addtional order column that documents the order of message parts. Instead, we can sort by primary key directly.

### Tool Definitions

Define your tools with their schemas. This example creates a tweet drafting assistant with a character counting tool (see `lib/ai/tools.ts`).

The `TOOL_TYPES` array must match your tool keys prefixed with `tool-` for the database schema's enum constraint on the `messageTools` table (see `lib/db/schema.ts`).
