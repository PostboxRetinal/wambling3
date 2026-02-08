# Vercel Deployment Guide for Wambling3

## Overview
This repository is configured for automatic deployment to Vercel from the `main` branch.

## Configuration Files
- `vercel.json` - Main Vercel configuration
- `.vercelignore` - Files/directories to exclude from deployment

## Project Structure
The frontend application is located in the `frontend/` directory and is built with Next.js 16.

## Required Environment Variables
Configure the following environment variables in your Vercel project settings:

### Required
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy authentication app ID for Web3 login
- `NEXT_PUBLIC_ALCHEMY_ID` - Alchemy API key for Ethereum RPC endpoints
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID for wallet connections

## Deployment Setup

### First-Time Setup on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import the `PostboxRetinal/wambling3` repository
4. Vercel will automatically detect the Next.js framework
5. Configure the environment variables listed above
6. Deploy

### Automatic Deployments
- **Main Branch**: Automatically deploys to production when changes are pushed to `main`
- **Other Branches**: Preview deployments are created automatically for pull requests

## Build Configuration
- **Framework**: Next.js
- **Build Command**: `cd frontend && pnpm install && pnpm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `cd frontend && pnpm install`
- **Dev Command**: `cd frontend && pnpm run dev`

## Notes
- The project uses `pnpm` as the package manager
- The contracts directory is excluded from deployment (Solidity contracts are not needed for frontend)
- Build artifacts and node_modules are automatically excluded via `.gitignore`
