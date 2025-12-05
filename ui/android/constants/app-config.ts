import { Cluster } from '@/components/cluster/cluster'
import { ClusterNetwork } from '@/components/cluster/cluster-network'
import { clusterApiUrl } from '@solana/web3.js'

export class AppConfig {
  static name = 'Seeker Eats'
  static uri = 'https://example.com'

  // Solana Configuration
  static rpcUrl = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')
  static network = process.env.EXPO_PUBLIC_SOLANA_NETWORK || 'devnet'
  static merchantWalletAddress = process.env.EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS || 'CaQAKBcwf7G5vXeu2RNuNGJafnJ8724Uj4wv9ivfxfQA'
  static usdcMintAddress = process.env.EXPO_PUBLIC_USDC_MINT_ADDRESS || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

  static clusters: Cluster[] = [
    {
      id: 'solana:devnet',
      name: 'Devnet',
      endpoint: process.env.EXPO_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'),
      network: ClusterNetwork.Devnet,
    },
    {
      id: 'solana:testnet',
      name: 'Testnet',
      endpoint: clusterApiUrl('testnet'),
      network: ClusterNetwork.Testnet,
    },
  ]
}
