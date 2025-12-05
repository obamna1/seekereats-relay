import { Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js'
import { useCallback, useMemo } from 'react'
import { Account } from './use-authorization'

export function useMobileWallet() {
  const connect = useCallback(async (): Promise<Account> => {
    console.warn('Wallet connection not implemented for Web')
    throw new Error('Wallet connection not supported on Web yet')
  }, [])

  const signIn = useCallback(async (signInPayload: any): Promise<Account> => {
    console.warn('Wallet sign-in not implemented for Web')
    throw new Error('Wallet sign-in not supported on Web yet')
  }, [])

  const disconnect = useCallback(async (): Promise<void> => {
    console.log('Disconnect called on Web')
  }, [])

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction, minContextSlot: number): Promise<TransactionSignature> => {
      console.warn('Transaction signing not implemented for Web')
      throw new Error('Transaction signing not supported on Web yet')
    },
    [],
  )

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      console.warn('Message signing not implemented for Web')
      throw new Error('Message signing not supported on Web yet')
    },
    [],
  )

  return useMemo(
    () => ({
      connect,
      signIn,
      disconnect,
      signAndSendTransaction,
      signMessage,
    }),
    [connect, disconnect, signAndSendTransaction, signIn, signMessage],
  )
}
