# Seeker Eats

A DoorDash-style food delivery app built with **Solana**, **Privy**, and **Expo**, featuring real-time delivery via **DoorDash Drive**.

## Technical Overview

### Architecture
- **Frontend**: React Native (Expo), NativeWind (Tailwind CSS), Privy (Embedded Wallets), Solana Web3.js.
- **Backend**: Node.js Relay Service hosted on **Railway**.
- **Integrations**:
  - **DoorDash Drive API**: For real-world delivery fulfillment.
  - **Twilio Voice API**: For automated order confirmation calls with accept/reject.
  - **Solana DevNet**: For USDC payment processing.

### Technology Stack
- **React Native**: 0.81.5
- **Expo**: 54.0.21
- **TypeScript**: 5.9.3
- **Solana**: @solana/web3.js 1.99.4
- **Authentication**: @privy-io/expo 0.5.7
- **Backend**: Node.js Express on Railway
- **Voice**: Twilio Voice API
- **Delivery**: DoorDash Drive API

### Key Features
- **🎥 Video Login**: Dynamic video background on the login screen.
- **🔐 Embedded Wallets**: Seamless wallet creation via Privy (Google Sign-in).
- **💸 Solana Payments**: Pay with USDC on DevNet.
- **🚚 Real-time Delivery**: Live quotes and tracking from DoorDash.
- **📞 Twilio Order Calls**: Automated restaurant calls with accept/reject (Press 1/2/3).
- **🛒 Shopping Cart**: Full cart management with checkout.
- **📦 Order Tracking**: Real-time delivery status updates.
- **⚙️ Settings**: Demo mode toggle and wallet management.
- **🧪 Demo Mode**: Low-cost testing mode (prices set to $0.01) for judges and developers.

---

## Repository Structure

```
seeker-eats/
├── android/                        # Native Android build
│   └── app/build/outputs/apk/debug/
│       └── app-debug.apk          # Pre-built APK for testing
├── app/                            # Expo Router screens
│   ├── (tabs)/                    # Tab navigation
│   │   ├── index.tsx              # Home/Restaurants list
│   │   ├── cart.tsx               # Shopping cart
│   │   ├── orders.tsx             # Order history
│   │   ├── account/               # Wallet management
│   │   ├── settings/              # App settings
│   │   └── _layout.tsx            # Tab navigation layout
│   ├── restaurant/
│   │   └── [id].tsx               # Restaurant details screen
│   ├── order-status.tsx           # Delivery tracking screen
│   ├── sign-in.tsx                # Google OAuth login
│   └── _layout.tsx                # Root layout
├── components/                     # UI components
│   ├── account/                   # Account features (14 files)
│   ├── auth/                      # Authentication provider
│   ├── settings/                  # Settings UI
│   ├── solana/                    # Wallet integration
│   ├── ui/                        # Base components
│   ├── wallet/                    # Wallet UI
│   ├── RestaurantCard.tsx         # Restaurant card component
│   └── app-providers.tsx          # App-level providers
├── services/
│   ├── api.ts                     # Railway backend API
│   └── solana-payment.service.ts  # USDC transfers
├── store/
│   └── cart-store.tsx             # Cart state management
├── constants/                      # App configuration
├── hooks/                          # Custom React hooks
├── utils/                          # Utility functions
├── assets/                         # Images, fonts, videos
│   ├── login-background.mp4       # Login screen video
│   └── seekereats_logo.png        # App logo
├── .env.example                    # Environment variables template
├── package.json
├── README.md                       # This file
├── SETUP_GUIDE.md                 # Detailed setup instructions
└── TESTING.md                     # Testing procedures
```

---

## Backend API

The app connects to a Node.js Express backend hosted on Railway:

**Backend URL**: `https://seekereats-relay-backend-production.up.railway.app`

### Main Endpoints

#### Restaurants
- `GET /restaurants` - List all available restaurants
- `GET /restaurants/:id` - Get restaurant details

