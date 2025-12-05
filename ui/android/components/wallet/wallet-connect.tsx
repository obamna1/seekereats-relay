import { useAuth } from '@/components/auth/auth-provider';
import { usePrivySolanaWallet } from '@/components/solana/use-privy-solana-wallet';
import { Colors } from '@/constants/colors';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function WalletConnect() {
  const { user } = useAuth();
  const { activeWallet, hasWallet, walletAddress, walletType, checkBalance } =
    usePrivySolanaWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Load balance when wallet is connected
  useEffect(() => {
    if (hasWallet) {
      loadBalance();
    }
  }, [hasWallet, walletAddress]);

  const loadBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const result = await checkBalance();
      setBalance(result.balance);
    } catch (error) {
      console.error('[WalletConnect] Error loading balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // External wallet connection will be added in future update
  // For now, we only support embedded wallets

  const copyAddress = () => {
    if (walletAddress) {
      // Note: expo-clipboard would be better, but using Alert for now
      Alert.alert(
        'Wallet Address',
        walletAddress,
        [{ text: 'OK' }]
      );
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please sign in to connect a wallet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solana Wallet</Text>

      {hasWallet ? (
        <View style={styles.walletInfo}>
          <View style={styles.walletHeader}>
            <View style={styles.walletTypeContainer}>
              <Text style={styles.walletTypeLabel}>🔐 Embedded Wallet (Privy)</Text>
            </View>
          </View>

          <TouchableOpacity onPress={copyAddress} style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Address:</Text>
            <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
              {walletAddress}
            </Text>
          </TouchableOpacity>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>USDC Balance:</Text>
            {isLoadingBalance ? (
              <ActivityIndicator size="small" color="#ff3008" />
            ) : (
              <Text style={styles.balance}>
                ${balance !== null ? balance.toFixed(2) : '0.00'}
              </Text>
            )}
            <TouchableOpacity onPress={loadBalance} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionContainer}>
            <Text style={styles.infoText}>
              Your embedded wallet is managed securely by Privy
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noWallet}>
          <Text style={styles.noWalletText}>
            No Solana wallet connected
          </Text>
          <Text style={styles.infoText}>
            An embedded wallet should be created automatically when you sign in.
            If not, try signing out and back in.
          </Text>
        </View>
      )}

      {balance !== null && balance === 0 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ You don't have any USDC in your wallet. For testing on DevNet, you can use a faucet to get USDC tokens.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  message: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  walletInfo: {
    gap: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletTypeContainer: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  walletTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  unlinkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unlinkButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: Colors.light.inputBackground,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  addressLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.light.text,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  balance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00d084',
    flex: 1,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 8,
    gap: 8,
  },
  noWallet: {
    gap: 12,
    paddingVertical: 8,
  },
  noWalletText: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkButton: {
    backgroundColor: '#9945ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.accent,
  },
  warningText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
