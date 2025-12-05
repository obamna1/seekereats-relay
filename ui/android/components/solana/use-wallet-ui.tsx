import { useAuth } from '@/components/auth/auth-provider'
import { PublicKey } from '@solana/web3.js'

export function useWalletUi() {
  const { signInWithWallet, signOut, user } = useAuth()

  // Map Privy user wallet to the expected account shape
  const account = user?.wallet ? {
    publicKey: new PublicKey(user.wallet.address),
    address: user.wallet.address,
    label: user.wallet.meta?.name || 'Wallet',
  } : null

  return {
    account,
    connect: signInWithWallet,
    disconnect: signOut,
    signAndSendTransaction: async () => { console.warn('signAndSendTransaction not implemented yet with Privy') },
    signIn: signInWithWallet,
    signMessage: async () => { console.warn('signMessage not implemented yet with Privy') },
  }
}
