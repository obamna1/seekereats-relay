# Quick Setup Guide for Solana Payments

This guide will help you set up your Solana payment integration in 5 minutes.

## Prerequisites Checklist

- [ ] Node.js and npm installed
- [ ] Android Studio and emulator set up (for Android testing)
- [ ] Solana wallet (Phantom recommended)

---

## Step-by-Step Setup

### 1. Configure Merchant Wallet (2 minutes)

You need a DevNet wallet address to receive USDC payments.

#### Quick Option: Use Phantom Wallet

1. **Download Phantom**: https://phantom.app/
2. **Create a new wallet** (save your seed phrase!)
3. **Switch to DevNet**:
   - Open Phantom
   - Settings → Developer Settings → Testnet Mode → ON
   - Select "Devnet" from network dropdown
4. **Copy your wallet address**:
   - Click on your wallet name at the top
   - Click "Copy address"

#### Alternative: Use Solana CLI

```bash
# Generate new keypair
solana-keygen new --outfile ~/devnet-merchant.json

# Get the address
solana address -k ~/devnet-merchant.json

# Configure for devnet
solana config set --url https://api.devnet.solana.com
```

### 2. Set Up Environment Variables (1 minute)

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and replace `YOUR_MERCHANT_WALLET_ADDRESS_HERE` with your wallet address from Step 1:

```env
EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS=YourActualWalletAddressHere
```

**Example:**
```env
EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS=5Kq9NqWkJHYQJq8xZQr7h6C2p5AzQrV3BmX4kH8DyKpZ
```

### 3. Get Test Tokens (2 minutes)

Your merchant wallet needs USDC to test. But first, you'll need SOL for transaction fees.

#### Get SOL (for transaction fees)

**Option A: Solana Faucet (easiest)**
1. Go to https://faucet.solana.com/
2. Paste your wallet address
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. Wait ~30 seconds

**Option B: Solana CLI**
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url https://api.devnet.solana.com
```

#### Get DevNet USDC

**Important**: DevNet USDC can be tricky to get. Here are your best options:

**Option 1: SPL Token Faucet**
1. Go to https://spl-token-faucet.com/
2. Select "Devnet" network
3. Search for USDC (mint: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`)
4. Enter your wallet address
5. Request tokens

**Option 2: Ask in Solana Discord**
If faucets aren't working:
1. Join Solana Discord: https://discord.gg/solana
2. Go to `#devnet-support` channel
3. Ask: "Can someone send me some devnet USDC for testing? My address is [YOUR_ADDRESS]"

**Option 3: Mint Your Own (Advanced)**
If you're comfortable with Solana CLI:
```bash
# Create USDC token account
spl-token create-account Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

# You'll need someone with mint authority to send you tokens
# Or create your own test token for development
```

### 4. Run the App

```bash
# Install dependencies (first time only)
npm install

# Start the app
npm run android
```

---

## Quick Test Checklist

Once the app is running:

- [ ] Sign in with Google
- [ ] Navigate to Cart screen
- [ ] Check that wallet info appears at top
- [ ] Click "Refresh" to see USDC balance
- [ ] Add items to cart
- [ ] Click "Fill Mock Data" for delivery info
- [ ] Click "Pay with USDC"
- [ ] Confirm payment
- [ ] View transaction on Solana Explorer

---

## Troubleshooting

### "Merchant wallet address not configured"
- Check that `.env` file exists in root directory
- Check that `EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS` is set correctly
- Restart the app: stop and run `npm run android` again

### "Insufficient USDC balance"
- You don't have USDC in your wallet yet
- Go back to Step 3 to get test USDC
- Make sure you're on DevNet (not mainnet!)

### "No wallet connected"
- Sign in with Google first
- Embedded wallet should be created automatically
- Try signing out and back in

### Build errors
```bash
# Clear cache and rebuild
npm run android:build
```

---

## What's Next?

### Test the Full Flow

1. **Create embedded wallet**: Sign in → wallet auto-created ✅
2. **Fund your user wallet**:
   - Get wallet address from Cart screen
   - Send DevNet SOL and USDC to this address
3. **Make a payment**: Add to cart → Checkout → Pay with USDC
4. **Verify on chain**: View transaction on Solana Explorer

### Add External Wallet Support (Optional)

To test with Phantom mobile wallet:

1. Install Phantom on your Android device
2. In the app, click "Connect External Wallet" on Cart screen
3. Follow Phantom deep linking flow
4. Make payment from your Phantom wallet

### Production Checklist

Before going to mainnet:

- [ ] Replace DevNet with Mainnet RPC URL
- [ ] Change USDC mint to mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- [ ] Use production merchant wallet
- [ ] Implement proper error handling
- [ ] Add transaction logging and monitoring
- [ ] Test with small amounts first!

---

## Support

Need help? Check these resources:

- **README.md**: Full documentation
- **Privy Docs**: https://docs.privy.io/
- **Solana Discord**: https://discord.gg/solana (#devnet-support)
- **GitHub Issues**: Open an issue if you find bugs

---

## Quick Reference

### Important Addresses

**DevNet USDC Mint:**
```
Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
```

**Mainnet USDC Mint (for production):**
```
EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### RPC Endpoints

**DevNet (Free):**
```
https://api.devnet.solana.com
```

**Mainnet (Production - Use paid RPC!):**
- Helius: https://helius.dev/
- QuickNode: https://quicknode.com/
- Alchemy: https://alchemy.com/

### Explorer Links

**DevNet:**
```
https://explorer.solana.com/?cluster=devnet
```

**Mainnet:**
```
https://explorer.solana.com/
```

---

Good luck! 🚀
