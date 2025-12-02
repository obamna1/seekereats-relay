# SeekerEats DoorDash Relay API

A minimal Node.js/Express API relay service for the SeekerEats Solana Mobile hackathon app. Relays delivery requests to the DoorDash Drive API (sandbox) using the official quote workflow.

**Includes a web UI for testing the delivery quote workflow locally.**

## Architecture

```
Android App (Solana Mobile)
    ↓
SeekerEats Relay API (Express)
    ↓
DoorDash Drive API (Sandbox)
```

## Features

- **Quote Delivery**: `POST /relay/delivery` – Get quote (fee, times) for a delivery route
- **Accept Quote**: `POST /relay/delivery/:id/accept` – Accept quote and create actual delivery
- **Get Status**: `GET /relay/delivery/:external_delivery_id` – Fetch delivery status in real-time
- **Place Order via Phone**: `POST /relay/order-call` – Automated phone call with text-to-speech order details
- **Call Status**: `GET /relay/order-call/:call_sid/status` – Track call status and duration
- **Web UI**: Open `http://localhost:3000/` to test the workflow visually
- **Auth**: All relay endpoints require `X-Relay-Secret` header
- **Health Check**: `GET /health` – No auth required

## Setup

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd seekereats-relay
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your DoorDash credentials to `.env`:
```env
DOORDASH_DEVELOPER_ID=your_id
DOORDASH_KEY_ID=your_key_id
DOORDASH_SIGNING_SECRET=your_base64_secret
RELAY_SECRET=your_relay_secret
PORT=3000
```

**Get DoorDash credentials from:** https://developer.doordash.com/portal/integration/drive/credentials

3. (Optional) Add Twilio credentials for phone call feature:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1your_twilio_number
TEST_PHONE_NUMBER=+1your_test_phone_number
```

**Get Twilio credentials from:** https://console.twilio.com
- **TWILIO_ACCOUNT_SID** and **TWILIO_AUTH_TOKEN** are in your Account Dashboard
- **TWILIO_PHONE_NUMBER** is your Twilio phone number (must have voice capability)
- **TEST_PHONE_NUMBER** is the number to receive test calls during development

## Development

### Run locally

1. **Compile TypeScript:**
```bash
npm run build
```

2. **Start the server:**
```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Using the Web UI (Recommended)

**Easiest way to test locally:**

1. Open your browser to `http://localhost:3000/`
2. Click **"Auto Fill Test Data"** to populate form with test addresses
3. Click **"Get Quote"** to fetch a delivery quote
4. Click **"Accept Quote"** to confirm and create the delivery
5. Use the **DoorDash Delivery Simulator** to advance the order status (see below)
6. Click **"Refresh Status"** to see live delivery updates

The UI displays API responses and real-time status changes.

### Testing via cURL

**Step 1: Get a Quote**
```bash
curl -X POST http://localhost:3000/relay/delivery \
  -H "Content-Type: application/json" \
  -H "X-Relay-Secret: seekereats-hackathon-secret-2024" \
  -d '{
    "pickup_address": "1000 4th Ave, Seattle, WA, 98104",
    "pickup_business_name": "Test Pickup",
    "pickup_phone_number": "+16505555555",
    "dropoff_address": "1201 3rd Ave, Seattle, WA, 98101",
    "dropoff_business_name": "Test Dropoff",
    "dropoff_phone_number": "+16505555555",
    "order_value": 1999
  }'
```

Response includes `external_delivery_id`, `fee`, and estimated times.

**Step 2: Accept the Quote**
```bash
curl -X POST http://localhost:3000/relay/delivery/{DELIVERY_ID}/accept \
  -H "Content-Type: application/json" \
  -H "X-Relay-Secret: seekereats-hackathon-secret-2024" \
  -d '{}'
```

**Step 3: Advance Order Status (via DoorDash Simulator)**
Go to the **DoorDash Developer Portal** → **Delivery Simulator** and search for your `external_delivery_id`. Manually transition the delivery through states:
- `created` → `enroute_to_pickup` → `arrived_at_pickup` → `picked_up` → `arrived_at_dropoff` → `delivered`

**Step 4: Get Delivery Status**
```bash
curl -X GET http://localhost:3000/relay/delivery/{DELIVERY_ID} \
  -H "X-Relay-Secret: seekereats-hackathon-secret-2024"
```

The status will reflect changes made in the DoorDash Simulator.

**Health Check (no auth):**
```bash
curl http://localhost:3000/health
```

## API Endpoints

All endpoints require the `X-Relay-Secret` header.

### POST /relay/delivery
Get a delivery quote to check if the route is serviceable and retrieve estimated fee/times.

**Headers:**
- `X-Relay-Secret: <relay_secret>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "pickup_address": "1000 4th Ave, Seattle, WA, 98104",
  "pickup_business_name": "Restaurant Name",
  "pickup_phone_number": "+16505555555",
  "pickup_instructions": "Optional instructions",
  "dropoff_address": "1201 3rd Ave, Seattle, WA, 98101",
  "dropoff_business_name": "Destination Name",
  "dropoff_phone_number": "+16505555555",
  "dropoff_instructions": "Optional instructions",
  "order_value": 1999
}
```

