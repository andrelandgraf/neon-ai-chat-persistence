# Template - Neon Agent Workflow Persistence

This template showcases how to persist AI SDK messages to your Neon database.

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
