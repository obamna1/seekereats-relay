import { useLoginWithOAuth, usePrivy } from '@privy-io/expo'
import type { User } from '@privy-io/expo'
import { createContext, type PropsWithChildren, use, useMemo, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithWallet: () => Promise<void>
  signOut: () => Promise<void>
  user: User | null
  error: Error | null
  clearError: () => void
}

const Context = createContext<AuthState>({} as AuthState)

export function useAuth() {
  const value = use(Context)
  if (!value) {
    throw new Error('useAuth must be wrapped in a <AuthProvider />')
  }

  return value
}

export function AuthProvider({ children }: PropsWithChildren) {
  const { user, isReady, logout } = usePrivy()
  const { login: loginWithOAuth } = useLoginWithOAuth()
  const [error, setError] = useState<Error | null>(null)

  const clearError = () => setError(null)

  const value: AuthState = useMemo(
    () => ({
      signInWithGoogle: async () => {
        try {
          setError(null)
          await loginWithOAuth({ provider: 'google' })
        } catch (e) {
          const error = e instanceof Error ? e : new Error('Login failed')
          setError(error)
          console.error('Login failed', error)
          throw error
        }
      },
      signInWithWallet: async () => {
        try {
          setError(null)
          console.log("Wallet login: Please use Google Sign In for now as we configure deep linking.")
          // TODO: Implement usePhantomDeeplinkWalletConnector or similar from @privy-io/expo/connectors
        } catch (e) {
          const error = e instanceof Error ? e : new Error('Wallet login failed')
          setError(error)
          console.error('Wallet login failed', error)
          throw error
        }
      },
      signOut: async () => {
        try {
          setError(null)
          await logout()
        } catch (e) {
          const error = e instanceof Error ? e : new Error('Logout failed')
          setError(error)
          console.error('Logout failed', error)
          throw error
        }
      },
      isAuthenticated: !!user,
      isLoading: !isReady,
      user: user ?? null,
      error,
      clearError,
    }),
    [user, isReady, loginWithOAuth, logout, error],
  )

  // Wait for Privy to initialize before rendering children
  if (!isReady) {
    console.log('[AuthProvider] Waiting for Privy to initialize...')
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#ff3008" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Initializing...
        </Text>
      </View>
    )
  }

  console.log('[AuthProvider] Privy is ready, rendering children')
  return <Context value={value}>{children}</Context>
}

