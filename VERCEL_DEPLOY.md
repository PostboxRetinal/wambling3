# Vercel Deployment Guide for Wambling3

## Overview
This repository is configured for automatic deployment to Vercel from the `main` branch.

## Quick Start

### 1. Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project" or "Import Project"
3. Import the `PostboxRetinal/wambling3` repository from GitHub
4. Vercel will automatically detect the configuration from `vercel.json`

### 2. Configure Environment Variables
Before deploying, add these required environment variables in Vercel Project Settings → Environment Variables:

#### Required Variables
- **`NEXT_PUBLIC_PRIVY_APP_ID`**
  - Description: Privy authentication app ID for Web3 login
  - Get from: [Privy Dashboard](https://dashboard.privy.io/)
  - Scope: Production, Preview, Development

- **`NEXT_PUBLIC_ALCHEMY_ID`**
  - Description: Alchemy API key for Ethereum RPC endpoints
  - Get from: [Alchemy Dashboard](https://dashboard.alchemy.com/)
  - Scope: Production, Preview, Development

- **`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`**
  - Description: WalletConnect project ID for wallet connections
  - Get from: [WalletConnect Cloud](https://cloud.walletconnect.com/)
  - Scope: Production, Preview, Development

### 3. Deploy
Once environment variables are configured, click "Deploy". The initial deployment will take 2-3 minutes.

## Configuration Files

### `vercel.json`
Main configuration file that tells Vercel:
- **Build Command**: `cd frontend && pnpm install && pnpm run build`
- **Framework**: Next.js (automatically detected)
- **Output Directory**: `frontend/.next`
- **Auto-deploy**: Enabled for `main` branch

### `.vercelignore`
Excludes unnecessary files from deployment:
- Smart contracts (`contracts/` directory)
- Git metadata
- GitHub workflows

## Project Structure
```
wambling3/
├── frontend/           # Next.js 16 application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   └── ...
├── contracts/         # Solidity contracts (excluded from deployment)
├── vercel.json        # Vercel configuration
└── .vercelignore      # Deployment exclusions
```

## Deployment Behavior

### Automatic Deployments
- **Main Branch**: 
  - Pushes to `main` trigger production deployments
  - URL: `https://wambling3.vercel.app` (or your custom domain)
  
- **Pull Requests**: 
  - Each PR gets a unique preview URL
  - Preview deployments are updated on each push
  - Format: `https://wambling3-git-<branch>-<org>.vercel.app`

- **Other Branches**:
  - Non-PR branches get preview deployments
  - Accessible via branch-specific URLs

### Build Process
1. Vercel clones the repository
2. Changes directory to `frontend/`
3. Runs `pnpm install` to install dependencies
4. Runs `pnpm run build` to build the Next.js app
5. Deploys the `.next` output directory

## Troubleshooting

### Build Failures

#### Missing Environment Variables
**Error**: "Cannot initialize the Privy provider with an invalid Privy app ID"
**Solution**: Ensure all three required environment variables are set in Vercel project settings

#### Node/pnpm Version Issues
**Solution**: Vercel automatically uses the latest stable Node.js and pnpm versions. If needed, specify versions in `package.json`:
```json
{
  "engines": {
    "node": ">=20.x",
    "pnpm": ">=10.x"
  }
}
```

#### Build Timeout
**Solution**: Next.js builds should complete in 2-3 minutes. If builds timeout:
1. Check for large dependencies
2. Consider using Vercel's build cache (enabled by default)
3. Upgrade to a Vercel Pro plan if needed for longer build times

### Runtime Errors

#### RPC Connection Issues
**Solution**: Verify `NEXT_PUBLIC_ALCHEMY_ID` is valid and has sufficient credits

#### Wallet Connection Problems
**Solution**: Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is active and not rate-limited

## Performance Optimization

The application is configured for optimal performance:
- **Turbopack**: Used for faster builds (Next.js 16 default)
- **Dynamic Rendering**: Protected routes use `force-dynamic` to prevent static generation issues
- **Client Components**: Auth-dependent components are client-side only
- **Code Splitting**: Automatic code splitting via Next.js App Router

## Security Notes

- All sensitive keys are prefixed with `NEXT_PUBLIC_` because they're used client-side
- These keys are exposed in the browser bundle (this is expected for Web3 dApps)
- Use domain restrictions and rate limiting in Alchemy, Privy, and WalletConnect dashboards
- Never commit `.env` or `.env.local` files (already in `.gitignore`)

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

For application issues:
- Check the repository issues
- Review build logs in Vercel dashboard
