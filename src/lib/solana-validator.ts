/**
 * Solana Payment Validator
 * Validates Solana transactions on-chain before processing Square orders
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Get Solana RPC URL from environment
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SOLANA_PAYMENT_WALLET = process.env.SOLANA_PAYMENT_WALLET;

// Connection to Solana
let connection: Connection | null = null;

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }
  return connection;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  signature?: string;
  slot?: number;
  confirmationStatus?: string;
}

export interface ValidatePaymentParams {
  signature: string;
  expectedAmountCents: number;
  isTestMode?: boolean;
}

/**
 * Validates a Solana payment transaction
 *
 * Checks:
 * 1. Transaction exists on-chain
 * 2. Transaction is confirmed
 * 3. (Future) Verify amount and recipient
 *
 * In test mode, relaxed validation is used
 */
export async function validateSolanaPayment(
  params: ValidatePaymentParams
): Promise<ValidationResult> {
  const { signature, expectedAmountCents, isTestMode } = params;

  console.log('[SolanaValidator] Validating signature:', signature);
  console.log('[SolanaValidator] Expected amount (cents):', expectedAmountCents);
  console.log('[SolanaValidator] Test mode:', isTestMode);

  // In test mode, accept any signature for development
  if (isTestMode) {
    console.log('[SolanaValidator] Test mode - skipping strict validation');

    // Still check if it looks like a valid signature format
    if (!signature || signature.length < 40) {
      return {
        valid: false,
        error: 'Invalid signature format',
      };
    }

    return {
      valid: true,
      signature,
      confirmationStatus: 'test-mode',
    };
  }

  try {
    const conn = getConnection();

    // Fetch the transaction from the blockchain
    const txResponse = await conn.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!txResponse) {
      return {
        valid: false,
        error: 'Transaction not found on Solana blockchain',
      };
    }

    // Check if transaction was successful (no error)
    if (txResponse.meta?.err) {
      return {
        valid: false,
        error: `Transaction failed: ${JSON.stringify(txResponse.meta.err)}`,
      };
    }

    console.log('[SolanaValidator] Transaction found, slot:', txResponse.slot);

    // Check confirmation status
    const signatureStatus = await conn.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });

    const confirmationStatus = signatureStatus.value?.confirmationStatus;
    console.log('[SolanaValidator] Confirmation status:', confirmationStatus);

    if (confirmationStatus !== 'confirmed' && confirmationStatus !== 'finalized') {
      return {
        valid: false,
        error: `Transaction not confirmed: status is ${confirmationStatus}`,
      };
    }

    // TODO: Enhanced validation (future)
    // - Verify the recipient is our payment wallet
    // - Verify the amount matches expected (for SPL tokens like USDC)
    // - Verify the sender
    //
    // This requires parsing the transaction instructions and checking:
    // - If it's a native SOL transfer or SPL token transfer
    // - The destination account
    // - The amount transferred

    if (SOLANA_PAYMENT_WALLET) {
      // Basic check - transaction should involve our wallet
      const accountKeys = txResponse.transaction.message.getAccountKeys();
      const walletPubkey = new PublicKey(SOLANA_PAYMENT_WALLET);

      let foundWallet = false;
      for (let i = 0; i < accountKeys.length; i++) {
        if (accountKeys.get(i)?.equals(walletPubkey)) {
          foundWallet = true;
          break;
        }
      }

      if (!foundWallet) {
        console.warn('[SolanaValidator] Payment wallet not found in transaction accounts');
        // In production, this should be an error
        // For now, we just log a warning
      }
    }

    return {
      valid: true,
      signature,
      slot: txResponse.slot,
      confirmationStatus: confirmationStatus || 'confirmed',
    };
  } catch (error: any) {
    console.error('[SolanaValidator] Validation error:', error.message);
    return {
      valid: false,
      error: error.message || 'Failed to validate Solana payment',
    };
  }
}

/**
 * Get Solana validator configuration status
 */
export function getValidatorConfig(): {
  rpcUrl: string;
  paymentWallet: string | undefined;
  configured: boolean;
} {
  return {
    rpcUrl: SOLANA_RPC_URL,
    paymentWallet: SOLANA_PAYMENT_WALLET,
    configured: !!SOLANA_PAYMENT_WALLET,
  };
}
