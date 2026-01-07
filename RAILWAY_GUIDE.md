# Railway Deployment & Local Development Guide

This guide covers best practices for developing and deploying the Seeker Eats backend (`seekereats-relay`) with Railway.

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   seeker-eats       │────▶│  seekereats-relay   │────▶│   PostgreSQL DB     │
│   (Mobile App)      │     │  (Express Backend)  │     │   (Railway)         │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   seeker-landing    │     │   DoorDash / Twilio │
│   (Next.js)         │     │   (External APIs)   │
└─────────────────────┘     └─────────────────────┘
```

## Railway Setup

### 1. Create a Railway Project

1. Go to [Railway.app](https://railway.app) and sign in.
2. Click **New Project** → **Empty Project**.
3. Name it something like `seekereats-prod`.

### 2. Add PostgreSQL Database

1. In your Railway project, click **+ Add Service** → **Database** → **PostgreSQL**.
2. Railway will provision a PostgreSQL instance automatically.
3. Click on the PostgreSQL service → **Variables** tab.
4. Copy the `DATABASE_URL` value (starts with `postgresql://...`).

### 3. Deploy Your Backend

**Option A: Connect GitHub (Recommended)**
1. Click **+ Add Service** → **GitHub Repo**.
2. Select `seekereats-relay` repository.
3. Railway will auto-detect it's a Node.js app.

**Option B: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
cd seekereats-relay
railway link

# Deploy
railway up
```

### 4. Configure Environment Variables

In Railway dashboard, click on your backend service → **Variables** tab:

```env
# Required
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway auto-injects this if you link services
DOORDASH_DEVELOPER_ID=xxx
DOORDASH_KEY_ID=xxx
DOORDASH_SIGNING_SECRET=xxx
RELAY_SECRET=your_secret_key
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Optional
PORT=3000
NODE_ENV=production
ENABLE_PHONE_CALLS=true
```

### 5. Add Build & Start Commands

In Railway service settings:
- **Build Command**: `npm install && npx prisma generate && npx prisma db push`
- **Start Command**: `npm run prod`

Or add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "tsc && prisma generate",
    "prod": "node dist/index.js"
  }
}
```

---

## Local Development Best Practices

### Should I Use Railway CLI Locally?

**Short Answer**: It's optional but can be helpful.

**When to use Railway CLI:**
- Syncing environment variables (`railway run npm run dev`)
- Testing with production-like settings
- Quick deployments

**When NOT to use Railway CLI:**
- You need faster iteration (direct `npm run dev` is faster)
- You want a local database (SQLite)
- Railway CLI adds slight overhead

### Recommended Local Setup

#### 1. Use Local SQLite for Development

For local development, use SQLite (simpler, no Docker needed):

```bash
# In seekereats-relay/.env
DATABASE_URL="file:./prisma/dev.db"
```

**Important**: The Prisma schema is set to `postgresql`. For local SQLite:
1. Temporarily change `provider = "postgresql"` to `provider = "sqlite"` in `schema.prisma`.
2. Run `npx prisma db push`.
3. Before committing, change it back to `postgresql`.

Or, use a local PostgreSQL via Docker:

```bash
docker run --name postgres-local -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
# DATABASE_URL="postgresql://postgres:password@localhost:5432/seekereats"
```

#### 2. Environment Variables

Create a `.env` file in each project:

**seekereats-relay/.env** (Local):
```env
DATABASE_URL="file:./prisma/dev.db"
DOORDASH_DEVELOPER_ID=xxx
DOORDASH_KEY_ID=xxx
DOORDASH_SIGNING_SECRET=xxx
RELAY_SECRET=local_secret
PORT=3000
ENABLE_PHONE_CALLS=false
```

**seeker-eats/.env** (Mobile):
```env
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:3000  # For Android Emulator
# EXPO_PUBLIC_BACKEND_URL=http://localhost:3000  # For iOS Simulator
```

**seeker-landing/.env.local** (Landing Page):
```env
NEXT_PUBLIC_RELAY_API_URL=http://localhost:3000
```

#### 3. Running Locally

```bash
# Terminal 1: Backend
cd seekereats-relay
npm install
npx prisma generate
npx prisma db push  # Creates tables
npm run dev

# Terminal 2: Mobile App
cd seeker-eats
npm install
npx expo start --dev-client  # Or just `npx expo start`

# Terminal 3: Landing Page (optional)
cd seeker-landing
npm install
npm run dev
```

---

## Mobile App + Backend Integration

### Network Configuration for Mobile

| Environment          | Backend URL                                    |
|----------------------|------------------------------------------------|
| Android Emulator     | `http://10.0.2.2:3000`                         |
| iOS Simulator        | `http://localhost:3000`                        |
| Physical Device      | `http://<your-computer-ip>:3000`               |
| Production           | `https://seekereats-relay.up.railway.app`      |

Set in `seeker-eats/.env`:
```env
EXPO_PUBLIC_BACKEND_URL=<url from table above>
```

### Privy User Email

The waitlist system assumes users log in via Google OAuth (which provides email). If using wallet-only login, you'll need to:
1. Prompt users to enter their email manually, OR
2. Use wallet address as the identifier instead of email.

---

## Deployment Checklist

Before deploying to production:

- [ ] Update `prisma/schema.prisma` provider to `postgresql`
- [ ] Run `npx prisma generate` locally to verify schema
- [ ] Set all environment variables in Railway
- [ ] Update mobile app's `EXPO_PUBLIC_BACKEND_URL` to production URL
- [ ] Update landing page's `NEXT_PUBLIC_RELAY_API_URL` to production URL
- [ ] Test access code generation: `railway run npx ts-node scripts/generate-code.ts VIP 100`
- [ ] Build and deploy mobile app with EAS: `eas build --platform android`

---

## Troubleshooting

### "PrismaClientInitializationError"
- Ensure `DATABASE_URL` is set correctly.
- Run `npx prisma generate` after any schema changes.
- On Railway, ensure the build command includes `prisma generate`.

### "Network request failed" on Mobile
- Check `EXPO_PUBLIC_BACKEND_URL` is correct.
- For Android emulator, use `10.0.2.2` not `localhost`.
- Ensure backend is running and accessible.

### "Cannot find module '@prisma/client'"
- Run `npm install` then `npx prisma generate`.

---

## Quick Reference Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Generate access code
npx ts-node scripts/generate-code.ts MY_CODE 50

# Deploy to Railway
railway up

# View Railway logs
railway logs
```
