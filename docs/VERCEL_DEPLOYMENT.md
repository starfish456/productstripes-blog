# Vercel Deployment Guide

This guide explains how to deploy to Vercel as an alternative to Netlify.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. Vercel CLI installed (optional): `npm i -g vercel`
3. Your Convex production deployment URL
4. Your Convex deploy key

## Quick Start

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm ci --include=dev && npx convex deploy --cmd 'npm run build'`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

4. Add Environment Variables:
   - `VITE_CONVEX_URL`: Your production Convex URL (e.g., `https://xxx.convex.cloud`)
   - `CONVEX_DEPLOY_KEY`: Your Convex deploy key (from Convex Dashboard → Settings → Deploy Keys)

5. Click "Deploy"

### 3. Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# You'll be prompted to configure the project
# Follow the prompts and set environment variables when asked
```

## Environment Variables

Set these in the Vercel Dashboard (Settings → Environment Variables):

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_CONVEX_URL` | `https://your-deployment.convex.cloud` | Yes |
| `CONVEX_DEPLOY_KEY` | From Convex Dashboard | Yes |

### How to Get Your Convex Deploy Key

1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project
3. Navigate to Settings → Deploy Keys
4. Create a new deploy key or copy an existing one
5. Paste it into Vercel's environment variables

## Architecture

### Edge Functions

Vercel deployment uses:

1. **Middleware** (`middleware.ts`): Handles bot detection and serves Open Graph metadata
2. **Edge API Routes** (`api/*.ts`): Proxies Convex HTTP endpoints for RSS, sitemap, and API

### How It Works

```
User Request
    ↓
Vercel Edge Middleware (bot detection)
    ↓
├─ Bot? → Fetch OG metadata from Convex → Return HTML
└─ Human? → Serve React SPA
```

### API Routes

All API routes run on Vercel's Edge Network:

- `/rss.xml` → Proxies to Convex RSS endpoint
- `/rss-full.xml` → Proxies to Convex full RSS endpoint
- `/sitemap.xml` → Proxies to Convex sitemap endpoint
- `/api/posts` → Proxies to Convex API endpoints
- `/api/post?slug=xxx` → Proxies to Convex API endpoints

## Content Publishing Workflow

Content publishing remains the same as Netlify:

1. Write markdown files in `content/blog/` or `content/pages/`
2. Run `npm run sync:prod` to sync to production Convex
3. Content appears immediately on your live site
4. No rebuild or redeploy needed

### Publishing Commands

```bash
# Sync content to production
npm run sync:prod

# Full production deployment (Convex + content sync)
npm run deploy:prod
```

## Vercel-Specific Features

### Automatic Preview Deployments

Every git push creates a preview deployment:

- Unique URL for each commit
- Perfect for testing before merging to main
- Automatic cleanup after branch deletion

### Analytics

Vercel provides built-in Web Analytics:

1. Go to your project dashboard
2. Navigate to Analytics tab
3. Enable Web Analytics

### Custom Domains

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

## Troubleshooting

### Build Fails with Missing Dependencies

**Problem**: Build fails because dependencies are missing.

**Solution**: Ensure build command includes `--include=dev`:

```bash
npm ci --include=dev && npx convex deploy --cmd 'npm run build'
```

This is necessary because Vercel sets `NODE_ENV=production` which normally skips devDependencies.

### Edge Functions Not Working

**Problem**: API routes return errors or don't proxy correctly.

**Solution**: Verify `VITE_CONVEX_URL` is set in Vercel environment variables:

1. Go to Project Settings → Environment Variables
2. Ensure `VITE_CONVEX_URL` is set for Production, Preview, and Development
3. Redeploy if you just added the variable

### Bot Detection Not Working

**Problem**: Social media previews don't show Open Graph images.

**Solution**: Check middleware configuration:

1. Verify `middleware.ts` is at the project root
2. Check that `VITE_CONVEX_URL` environment variable is set
3. Test with a bot user-agent:

```bash
curl -H "User-Agent: facebookexternalhit/1.0" https://your-site.vercel.app/your-post-slug
```

### Content Not Updating

**Problem**: New content doesn't appear after running `npm run sync:prod`.

**Solution**:

1. Verify `.env.production.local` exists with correct `VITE_CONVEX_URL`
2. Check sync output for errors
3. Verify content exists in Convex dashboard
4. Clear cache and reload browser

## Comparison: Netlify vs Vercel

| Feature | Netlify | Vercel |
|---------|---------|--------|
| Edge Functions | ✅ Deno Runtime | ✅ Edge Runtime |
| Build System | ✅ | ✅ |
| Preview Deployments | ✅ | ✅ Better UX |
| Analytics | ✅ Paid | ✅ Built-in |
| Custom Domains | ✅ | ✅ |
| Edge Network | ✅ Global | ✅ Global (faster) |
| DX | Good | Excellent |

## Migration from Netlify

If migrating from Netlify:

1. Keep both deployments during transition
2. Test Vercel deployment thoroughly
3. Update DNS when ready:
   - Remove Netlify DNS records
   - Add Vercel DNS records
4. SSL certificates transfer automatically

## Advanced Configuration

### Custom Headers

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, s-maxage=600"
        }
      ]
    }
  ]
}
```

### Redirects

Add to `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Vercel Middleware](https://vercel.com/docs/functions/edge-middleware)
- [Convex Documentation](https://docs.convex.dev/)

## Support

For Vercel-specific issues:

- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

For Convex issues:

- [Convex Discord](https://convex.dev/community)
- [Convex Documentation](https://docs.convex.dev/)
