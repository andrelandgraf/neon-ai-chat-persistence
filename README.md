# Template - Neon Agent Workflow Persistence

Persist AI SDK chats and messages to your Neon database. Message parts are stored in separate tables, rather than JSONB. This makes it easier to enforce the schema and version control as the AI SDK and message parts evolve over time.

## Stack

- Full-stack framework: **Next.js**
- ORM: **Drizzle**
- Agent framework: **AI SDK v6**
- UI components: **Shadcn & AI Elements**
- Database: **Neon Serverless Postgres**
- TypeScript runtime & package manager: **Bun**

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

## Setup From Scratch & Full Walkthrough

Follow these steps to integrate this setup into your existing application or to build it from scratch.

1. Create a new [Next.js](https://nextjs.org/) app

```bash
bunx create-next-app@latest
```

2. Set up Shadcn

```bash
bunx --bun shadcn@latest init
bunx --bun shadcn@latest add --all
```

For details, refer to the [Shadcn Next.js docs](https://ui.shadcn.com/docs/installation/next).

Optionally, add dark mode:

```bash
bun add next-themes
```

Follow the [Shadcn Next.js dark mode guide](https://ui.shadcn.com/docs/dark-mode/next) to review all relevant code changes.

3. Set up Neon

On Vercel Fluid compute, we recommend using a pooled PostgreSQL connection that can be reused across requests (more details [here](https://neon.com/docs/guides/vercel-connection-methods)). This setup uses `node-postgres` with Drizzle as the ORM.

```bash
bun add drizzle-orm pg @vercel/functions
bun add -D drizzle-kit @types/pg
```

Follow the [Drizzle Postgres setup guide](https://orm.drizzle.team/docs/get-started/postgresql-new) for step-by-step instructions. Attach the database pool to your Vercel function to ensure it releases properly on function shutdown. For more information, see the [Vercel connection pooling guide](https://vercel.com/guides/connection-pooling-with-functions).

Optionally, configure the Neon MCP server by following the instructions in the [MCP server README](https://github.com/neondatabase/mcp-server-neon) or by running `bunx neonctl@latest init`.

4. Install AI SDK and AI Elements

Install [AI SDK v6](https://v6.ai-sdk.dev/docs/introduction):

```bash
bun add ai@beta @ai-sdk/react@beta
bunx shadcn@latest add @ai-elements/all
```

5. Create the chat route with persistence

This step sets up a complete chat system with database persistence. Each chat gets a unique ID, and all messages are stored in your Neon database.

Install additional dependencies for UUID generation and validation:

```bash
bun add uuid zod
bun add -D @types/uuid
```

### Why UUID v7?

UUID v7 is critical for this architecture because it's **chronologically sortable**. The first 48 bits encode a Unix timestamp, meaning IDs generated later are lexicographically greater than earlier ones.

This enables:

- **Message ordering** - Sort by ID instead of requiring a separate `createdAt` index
- **Part ordering** - Message parts (text, reasoning, tools) maintain insertion order when sorted by ID
- **Efficient queries** - UUID v7 primary keys can serve as natural sort keys

```typescript
import { v7 as uuidv7 } from "uuid";

const id = uuidv7(); // e.g., "019012c5-7f3a-7000-8000-000000000000"

// Parts are sorted by ID to maintain chronological order
parts.sort((a, b) => a.id.localeCompare(b.id));
```

### Database Schema

The schema uses separate tables for chats, messages, and all message part types (text, reasoning, tools, files, etc.). This enables efficient queries for specific part types and supports parallel insertion.

Copy the schema from `lib/db/schemas/chat.ts` and export it from `lib/db/schema.ts`.

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

### Assert Helper

Create a simple assertion utility at `lib/common/assert.ts`:

```typescript
const prefix: string = "Assertion failed";

export default function assert(
  condition: any,
  message?: string | (() => string)
): asserts condition {
  if (condition) {
    return;
  }

  const provided: string | undefined =
    typeof message === "function" ? message() : message;
  const value: string = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
}
```

### Database Client

Set up the Drizzle client with a connection pool. Copy from `lib/db/client.ts`. The key parts are:

- Create a `Pool` from `pg`
- Use `attachDatabasePool` from `@vercel/functions` for proper cleanup on Vercel
- Initialize Drizzle with the pool and schema

### Chat Types

Define types for your chat agent that extend the AI SDK's base types with your tools and data parts. Copy from `lib/chat/types.ts`.

### Tool Definitions

Define your tools with their schemas. This example creates a tweet drafting assistant with a character counting tool. Copy from `lib/ai/tools.ts`.

The `TOOL_TYPES` array must match your tool keys prefixed with `tool-` for the database schema's enum constraint on the `messageTools` table.

### Query Helpers

Create helper functions to persist and retrieve messages. Copy from `lib/db/queries/chat.ts`.

Key functions:

- `ensureChatExists` - Creates a chat record if it doesn't exist
- `persistMessage` - Saves a message and all its parts to the database
- `getChatMessages` - Retrieves all messages for a chat with their parts
- `convertDbMessagesToUIMessages` - Converts database records to AI SDK UI message format

### API Route with Persistence

Create the chat API route at `app/api/chats/[chatId]/route.ts`. See the full implementation in `app/api/chats/[chatId]/route.ts`.

### Chat Page

Create the chat page at `app/chats/[chatId]/page.tsx`. See the full implementation in `app/chats/[chatId]/page.tsx`.

### Chat Component

Create the chat component at `components/chat.tsx`. Key concepts:

- Uses UUID v7 for message IDs via `generateId: () => uuidv7()`
- Sends only the latest message to the server (server loads full history from DB)
- Uses `DefaultChatTransport` with custom `prepareSendMessagesRequest`

See the full implementation in `components/chat.tsx`. For status handling, error states, and more, see the [AI SDK chat docs](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot).

### Home Page

Add a link to start a new chat. The chat ID is generated using UUID v7, and the chat record is created automatically when the first message is sent (via `ensureChatExists` in the API route).

```tsx
import { v7 as uuidv7 } from "uuid";
import Link from "next/link";

export default function Home() {
  const newChatId = uuidv7();
  return <Link href={`/chats/${newChatId}`}>New chat</Link>;
}
```

## How It Works

1. **New Chat**: When a user clicks "New chat", they navigate to `/chats/{chatId}` with a new UUID v7
2. **Load History**: The chat page loads existing messages from the database
3. **Send Message**: The client sends the user message to the API
4. **Persist User Message**: The API persists the user message before streaming
5. **Stream Response**: The AI response is streamed to the client
6. **Persist Assistant Message**: `onFinish` callback persists the assistant response
7. **Reload**: If the user refreshes, they see the full conversation history
