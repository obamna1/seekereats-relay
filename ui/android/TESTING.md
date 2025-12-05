# Testing Guide - USDC Payments on DevNet

## Test Prices (Updated for Easy Testing)

All menu items have been updated to **super cheap prices** so you can test with minimal DevNet USDC:

### Burger King (Demo)
- **Whopper Meal**: $0.10
- **Chicken Fries**: $0.05
- **Onion Rings**: $0.03
- **Fountain Drink**: $0.02
- **Delivery Fee**: $0.05

### Sushi Place (Demo)
- **Spicy Tuna Roll**: $0.08
- **California Roll**: $0.06
- **Edamame**: $0.04
- **Miso Soup**: $0.02
- **Delivery Fee**: $0.03

**Example Order Total:**
- 1 Whopper Meal ($0.10)
- 1 Chicken Fries ($0.05)
- Delivery Fee ($0.05)
- **Total: $0.20 USDC**

With just **$1 of DevNet USDC**, you can make **5+ test orders**!

---

## How to Fund Your Wallet

### Step 1: Get Your Wallet Address

1. **Sign in to the app** with Google OAuth
2. **Navigate to the Cart screen** (click the cart icon)
3. **Look at the wallet section** at the top
4. You'll see your wallet address starting with something like: `5Kq9Nq...`

**Important:** This is your **Privy embedded wallet address**. It's automatically created when you sign in and is managed securely by Privy.

### Step 2: Send DevNet SOL (for transaction fees)

You need SOL to pay for transaction fees on Solana (gas fees).

**Option 1: Solana DevNet Faucet (Easiest)**
```
1. Go to: https://faucet.solana.com/
2. Paste your wallet address from the app
3. Select "Devnet"
4. Click "Confirm Airdrop"
5. Wait ~30 seconds
```

You should receive **1-2 SOL** (DevNet SOL is free and worthless)

**Option 2: Solana CLI**
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url https://api.devnet.solana.com
```

### Step 3: Send DevNet USDC (for payments)

DevNet USDC is the test token you'll use to pay for orders.

**USDC Mint Address on DevNet:**
```
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```
(This is already configured in your `.env` file)

**Option 1: Use a DevNet USDC Faucet**

Unfortunately, DevNet USDC faucets are rare. Try these:

1. **SPL Token Faucet**: https://spl-token-faucet.com/
   - Select "Devnet"
   - Paste your wallet address
   - Select USDC token
   - Request tokens

2. **QuickNode Faucet**: https://faucet.quicknode.com/solana/devnet
   - May have USDC option

**Option 2: Ask in Solana Discord (Most Reliable)**

1. Join Solana Discord: https://discord.gg/solana
2. Go to `#devnet-support` channel
3. Post:
   ```
   Hey! Can someone send me some DevNet USDC for testing?
   My wallet: [YOUR_WALLET_ADDRESS]
   USDC Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

   I need about $1-2 USDC to test a payment app. Thanks!
   ```

**Option 3: Create Your Own Test Token (Advanced)**

If you can't get DevNet USDC, you can create your own test token:

```bash
# Create a new token
spl-token create-token --decimals 6

# Create token account
spl-token create-account <YOUR_TOKEN_MINT>

# Mint tokens to yourself
spl-token mint <YOUR_TOKEN_MINT> 100 YOUR_WALLET_ADDRESS

# Update .env with your token mint address
EXPO_PUBLIC_USDC_MINT_ADDRESS=<YOUR_TOKEN_MINT>
```

### Step 4: Verify Balance in App

1. **Open the app**
2. **Go to Cart screen**
3. **Click "Refresh"** next to the USDC balance
4. You should see your balance (e.g., "$1.00")

---

## Testing the Payment Flow

### Quick Test (Cost: ~$0.20 USDC)

1. **Browse restaurants** on the home screen
2. **Select "Burger King (Demo)"**
3. **Add to cart:**
   - 1x Whopper Meal ($0.10)
   - 1x Chicken Fries ($0.05)
4. **Click "View Cart"**
5. **Fill delivery details** (or click "Fill Mock Data")
6. **Verify your wallet** shows sufficient balance
7. **Click "Pay with USDC"**
8. **Confirm the payment** ($0.20 total)
9. **Wait for confirmation** (~5-10 seconds)
10. **View transaction** on Solana Explorer
11. **Track your order!**

### Full Test (Cost: ~$0.50 USDC)

Order multiple items from both restaurants to test the full flow:

1. **Order from Burger King:**
   - 2x Whopper Meal ($0.20)
   - 2x Chicken Fries ($0.10)
   - 1x Onion Rings ($0.03)
   - Delivery: $0.05
   - **Subtotal: $0.38**