**Response (200):**
```json
{
  "external_delivery_id": "ff30d4eb-8b9c-4b5a-9b36-a60ea98a032e",
  "delivery_status": "quote",
  "fee": 975,
  "currency": "USD",
  "pickup_address": "1000 4th Ave, Seattle WA 98104-1109, United States",
  "dropoff_address": "1201 3rd Ave, Seattle WA 98101-1003, United States",
  "pickup_time_estimated": "2025-12-01T14:40:00Z",
  "dropoff_time_estimated": "2025-12-01T14:50:00Z"
}
```

### POST /relay/delivery/:external_delivery_id/accept
Accept the quote and create the actual delivery. **Must be called within 5 minutes of getting the quote.**

**Headers:**
- `X-Relay-Secret: <relay_secret>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "tip": 600
}
```

Optional: Include `tip` (in cents) to add a tip when accepting.

**Response (201):**
```json
{
  "external_delivery_id": "ff30d4eb-8b9c-4b5a-9b36-a60ea98a032e",
  "delivery_status": "created",
  "fee": 975,
  "tracking_url": "https://doordash.com/tracking?id=...",
  "pickup_address": "1000 4th Ave, Seattle WA 98104-1109, United States",
  "dropoff_address": "1201 3rd Ave, Seattle WA 98101-1003, United States"
}
```

### GET /relay/delivery/:external_delivery_id
Get current delivery status. Status progresses as the order moves through fulfillment.

**Headers:**
- `X-Relay-Secret: <relay_secret>`

**Response (200):**
```json
{
  "external_delivery_id": "ff30d4eb-8b9c-4b5a-9b36-a60ea98a032e",
  "delivery_status": "picked_up",
  "fee": 975,
  "tracking_url": "https://doordash.com/tracking?id=...",
  "pickup_address": "1000 4th Ave, Seattle WA 98104-1109, United States",
  "dropoff_address": "1201 3rd Ave, Seattle WA 98101-1003, United States"
}
```

**Possible Status Values:**
- `quote` - Quote received (before accepting)
- `created` - Delivery confirmed, waiting for Dasher
- `enroute_to_pickup` - Dasher is heading to pickup location
- `arrived_at_pickup` - Dasher arrived at pickup
- `picked_up` - Order picked up and heading to dropoff
- `arrived_at_dropoff` - Dasher arrived at dropoff location
- `delivered` - Order delivered

### POST /relay/order-call
Place an automated phone call with text-to-speech order details. Uses Twilio Programmable Voice to call a phone number and read order information aloud.

**Headers:**
- `X-Relay-Secret: <relay_secret>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "order_details": "1 large pizza, 2 sodas",
  "dropoff_address": "1201 3rd Ave, Seattle, WA, 98101"
}
```

**Response (200):**
```json
{
  "call_sid": "CA1234567890abcdef1234567890abcdef",
  "status": "initiated",
  "phone_number": "+14135551234",
  "message": "Call initiated successfully"
}
```

**What happens:**
- Twilio initiates an outbound call to `TEST_PHONE_NUMBER` from your `TWILIO_PHONE_NUMBER`
- The call will read: "Hello, I would like to place an order for {order_details}, delivered to {dropoff_address}"
- The `call_sid` is used to track call status

### GET /relay/order-call/:call_sid/status
Get the real-time status of a phone call.

**Headers:**
- `X-Relay-Secret: <relay_secret>`

**Response (200):**
```json
{
  "call_sid": "CA1234567890abcdef1234567890abcdef",
  "status": "completed",
  "phone_number": "+14135551234",
  "delivery_id": null,
  "duration": 25,
  "created_at": "2025-12-01T20:30:00.000Z",
  "end_time": "2025-12-01T20:30:25.000Z"
}
```

**Possible Status Values:**
- `queued` - Call is queued to be placed
- `ringing` - Phone is ringing on the recipient's end
- `in-progress` - Call is active
- `completed` - Call finished
- `failed` - Call failed to connect
- `busy` - Phone line was busy
- `no-answer` - Recipient did not answer

## Twilio Phone Call Integration

The relay includes a web UI button to test placing phone orders via automated calls.

### How to Use (Web UI)
1. Open `http://localhost:3000/`
2. Enter order details (e.g., "1 large pizza, 2 sodas")
3. Verify the dropoff address is filled in
4. Click **"Place Order via Phone"**
5. Twilio will call your test phone number and read the order details aloud
6. The UI will show the call status in real-time

### Message Format
The automated call will speak:
```
"Hello, I would like to place an order for {order_details}, delivered to {dropoff_address}"
```

### Testing Without Twilio
If Twilio credentials are not configured:
- The phone call button will still appear in the UI
- Clicking it will attempt to call but may fail
- Configure Twilio credentials in `.env` to use this feature

### For Android Developers
The `/relay/order-call` endpoint can be integrated into your Android app to place orders via automated phone calls. Send the order details and dropoff address, and Twilio will handle the rest.

