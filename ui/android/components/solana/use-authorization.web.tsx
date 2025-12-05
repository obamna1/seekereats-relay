import { useMemo } from 'react'

export function useAuthorization() {
  return useMemo(
    () => ({
      accounts: null,
      authorizeSession: async () => { throw new Error('Not implemented on Web') },
      authorizeSessionWithSignIn: async () => { throw new Error('Not implemented on Web') },
      deauthorizeSession: async () => {},
      deauthorizeSessions: async () => {},
      isLoading: false,
      selectedAccount: null,
    }),
    [],
  )
}
