# Railway Configuration & Rollback Guide

## Current State (Before Changes)

- **Project:** SeekerEats
- **Environment:** production
- **Service:** Postgres (was linked)

## Service Linking

Railway CLI can be linked to different services within the same project. You need to link to the **backend service** (not Postgres) to use `railway run` for your backend code.

### To Link to Backend Service:

```bash
cd seekereats-relay
railway link
# Select: SeekerEats → production → seekereats-relay-backend
```

### To Link to Postgres (for DB operations):

```bash
railway link
# Select: SeekerEats → production → Postgres
```

### To Unlink Entirely:

```bash
railway unlink
```

## Environment Variables Access

After linking to backend service:

```bash
railway variables  # View all env vars
railway run npm run dev  # Run with Railway env vars
```

## Database Backup (Manual)

Railway provides automatic backups, but for manual backup:

1. **Via Railway Dashboard:**

   - Go to railway.app → SeekerEats → Postgres
   - Click "Backups" tab
   - Railway keeps automatic daily backups

2. **Via CLI (pg_dump):**
   ```bash
   railway connect  # Opens psql shell
   # Or use pg_dump with DATABASE_URL
   ```

## Rollback Instructions

| Change                 | How to Revert                                           |
| ---------------------- | ------------------------------------------------------- |
| Service link change    | `railway link` → select Postgres again                  |
| Database schema change | `railway run npx prisma migrate reset` (⚠️ destructive) |
| Unlink                 | `railway link` → re-select service                      |

## Important Notes

- **Railway auto-deploys on git push** to connected repos
- **Database is separate from backend** - breaking backend won't affect data
- **Backups are automatic** - Railway keeps point-in-time backups
