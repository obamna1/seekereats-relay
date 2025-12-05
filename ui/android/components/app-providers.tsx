import { AppTheme } from '@/components/app-theme'
import { AuthProvider } from '@/components/auth/auth-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { CartProvider } from '@/store/cart-store'
import { ErrorBoundary } from '@/components/error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { ClusterProvider } from './cluster/cluster-provider'

const queryClient = new QueryClient()

import { PrivyProvider } from '@privy-io/expo'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <PrivyProvider
      appId="cmip6do89001zjf0c1docpj43"
      clientId="client-WY6TP7jGc5ogZC3AgUogvX1N64SR57EHeZFRJXnqNJ48m"
      config={{
        embedded: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <AppTheme>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ClusterProvider>
              <SolanaProvider>
                <CartProvider>{children}</CartProvider>
              </SolanaProvider>
            </ClusterProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AppTheme>
    </PrivyProvider>
    </ErrorBoundary>
  )
}
