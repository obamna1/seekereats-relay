# Square Environment Architecture

## Overview

There are **TWO completely separate environments**:

| Environment    | Purpose     | Token Source       | Restaurant Source           |
| -------------- | ----------- | ------------------ | --------------------------- |
| **Sandbox**    | Testing     | Railway ENV vars   | Virtual restaurant from env |
| **Production** | Real orders | PostgreSQL (OAuth) | Merchants who connected     |

---

## How It Works

### SANDBOX (for testing)

```
┌─────────────────────────────────────────────────────────┐
│  RAILWAY ENVIRONMENT VARIABLES                          │
│  ─────────────────────────────                          │
│  SQUARE_ACCESS_TOKEN = sandbox access token             │
│  SQUARE_LOCATION_ID  = sandbox location ID              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  GET /restaurants?sandbox=true                          │
│  ─────────────────────────────                          │
│  Returns: 1 "Sandbox Test Restaurant"                   │
│  Uses Square Sandbox API                                │
│  Payments use FAKE credit cards (cnon:card-nonce-ok)    │
└─────────────────────────────────────────────────────────┘
```

**When to use**: Testing the full order flow without real money.

---

### PRODUCTION (for real orders)

```
┌─────────────────────────────────────────────────────────┐
│  POSTGRESQL DATABASE (SquareMerchant table)             │
│  ─────────────────────────────────────────              │
│  - merchantId                                           │
│  - accessToken (from OAuth)                             │
│  - refreshToken                                         │
│  - locationId                                           │
│  - businessName                                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  GET /restaurants?sandbox=false (or no param)           │
│  ─────────────────────────────────────────              │
│  Returns: All merchants who have connected via OAuth    │
│  Uses Square Production API                             │
│  Payments use REAL credit cards                         │
└─────────────────────────────────────────────────────────┘
```

**When to use**: Real restaurant operations.

---

## Railway Environment Variables

These should be configured in Railway:

### Required for SANDBOX:

```bash
# Square Sandbox credentials (from Square Developer Dashboard)
SQUARE_ACCESS_TOKEN=<sandbox access token>
SQUARE_LOCATION_ID=<sandbox location ID>
```

### Required for PRODUCTION OAuth:

```bash
# OAuth credentials (from Square Developer Dashboard)
SQUARE_APPLICATION_ID=<production app ID>
SQUARE_APP_SECRET=<production app secret>

# PostgreSQL connection (auto-set by Railway)
DATABASE_URL=<postgresql connection string>
```

---

## Mobile App Usage

```typescript
// Testing with sandbox
const restaurants = await api.getRestaurants(true); // sandbox=true
const menu = await api.getSquareMenu('sandbox', true);

// Production (real restaurants)
const restaurants = await api.getRestaurants(false); // sandbox=false
const menu = await api.getSquareMenu(restaurant.merchantId, false);
```

---

## Testing Checklist

### Sandbox Testing

1. ✅ Set `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` in Railway
2. ✅ Call `GET /restaurants?sandbox=true` → Should return sandbox restaurant
3. ✅ Call `GET /square/menu?sandbox=true` → Should return sandbox menu
4. ✅ Create test order with fake card `cnon:card-nonce-ok`

### Production Testing

1. ✅ Restaurant connects via OAuth at `/oauth/start`
2. ✅ Tokens saved to PostgreSQL `SquareMerchant` table
3. ✅ Call `GET /restaurants?sandbox=false` → Should return OAuth merchants
4. ✅ Orders use real payment cards