## Deployment (Railway)

### 1. Create Git Repository
```bash
git init
git add .
git commit -m "Initial commit: SeekerEats relay service"
git remote add origin https://github.com/yourusername/seekereats-relay.git
git push -u origin main
```

### 2. Connect to Railway
1. Go to https://railway.app
2. Create new project → GitHub
3. Select this repo
4. Railway auto-detects Node.js

### 3. Set Environment Variables in Railway Dashboard
```
DOORDASH_DEVELOPER_ID=...
DOORDASH_KEY_ID=...
DOORDASH_SIGNING_SECRET=...
RELAY_SECRET=...
PORT=3000
NODE_ENV=production

# Optional: Twilio credentials (for phone call feature)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TEST_PHONE_NUMBER=...
```

### 4. Deploy
Railway auto-deploys on git push.

## DoorDash Drive API Workflow

This relay implements the **official DoorDash Drive v2 quote workflow**:

1. **Get Quote** - `POST /drive/v2/quotes` - Check if route is serviceable, get fee & times
2. **Accept Quote** - `POST /drive/v2/quotes/{id}/accept` - Confirm and create actual delivery
3. **Get Status** - `GET /drive/v2/deliveries/{id}` - Poll for real-time delivery updates
4. **Auth** - Bearer JWT (HS256 signed) with custom `dd-ver: DD-JWT-V1` header

**API Base URL:** `https://openapi.doordash.com`

## Advancing Order Status in Testing

Order status does **not** advance automatically. Use the **DoorDash Delivery Simulator** to manually transition states:

1. Go to https://developer.doordash.com/portal/integration/drive/
2. Find **Delivery Simulator** in the dashboard
3. Search for your `external_delivery_id`
4. Manually transition through states:
   - `created` → `enroute_to_pickup` → `arrived_at_pickup` → `picked_up` → `arrived_at_dropoff` → `delivered`
5. Each transition is instant - perfect for testing your mobile app's status updates
6. Deliveries auto-cancel after 1 hour of inactivity

## Tech Stack

- **Language:** TypeScript
- **Framework:** Express.js
- **Auth:** JWT (jsonwebtoken)
- **HTTP:** axios
- **Environment:** dotenv

## Security Notes

- Never commit `.env` file (in `.gitignore`)
- Use strong `RELAY_SECRET` values
- Only expose this API to trusted services (internal network)
- DoorDash signing secret is base64-encoded

## For Android Frontend Developers

This relay service provides the following API endpoints your Android app should call:

### Core Delivery Endpoints
1. **Get Quote** - Show the user the delivery fee & estimated pickup/dropoff times before they confirm
2. **Accept Quote** - Create the actual delivery when user confirms
3. **Get Status** - Poll for delivery status updates (use these to show real-time tracking UI)

### Optional: Phone Order Endpoint
4. **Place Order via Phone** - Initiate an automated phone call to place an order with text-to-speech details

All requests require the `X-Relay-Secret` header:
```
X-Relay-Secret: seekereats-hackathon-secret-2024
```

**Example workflow in your Android app (Delivery):**

```
User clicks "Request Delivery"
    ↓
GET QUOTE → Display fee, times, serviceable status
    ↓
User clicks "Confirm"
    ↓
ACCEPT QUOTE → Get tracking URL
    ↓
Poll GET STATUS every 5-10 seconds
    ↓
Update UI with status (enroute, arrived, picked_up, delivered)
```

**Example workflow for phone orders (Optional):**

```
User clicks "Place Order via Phone"
    ↓
POST /relay/order-call with order details + dropoff address
    ↓
Get call_sid from response
    ↓
Poll GET /relay/order-call/:call_sid/status every 2-3 seconds
    ↓
Show call status to user (ringing, in-progress, completed)
```

For integration questions or API schema details, check the full endpoint documentation above.

## Hackathon Timeline

- **Phase 0:** ✅ Validated sample app with credentials
- **Phase 1:** ✅ Project setup & dependencies
- **Phase 2:** ✅ Core modules (config, client, routes)
- **Phase 3:** ✅ Tested quote workflow locally
- **Phase 4:** ✅ Created web UI for testing
- **Phase 5:** 🔄 Deploy to Railway & share with team
- **Phase 6:** ✅ Added Twilio phone call integration (automated order placement via voice)

## Support & Troubleshooting

**Common Issues:**

- **"Missing required fields"** - Check all required fields in request body (pickup/dropoff address, phone, etc.)
- **"API Offline"** - Verify `npm run dev` is running and API is on `http://localhost:3000`
- **Quote returns error about address** - The address may not be serviceable in DoorDash's coverage area. Try Seattle addresses (included in test data).
- **Status not updating** - Remember to use DoorDash Delivery Simulator to manually advance states. Status doesn't auto-advance.

**Resources:**

- [DoorDash Drive API Docs](https://developer.doordash.com/en-US/docs/drive)
- [Delivery Simulator](https://developer.doordash.com/portal/integration/drive/)
- Full API reference above in this README

---

Built for **SeekerEats** — Solana Mobile hackathon 2024
