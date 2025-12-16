# Vercel Deployment - Quick Start

## TL;DR

1. **Deploy Convex first**:
   ```bash
   npx convex deploy
   npm run sync:prod
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Import your repository
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add ONE environment variable**:
   - `VITE_CONVEX_URL` = `https://your-deployment.convex.cloud`
   - Set for Production, Preview, and Development

4. **Deploy!**

## That's It!

The build command is simply `npm run build` - Convex is deployed separately, not during the Vercel build.

For detailed documentation, see [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

## Troubleshooting

**Build fails with 401 Unauthorized / MissingAccessToken?**
- This means Vercel is trying to deploy Convex during build
- Make sure `vercel.json` has `"buildCommand": "npm run build"` (not the Convex deploy command)
- Make sure you've already deployed Convex separately with `npx convex deploy`

**Environment variable error?**
- Only set `VITE_CONVEX_URL` (NOT `CONVEX_DEPLOY_KEY`)
- Set it manually in Vercel dashboard, not in `vercel.json`
- Make sure it's set for all three environments

**Functions not working?**
- Verify `VITE_CONVEX_URL` is set correctly
- Check that middleware.ts and api/*.ts files exist
- Redeploy after adding environment variables
