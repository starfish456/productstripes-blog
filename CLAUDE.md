# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A minimalist markdown blog built with React, Convex, and Vite. Content is written as markdown files and synced to Convex for real-time data delivery. The site is optimized for SEO, AI agents, and LLM discovery.

## Core Architecture

### Publishing Flow

Content publishing is separated from deployment:

- Write posts as markdown files in `content/blog/` or `content/pages/`
- Run `npm run sync` (dev) or `npm run sync:prod` (production)
- Content appears immediately on live site via Convex real-time sync
- No rebuild or redeploy needed

### Three-Layer Architecture

1. **Frontend (React SPA)**: Client-side rendering with real-time Convex subscriptions
2. **Backend (Convex)**: Database, queries, mutations, HTTP endpoints, cron jobs
3. **Edge Layer (Netlify)**: Edge functions proxy Convex HTTP endpoints and handle bot detection

### Bot Detection Pattern

Social media crawlers are intercepted by `netlify/edge-functions/botMeta.ts`:

- Detects bots via user-agent
- Serves server-rendered HTML with Open Graph metadata from Convex
- Regular users get the React SPA
- Ensures proper social media previews without SSR overhead

### Real-time Analytics

The `/stats` page uses an event records pattern to avoid write conflicts:

- `pageViews` table stores individual view events (not counters)
- `activeSessions` table tracks visitors with heartbeat presence (30s interval, 2min timeout)
- Stats aggregate in real-time via Convex queries and subscriptions
- Cron job cleans up stale sessions every 5 minutes

## Development Commands

### Local Development

```bash
npm run dev              # Start Vite dev server (port 5173)
npx convex dev          # Start Convex backend (run in separate terminal)
```

### Content Management

```bash
npm run sync            # Sync markdown files to dev deployment
npm run sync:prod       # Sync markdown files to production deployment
```

### Build & Deploy

```bash
npm run build           # Build for production
npm run typecheck       # Run TypeScript type checking
npm run lint            # Run ESLint
```

### Production Deployment

```bash
npx convex deploy                # Deploy Convex functions to production
npm run deploy:prod              # Deploy Convex + sync content to production
```

## Environment Setup

### Environment Files

| File | Purpose | Created by |
|------|---------|------------|
| `.env.local` | Dev Convex URL | `npx convex dev` |
| `.env.production.local` | Prod Convex URL | Manual (gitignored) |

### Production Environment File

Create `.env.production.local` with your production Convex URL:

```
VITE_CONVEX_URL=https://your-prod-deployment.convex.cloud
```

### Netlify Environment Variables

Set in Netlify dashboard:

- `CONVEX_DEPLOY_KEY` - Generated from Convex Dashboard → Project Settings → Deploy Key
- `VITE_CONVEX_URL` - Production Convex URL (required for edge functions to proxy requests)

## Convex Development Patterns

### Write Conflict Prevention

This codebase follows strict patterns to avoid Convex write conflicts (see `.cursor/rules/convex-write-conflicts.mdc` for comprehensive guidelines):

**Key Rules:**

1. **Patch directly without reading first** when only updating fields
2. **Make mutations idempotent** with early returns for unchanged state
3. **Use indexed queries** to minimize read scope
4. **Use event records** for high-frequency counters instead of updating counters
5. **Debounce rapid mutations** (300-500ms for typing, 5s for heartbeats)
6. **Add backend dedup windows** to prevent duplicate updates within time threshold

**Example: Heartbeat Mutation (convex/stats.ts:59-100)**

```typescript
export const heartbeat = mutation({
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingSession = await ctx.db
      .query("activeSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Early return if same path and recently updated (idempotent - prevents write conflicts)
      if (
        existingSession.currentPath === args.currentPath &&
        now - existingSession.lastSeen < HEARTBEAT_DEDUP_MS
      ) {
        return null;
      }
      // Patch directly with new data
      await ctx.db.patch(existingSession._id, { currentPath: args.currentPath, lastSeen: now });
      return null;
    }

    // Create new session only if none exists
    await ctx.db.insert("activeSessions", { /* ... */ });
    return null;
  },
});
```

### Convex Best Practices

Follow Convex guidelines from `.cursor/rules/rulesforconvex.mdc`:

