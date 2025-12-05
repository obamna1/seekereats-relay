import { AppConfig } from '@/constants/app-config';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
} from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface PaymentDetails {
  amount: number; // Amount in USD (will be converted to USDC)
  description: string;
}

export interface PaymentResult {
  signature: string;
  success: boolean;
  error?: string;
}

/**
 * Creates a USDC transfer transaction on Solana
 * @param fromAddress - User's wallet address
 * @param toAddress - Merchant's wallet address
 * @param amount - Amount in USD (e.g., 10.50 for $10.50)
 * @param connection - Solana connection instance
 * @returns Transaction object ready to be signed and sent
 */
export async function createUSDCTransferTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  connection: Connection
): Promise<Transaction> {
  try {
    const USDC_DECIMALS = 6; // USDC has 6 decimals on Solana

    // Validate inputs
    if (!fromAddress || !toAddress) {
      throw new Error('Invalid wallet addresses');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Create public key objects
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);
    const mintPubkey = new PublicKey(AppConfig.usdcMintAddress);

    console.log('[Payment Service] Creating USDC transfer:', {
      from: fromAddress,
      to: toAddress,
      amount,
      mint: AppConfig.usdcMintAddress,
    });

    // Get associated token accounts for both sender and receiver
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      fromPubkey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      toPubkey
    );

    console.log('[Payment Service] Token accounts:', {
      from: fromTokenAccount.toBase58(),
      to: toTokenAccount.toBase58(),
    });

    // Check if recipient's token account exists
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
    
    // Create transaction
    const transaction = new Transaction();

    // If recipient account doesn't exist, create it
    if (!toAccountInfo) {
      console.log('[Payment Service] Recipient token account does not exist. Adding creation instruction.');
      const { createAssociatedTokenAccountInstruction } = await import('@solana/spl-token');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // payer
          toTokenAccount, // associatedToken
          toPubkey, // owner
          mintPubkey // mint
        )
      );
    }

    // Convert amount to token units (considering USDC's 6 decimals)
    // For example: $10.50 -> 10500000 (10.50 * 10^6)
    const tokenAmount = Math.round(amount * Math.pow(10, USDC_DECIMALS));

    console.log('[Payment Service] Token amount:', tokenAmount);

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      tokenAmount
    );

    // Add transfer instruction
    transaction.add(transferInstruction);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('[Payment Service] Transaction created successfully');

    return transaction;
  } catch (error) {
    console.error('[Payment Service] Error creating transaction:', error);
    throw error;
  }
}

/**
 * Validates that a wallet has sufficient USDC balance
 * @param walletAddress - Wallet address to check
 * @param amount - Required amount in USD
 * @param connection - Solana connection instance
 * @returns true if sufficient balance, false otherwise
 */
export async function validateUSDCBalance(
  walletAddress: string,
  amount: number,
  connection: Connection
): Promise<{ valid: boolean; balance: number; required: number }> {
  try {
    const USDC_DECIMALS = 6;
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(AppConfig.usdcMintAddress);

    // Get user's USDC token account
    const tokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );

    console.log('[Payment Service] Checking balance for:', {
      wallet: walletAddress,
      mint: AppConfig.usdcMintAddress,
      tokenAccount: tokenAccount.toBase58()
    });

    // Get account info
    try {
      const accountInfo = await connection.getTokenAccountBalance(tokenAccount);

      if (!accountInfo.value) {
        return { valid: false, balance: 0, required: amount };
      }

      // Convert balance to USD
      const balance = Number(accountInfo.value.amount) / Math.pow(10, USDC_DECIMALS);
      const valid = balance >= amount;

      console.log('[Payment Service] Balance check:', {
        balance,
        required: amount,
        valid,
      });

      return { valid, balance, required: amount };
    } catch (e: any) {
      // Handle "could not find account" error specifically
      if (e.message && (e.message.includes('could not find account') || e.message.includes('Invalid param'))) {
        console.log('[Payment Service] No USDC account found for this wallet. Balance is 0.');
        return { valid: false, balance: 0, required: amount };
      }
      throw e;
    }
  } catch (error) {
    console.error('[Payment Service] Error checking balance:', error);
    // If account doesn't exist or other error, return insufficient balance
    return { valid: false, balance: 0, required: amount };
  }
}

/**
 * Confirms a transaction on the Solana blockchain
 * @param signature - Transaction signature
 * @param connection - Solana connection instance
 * @returns true if confirmed, false otherwise
 */
export async function confirmTransaction(
  signature: string,
  connection: Connection
): Promise<boolean> {
  try {
    console.log('[Payment Service] Confirming transaction:', signature);

    const latestBlockhash = await connection.getLatestBlockhash();

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      console.error('[Payment Service] Transaction failed:', confirmation.value.err);
      return false;
    }

    console.log('[Payment Service] Transaction confirmed successfully');
    return true;
  } catch (error) {
    console.error('[Payment Service] Error confirming transaction:', error);
    return false;
  }
}
