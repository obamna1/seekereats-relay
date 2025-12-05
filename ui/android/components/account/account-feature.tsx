import { AccountUiBalance } from '@/components/account/account-ui-balance'
import { AccountUiTokenAccounts } from '@/components/account/account-ui-token-accounts'
import { useGetBalanceInvalidate } from '@/components/account/use-get-balance'
import { useGetTokenAccountsInvalidate } from '@/components/account/use-get-token-accounts'
import { AppPage } from '@/components/app-page'
import { AppText } from '@/components/app-text'
import { AppView } from '@/components/app-view'
import { useAuth } from '@/components/auth/auth-provider'
import { useWalletUi } from '@/components/solana/use-wallet-ui'
import { WalletUiButtonConnect } from '@/components/solana/wallet-ui-button-connect'
import { Colors } from '@/constants/colors'
import { ellipsify } from '@/utils/ellipsify'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Button, RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { AccountUiButtons } from './account-ui-buttons'

export function AccountFeature() {
  const { account } = useWalletUi()
  const { signOut, user } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const invalidateBalance = useGetBalanceInvalidate({ address: account?.publicKey as PublicKey })
  const invalidateTokenAccounts = useGetTokenAccountsInvalidate({ address: account?.publicKey as PublicKey })
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([invalidateBalance(), invalidateTokenAccounts()])
    setRefreshing(false)
  }, [invalidateBalance, invalidateTokenAccounts])

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true)
              await signOut()
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.')
              console.error('Logout error:', error)
            } finally {
              setIsLoggingOut(false)
            }
          },
        },
      ]
    )
  }

  return (
    <AppPage>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />}
      >
        {/* User Info Section */}
        {user && (
          <AppView style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.light.border, marginBottom: 16 }}>
            <AppText type="subtitle">Signed in as</AppText>
            <AppText>{user.email?.address || user.google?.email || 'User'}</AppText>
          </AppView>
        )}

        {/* Wallet Content */}
        {account ? (
          <>
            <AppView style={{ alignItems: 'center', gap: 4 }}>
              <AccountUiBalance address={account.publicKey} />
              <AppText style={{ opacity: 0.7 }}>{ellipsify(account.publicKey.toString(), 8)}</AppText>
            </AppView>
            <AppView style={{ marginTop: 16, alignItems: 'center' }}>
              <AccountUiButtons />
            </AppView>
            <AppView style={{ marginTop: 16, alignItems: 'center' }}>
              <AccountUiTokenAccounts address={account.publicKey} />
            </AppView>
          </>
        ) : (
          <AppView style={{ flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 32 }}>
            <AppText>Connect your wallet to get started.</AppText>
            <WalletUiButtonConnect />
          </AppView>
        )}

        {/* Quick Actions */}
        <AppView style={{ marginTop: 32, gap: 12 }}>
          <AppText type="subtitle" style={{ marginBottom: 8 }}>Quick Actions</AppText>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/settings')}>
            <AppText style={styles.actionButtonText}>⚙️ Settings & Configuration</AppText>
            <AppText style={styles.actionButtonArrow}>›</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/demo')}>
            <AppText style={styles.actionButtonText}>🔧 Developer Tools</AppText>
            <AppText style={styles.actionButtonArrow}>›</AppText>
          </TouchableOpacity>
        </AppView>

        {/* Logout Button */}
        <AppView style={{ marginTop: 32, padding: 16 }}>
          <Button
            title={isLoggingOut ? 'Signing out...' : 'Sign Out'}
            onPress={handleLogout}
            disabled={isLoggingOut}
            color={Colors.light.primary}
          />
        </AppView>
      </ScrollView>
    </AppPage>
  )
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  actionButtonArrow: {
    fontSize: 24,
    color: Colors.light.icon,
    fontWeight: '300',
  },
})