#### Delivery (DoorDash Drive)
- `POST /relay/delivery` - Get delivery quote
- `POST /relay/delivery/:id/accept` - Accept quote
- `GET /relay/delivery/:id` - Get delivery status

#### Twilio Order Calls
- `POST /relay/order-call` - Initiate Twilio call to restaurant
- `GET /relay/order-call/:call_sid/status` - Get call status
- `POST /twilio/twiml` - TwiML generation endpoint
- `POST /twilio/order-response` - Handle DTMF input (1/2/3)

---

## Twilio Call Flow

When a customer places an order, the app initiates an automated call to the restaurant:

1. **User checks out** → App calls `POST /relay/order-call`
2. **Backend generates TwiML** → Twilio calls restaurant phone number
3. **Restaurant hears order details** (items, total, delivery address)
4. **Restaurant presses**:
   - **1** = Accept order (driver dispatched)
   - **2** = Reject order (customer notified)
   - **3** = Repeat message
5. **Status updates in app** → Real-time order tracking begins

The call response is tracked in memory and returned via the status endpoint.

---

## Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Required variables:

```
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_SOLANA_NETWORK=devnet
EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS=<your-devnet-wallet-address>
EXPO_PUBLIC_USDC_MINT_ADDRESS=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

---

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Follow the [Environment Variables](#environment-variables) section above.

### 3. Run the App
**Important:** Use this specific command to run the development client with localhost support:
```bash
npx expo start --dev-client --localhost -c
```

---

## Testing Instructions

### Option A: Pre-built APK (Easiest for Judges)
For the easiest testing experience, use the pre-built debug APK:

1. **Download APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
2. **Transfer to Android device** via USB or cloud storage
3. **Install** by opening the APK file on your device
4. **Launch** the app and sign in with Google

### Option B: Android Emulator
1. Ensure **Android Studio** is installed and an emulator is running
2. Run: `npx expo start --dev-client --localhost -c`
3. Press `a` in the terminal to launch the app

### Option C: Physical Device
1. Enable **USB debugging** on your Android device
2. Connect via USB
3. Run: `npm run android`

### Option D: Build from Source
To rebuild the native Android project:

```bash
cd android
./gradlew assembleDebug
```

The APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## For Judges - Quick Start

To test the app quickly:

1. **Download APK**: Get `app-debug.apk` from `android/app/build/outputs/apk/debug/`
2. **Install on Android device**: Transfer and install the APK
3. **Sign in with Google**: Privy will create an embedded Solana wallet automatically
4. **Fund wallet with DevNet USDC**:
   - Get your wallet address from the Account tab
   - Use [Solana Faucet](https://faucet.solana.com/) to get DevNet SOL
   - Use [SPL Token Faucet](https://spl-token-faucet.com/) to get DevNet USDC
5. **Order food**:
   - Browse restaurants (demo mode: $0.01 prices)
   - Add items to cart
   - Checkout with USDC
   - Receive Twilio call confirmation (press 1/2/3)
   - Track delivery in real-time

---

## Demo Mode & Troubleshooting

### Demo Mode
The app defaults to **Demo Mode** to allow testing with minimal funds:
- **Prices**: All items are ~$0.01 USDC
- **Delivery**: Real DoorDash quotes are fetched, but fees are mocked to $0.01
- **Payments**: Real transactions occur on Solana DevNet
- **Toggle**: Can be disabled in Settings tab

### Troubleshooting
- **"Network request failed"**: Ensure you use `--localhost` in the start command
- **"No wallet connected"**: Sign out and sign back in to regenerate the Privy session
- **Privy "phishing attempt" warning**: This is normal after changing package names, safe to proceed
- **Backend URL**: The app connects to the production backend on Railway:
  `https://seekereats-relay-backend-production.up.railway.app`
- **Twilio calls not working**: Verify BASE_URL is set correctly in Railway environment variables
