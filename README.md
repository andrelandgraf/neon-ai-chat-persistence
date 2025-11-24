# Template - Neon Agent Workflow Persistence

Persist AI SDK messages to your Neon database.

## Stack

- Full stack framework: **Next.js**
- ORM: **Drizzle**
- Agent runtime: **Workflow Development Kit**
- Agent framework: **AI SDK v6**
- UI components: **Shadcn & AI Elements**
- Database: **Neon Serverless Postgres**

## Setup from scratch

Follow these steps if you want to use this setup in your existing application or set it up from scratch for better understand.

1. Create a new [Next.js](https://nextjs.org/) app

```bash
bunx create-next-app@latest
```

2. Set up Shadcn

```bash
bunx --bun shadcn@latest init
bunx --bun shadcn@latest add --all
```

All details in the [Shadcn Next.js docs](https://ui.shadcn.com/docs/installation/next)

Optionally, add dark mode:

```bash
bun add next-themes
```

Follow the [Shadcn Next.js darkmode guide](https://ui.shadcn.com/docs/dark-mode/next) to review all relevant code changes.

3. Set up Neon

On Fluid, we recommend using a pooled pg connection that can be reused across requests. Here, we use `node-postgres` with Drizzle as the ORM.

```bash
bun add drizzle-orm pg @vercel/functions
bun add -D drizzle-kit @types/pg
```

Follow the [Drizzle Postgres setup guide](https://orm.drizzle.team/docs/get-started/postgresql-new) for a step by step guide. Also, make sure to attach the database pool to your Vercel function to ensure it will be released properly on function shutdown - read more [here](https://vercel.com/guides/connection-pooling-with-functions).

Optionally, configure the Neon MCP server by following the following the insturctions in the [MCP server README](https://github.com/neondatabase/mcp-server-neon) or by running `bunx neonctl@latest init`

4. Set up Workflow Development Kit

```bash
bun add workflow
```

Follow the [Getting started on Next.js guide](https://useworkflow.dev/docs/getting-started/next) for all setup instructions.

5. Install AI SDK and AI Elements

Make sure to install [AI SDK v6](https://v6.ai-sdk.dev/docs/introduction).

```bash
bun add ai@beta @ai-sdk/react@beta
bunx shadcn@latest add @ai-elements/all
```
