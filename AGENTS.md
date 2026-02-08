# Seekereats Relay - Agent Context

> Express.js backend API for Seeker Eats, handling delivery fulfillment and restaurant calls.

## Quick Facts

| Item         | Value                                  |
| ------------ | -------------------------------------- |
| Type         | Node.js + Express + TypeScript backend |
| Database     | PostgreSQL via Prisma ORM              |
| Hosting      | Railway (production)                   |
| Integrations | DoorDash Drive, Twilio Voice           |
| Port         | 3000 (local dev)                       |

## How to Run

```bash
# Development
npm run dev

# Production (after build)
npm run build && npm run prod

# Database commands
npm run db:push    # Apply schema changes
npm run db:studio  # Open Prisma Studio GUI
```

## Critical Knowledge

- All `/relay/*` endpoints require `X-Relay-Secret` header
- `RELAY_SECRET` env var must match mobile app's `EXPO_PUBLIC_RELAY_SECRET`
- Twilio calls use TwiML: 1=accept, 2=reject, 3=repeat
- DoorDash Drive API requires JWT signing with developer credentials
- Phone calls currently hardcoded to test number `+14134741348` (see `routes/relay.ts:177`)

## Route Authentication

| Route                              | Auth Required                 |
| ---------------------------------- | ----------------------------- |
| `/restaurants`, `/restaurants/:id` | No                            |
| `/twilio/*`                        | No (Twilio webhooks)          |
| `/waitlist/*`                      | No                            |
| `/health`                          | No                            |
| `/relay/*`                         | Yes (`X-Relay-Secret` header) |

## Key Files

| File                            | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `src/app.ts`                    | Express app setup, middleware, route mounting  |
| `src/routes/relay.ts`           | Delivery quotes, order calls, config endpoints |
| `src/routes/twilio.ts`          | TwiML webhook handlers, call state storage     |
| `src/routes/restaurants.ts`     | Public restaurant listing endpoints            |
| `src/middleware/auth.ts`        | X-Relay-Secret header validation               |
| `src/clients/DoorDashClient.ts` | DoorDash Drive API integration                 |
| `prisma/schema.prisma`          | Database schema                                |

## API Endpoints

| Method | Endpoint                        | Description                        |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/restaurants`                  | List all restaurants               |
| GET    | `/restaurants/:id`              | Restaurant details + menu          |
| POST   | `/relay/delivery`               | Get DoorDash delivery quote        |
| POST   | `/relay/delivery/:id/accept`    | Accept quote, create delivery      |
| GET    | `/relay/delivery/:id`           | Delivery status                    |
| POST   | `/relay/order-call`             | Initiate Twilio call to restaurant |
| GET    | `/relay/order-call/:sid/status` | Call status                        |
| POST   | `/twilio/twiml`                 | Generate TwiML for call            |
| POST   | `/twilio/order-response`        | Handle DTMF input (1/2/3)          |

## Environment Variables

| Variable                  | Purpose                        |
| ------------------------- | ------------------------------ |
| `DATABASE_URL`            | PostgreSQL connection string   |
| `RELAY_SECRET`            | Shared secret with mobile app  |
| `BASE_URL`                | Public URL for Twilio webhooks |
| `DOORDASH_DEVELOPER_ID`   | DoorDash Drive API             |
| `DOORDASH_KEY_ID`         | DoorDash signing key           |
| `DOORDASH_SIGNING_SECRET` | DoorDash JWT signing           |
| `TWILIO_ACCOUNT_SID`      | Twilio account                 |
| `TWILIO_AUTH_TOKEN`       | Twilio auth                    |
| `TWILIO_PHONE_NUMBER`     | Outbound caller ID             |

## Database Models

| Model                     | Purpose                            |
| ------------------------- | ---------------------------------- |
| `User`                    | Users with optional wallet address |
| `Restaurant` + `MenuItem` | Restaurant catalog                 |
| `Order` + `OrderItem`     | Order records with payment info    |
| `Waitlist` + `AccessCode` | Beta access control                |
| `DeliveryAddress`         | Saved user addresses               |

## Testing

- **Unit tests**: `npm test` (Jest + supertest)
- **Lint/Format**: `npm run lint` / `npm run fmt`

## Recent Lessons Learned

<!-- Add new entries at the top, format: YYYY-MM-DD: Description -->

- **2026-02-08**: Square Orders API requires `variationId` (from `item.variations[0].id`), NOT catalog item ID. See [docs/SQUARE_SANDBOX_DEBUG.md](../seeker-eats/docs/SQUARE_SANDBOX_DEBUG.md).

## Common Mistakes to Avoid

- Don't forget to run `npm run db:push` after changing `prisma/schema.prisma`
- Call state is in-memory (`callStore`) - will be lost on server restart
