import { AppConfig } from '@/constants/app-config';
import { confirmTransaction, createUSDCTransferTransaction, validateUSDCBalance } from '@/services/solana-payment.service';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { useCallback, useMemo } from 'react';
import { useSolana } from './solana-provider';

export interface SolanaWallet {
  address: string;
  type: 'embedded';
}

export interface PaymentResult {
  signature: string;
  success: boolean;
  explorerUrl: string;
}

/**
 * Hook to interact with Privy Solana embedded wallet
 */
export function usePrivySolanaWallet() {
  const { wallets: embeddedWallets } = useEmbeddedSolanaWallet();
  const { connection } = useSolana();

  // Get the active embedded wallet
  const activeWallet = useMemo(() => {
    if (embeddedWallets && embeddedWallets.length > 0) {
      return {
        address: embeddedWallets[0].address,
        type: 'embedded' as const,
        wallet: embeddedWallets[0],
      };
    }

    return null;
  }, [embeddedWallets]);

  /**
   * Send USDC payment to merchant
   */
  const sendUSDCPayment = useCallback(
    async (amountInUSD: number): Promise<PaymentResult> => {
      if (!activeWallet) {
        throw new Error('No Solana wallet connected. Please connect a wallet first.');
      }

      if (!AppConfig.merchantWalletAddress) {
        console.error('[Privy Solana Wallet] Merchant wallet address is missing. AppConfig:', AppConfig);
        throw new Error('Merchant wallet address not configured. Please restart the app/server to load .env variables.');
      }

      console.log('[Privy Solana Wallet] Initiating USDC payment:', {
        amount: amountInUSD,
        from: activeWallet.address,
        to: AppConfig.merchantWalletAddress,
      });

      try {
        // 1. Validate balance
        const balanceCheck = await validateUSDCBalance(
          activeWallet.address,
          amountInUSD,
          connection
        );

        if (!balanceCheck.valid) {
          throw new Error(
            `Insufficient USDC balance. You have $${balanceCheck.balance.toFixed(2)} but need $${balanceCheck.required.toFixed(2)}`
          );
        }

        // 2. Create transaction
        const transaction = await createUSDCTransferTransaction(
          activeWallet.address,
          AppConfig.merchantWalletAddress,
          amountInUSD,
          connection
        );

        // 3. Sign and send transaction using Privy embedded wallet
        const provider = await activeWallet.wallet.getProvider();

        // Send transaction using the provider's request method
        // This handles both signing and sending
        const { signature } = await provider.request({
          method: 'signAndSendTransaction',
          params: {
            transaction: transaction,
            connection: connection 
          }
        });

        console.log('[Privy Solana Wallet] Transaction sent:', signature);

        // 4. Confirm transaction
        const confirmed = await confirmTransaction(signature, connection);

        if (!confirmed) {
          throw new Error('Transaction was sent but could not be confirmed. Please check the explorer.');
        }

        // 5. Generate explorer URL
        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

        console.log('[Privy Solana Wallet] Payment successful:', {
          signature,
          explorerUrl,
        });

        return {
          signature,
          success: true,
          explorerUrl,
        };
      } catch (error) {
        console.error('[Privy Solana Wallet] Payment failed:', error);
        throw error;
      }
    },
    [activeWallet, connection]
  );

  /**
   * Check USDC balance for active wallet
   */
  const checkBalance = useCallback(async () => {
    if (!activeWallet) {
      return { valid: false, balance: 0, required: 0 };
    }

    return validateUSDCBalance(activeWallet.address, 0, connection);
  }, [activeWallet, connection]);

  /**
   * Create an embedded Solana wallet if user doesn't have one
   */
  const createEmbeddedWallet = useCallback(async () => {
    if (embeddedWallets && embeddedWallets.length > 0) {
      console.log('[Privy Solana Wallet] Embedded wallet already exists');
      return embeddedWallets[0];
    }

    // Privy automatically creates embedded wallets based on config
    // If createOnLogin is set to 'users-without-wallets', wallet will be created on login
    console.log('[Privy Solana Wallet] No embedded wallet found. It should be created automatically on login.');
    return null;
  }, [embeddedWallets]);

  return {
    activeWallet,
    hasWallet: !!activeWallet,
    walletAddress: activeWallet?.address,
    walletType: activeWallet?.type,
    sendUSDCPayment,
    checkBalance,
    createEmbeddedWallet,
  };
}