- Always follow schemas best practices: https://docs.convex.dev/database/schemas
- Understand Convex fundamentals: https://docs.convex.dev/understanding/
- Follow TypeScript best practices: https://docs.convex.dev/understanding/best-practices/typescript
- Use proper function types (queries, mutations, actions)
- Use Convex validation (v) for all function arguments
- Make code type-safe without over-engineering

## Key File Locations

### Backend (Convex)

- `convex/schema.ts` - Database schema with indexes
- `convex/posts.ts` - Post queries and mutations
- `convex/pages.ts` - Static page queries and mutations
- `convex/stats.ts` - Analytics tracking (views, sessions)
- `convex/http.ts` - HTTP endpoints (sitemap, RSS, API)
- `convex/rss.ts` - RSS feed generation
- `convex/crons.ts` - Scheduled tasks (cleanup)

### Frontend (React)

- `src/pages/Home.tsx` - Home page with site config
- `src/pages/Post.tsx` - Blog post page with SEO metadata
- `src/pages/Stats.tsx` - Real-time analytics dashboard
- `src/context/ThemeContext.tsx` - Theme management (dark, light, tan, cloud)

### Content Sync

- `scripts/sync-posts.ts` - Syncs markdown files to Convex
- `content/blog/` - Blog post markdown files
- `content/pages/` - Optional static page markdown files

### Edge Layer (Netlify)

- `netlify/edge-functions/botMeta.ts` - Bot detection and OG metadata serving
- `netlify/edge-functions/rss.ts` - RSS feed proxy
- `netlify/edge-functions/sitemap.ts` - Sitemap proxy
- `netlify/edge-functions/api.ts` - API proxy

## Markdown Frontmatter

### Blog Posts (`content/blog/*.md`)

```yaml
---
title: "Post Title"
description: "Brief description"
date: "2025-01-15"
slug: "post-slug"
published: true
tags: ["tag1", "tag2"]
readTime: "5 min read"  # Optional, auto-calculated if omitted
image: "/images/og.png"  # Optional, for social media previews
---
```

### Static Pages (`content/pages/*.md`)

```yaml
---
title: "Page Title"
slug: "page-slug"
published: true
order: 1  # Optional, controls nav order (lower = first)
---
```

## SEO and AI Discovery

### Endpoints for AI/LLMs

- `/api/posts` - JSON list of all posts
- `/api/post?slug=xxx` - Single post as JSON
- `/api/post?slug=xxx&format=md` - Single post as markdown
- `/rss-full.xml` - Full content RSS feed
- `/rss.xml` - RSS with descriptions only
- `/sitemap.xml` - Dynamic XML sitemap
- `/meta/post?slug=xxx` - Open Graph HTML for crawlers

### Discovery Files

- `public/robots.txt` - Crawler rules with AI bot guidelines
- `public/llms.txt` - AI agent discovery

## Theme Configuration

Default theme is "tan". Change in `src/context/ThemeContext.tsx`:

```typescript
const DEFAULT_THEME: Theme = "tan"; // Options: "dark", "light", "tan", "cloud"
```

## Images and Assets

- Site logo: `public/images/logo.svg` (configure in `src/pages/Home.tsx`)
- Favicon: `public/favicon.svg`
- Default OG image: `public/images/og-default.svg` (1200x630)
- Blog images: `public/images/` (referenced in markdown as `/images/filename.png`)

## Deployment Notes

### Netlify Build Settings

- Build command: `npm ci --include=dev && npx convex deploy --cmd 'npm run build'`
- Publish directory: `dist`
- The `--include=dev` flag is critical because Netlify sets `NODE_ENV=production` which skips devDependencies

### Convex Deployment URL Pattern

Edge functions must convert Convex URLs:

- Convex backend: `https://xxx.convex.cloud`
- HTTP endpoints: `https://xxx.convex.site`

## Common Pitfalls

1. **Write Conflicts**: Always patch directly without reading when possible. Use indexed queries to minimize read scope. See write conflict guidelines in `.cursor/rules/convex-write-conflicts.mdc`.

2. **Environment Variables**: `VITE_CONVEX_URL` must be set in Netlify for edge functions to work. Edge functions proxy Convex HTTP endpoints at runtime.

3. **Content Sync**: `npm run sync:prod` requires `.env.production.local` with production Convex URL.

4. **Build Failures**: If Netlify build fails with missing dependencies, ensure build command includes `--include=dev` flag.