2. **Make a second order from Sushi Place:**
   - 1x Spicy Tuna Roll ($0.08)
   - 1x Edamame ($0.04)
   - Delivery: $0.03
   - **Subtotal: $0.15**

**Total for both orders: $0.53 USDC**

---

## Wallet Funding FAQ

### Q: Which wallet address should I send tokens to?

**A: Send to your Privy embedded wallet address shown in the Cart screen.**

This is your personal wallet that's automatically created when you sign in. It's different from the merchant wallet address (which receives payments).

### Q: How much SOL do I need?

**A: At least 0.01 SOL for transaction fees.**

Each USDC payment costs about 0.00001-0.00005 SOL (very cheap). 1 SOL from the faucet is more than enough for hundreds of test transactions.

### Q: How much USDC do I need?

**A: $1-2 USDC is plenty for testing.**

With the new test prices, you can make 5-10 orders with just $1 USDC.

### Q: What's the difference between my wallet and the merchant wallet?

- **Your Wallet** (Privy embedded): Where you send SOL and USDC to pay for orders
- **Merchant Wallet** (in `.env`): Where the payments go when you checkout

The merchant wallet is: `CaQAKBcwf7G5vXeu2RNuNGJafnJ8724Uj4wv9ivfxfQA`

### Q: Can I use my Phantom wallet instead?

**A: Yes!** You can connect an external Phantom wallet:

1. In the Cart screen, click "Connect External Wallet"
2. Follow the deep linking flow to Phantom
3. Approve the connection
4. Fund your Phantom wallet instead

But for testing, the embedded wallet is easier since it's automatically created.

### Q: I funded my wallet but the balance shows $0.00

Try these:

1. **Click "Refresh"** next to the balance
2. **Wait a few seconds** and refresh again (blockchain can be slow)
3. **Check the correct USDC mint** - make sure you sent to the right token address:
   ```
   4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
   ```
4. **Verify on Explorer**:
   - Go to https://explorer.solana.com/?cluster=devnet
   - Paste your wallet address
   - Check "Tokens" tab
   - Look for USDC token

### Q: The payment failed with "Insufficient USDC balance"

Even though you have USDC, this could mean:

1. **Token account doesn't exist** - The USDC token account for your wallet wasn't created
2. **Wrong USDC mint** - You sent a different USDC token (wrong mint address)
3. **Blockchain delay** - Transaction hasn't confirmed yet

**Solution:**
- Wait 30 seconds and try again
- Check Solana Explorer to verify the token account exists
- Make sure you're using the correct USDC mint address

---

## Merchant Wallet Balance

After successful payments, you can verify the merchant received the funds:

**Merchant Wallet:**
```
CaQAKBcwf7G5vXeu2RNuNGJafnJ8724Uj4wv9ivfxfQA
```

**Check on Explorer:**
1. Go to: https://explorer.solana.com/address/CaQAKBcwf7G5vXeu2RNuNGJafnJ8724Uj4wv9ivfxfQA?cluster=devnet
2. Click "Tokens" tab
3. Look for your USDC transfers

---

## Example Test Session

Here's what a complete test session looks like:

```
1. Sign in with Google ✅
2. Embedded wallet created automatically ✅
3. Copy wallet address: 5Kq9Nq... ✅
4. Send 2 SOL from faucet ✅
5. Send 2 USDC from Discord friend ✅
6. Refresh balance in app: $2.00 USDC ✅
7. Add items to cart: Total $0.20 ✅
8. Checkout with USDC ✅
9. Transaction confirmed in 5 seconds ✅
10. View on Explorer: Success! ✅
11. Merchant received $0.20 USDC ✅
12. Track order status ✅
```

**Balance after test:**
- Started with: $2.00 USDC
- Paid: $0.20 USDC
- Remaining: $1.80 USDC
- **9 more tests possible!**

---

## Troubleshooting

### "No Solana wallet connected"
- Make sure you're signed in
- Embedded wallet should auto-create
- Try signing out and back in

### "Merchant wallet address not configured"
- Check `.env` file has `EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS` set
- Restart the app after changing `.env`

### "Transaction failed"
- Check you have enough SOL for fees (at least 0.01 SOL)
- Check you have enough USDC for the order
- Try refreshing your balance
- Check Solana DevNet status: https://status.solana.com/

### Balance not updating
- Click "Refresh" button
- Wait 10-30 seconds for blockchain confirmation
- Check Solana Explorer to verify tokens arrived

---

## Resources

- **Solana DevNet Explorer**: https://explorer.solana.com/?cluster=devnet
- **Solana Faucet**: https://faucet.solana.com/
- **Solana Discord**: https://discord.gg/solana
- **QuickNode Faucet**: https://faucet.quicknode.com/solana/devnet

---

Good luck testing! 🚀
