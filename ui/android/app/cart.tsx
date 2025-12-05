import { useAuthorization } from '@/components/solana/use-authorization';
import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
import { usePrivySolanaWallet } from '@/components/solana/use-privy-solana-wallet';
import { HomeButton } from '@/components/ui/home-button';
import { WalletConnect } from '@/components/wallet/wallet-connect';
import { Colors } from '@/constants/colors';
import { api } from '@/services/api';
import { useCart } from '@/store/cart-store';
import { Image as ExpoImage } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { items, addToCart, removeFromCart, total, clearCart, deliveryDetails, updateDeliveryDetails } = useCart();
  const router = useRouter();
  const { accounts } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();
  const { hasWallet, sendUSDCPayment, walletAddress } = usePrivySolanaWallet();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleCheckout = async () => {
    // Check if wallet is connected
    if (!hasWallet) {
      Alert.alert(
        'Connect Wallet',
        'Please connect your Solana wallet to checkout. An embedded wallet should be created automatically when you sign in.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate delivery details
    if (!deliveryDetails.pickup_address || !deliveryDetails.dropoff_address) {
      Alert.alert('Missing Information', 'Please fill in all delivery details.');
      return;
    }

    try {
      setIsProcessingPayment(true);

      // 1. Get Delivery Quote
      const quoteDetails = {
        pickup_address: deliveryDetails.pickup_address,
        pickup_business_name: deliveryDetails.pickup_business_name,
        pickup_phone_number: deliveryDetails.pickup_phone_number,
        dropoff_address: deliveryDetails.dropoff_address,
        dropoff_business_name: deliveryDetails.dropoff_business_name,
        dropoff_phone_number: deliveryDetails.dropoff_phone_number,
        order_value: Math.round(total * 100), // in cents
      };

      const quote = await api.getDeliveryQuote(quoteDetails);

      if (!quote) {
        Alert.alert('Error', 'Could not get delivery quote. Please try again.');
        setIsProcessingPayment(false);
        return;
      }

      const deliveryFee = quote.fee / 100;
      const totalAmount = total + deliveryFee;

      // 2. Show confirmation dialog
      Alert.alert(
        'Confirm Payment',
        `Order Total: $${total.toFixed(2)}\nDelivery Fee: $${deliveryFee.toFixed(2)}\n\nTotal to Pay: $${totalAmount.toFixed(2)} USDC\n\nETA: ${new Date(quote.dropoff_time_estimated).toLocaleTimeString()}\n\nYou will be charged ${totalAmount.toFixed(2)} USDC from your Solana wallet.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsProcessingPayment(false),
          },
          {
            text: 'Pay with USDC',
            onPress: async () => {
              try {
                // 3. Process USDC Payment
                console.log('[Cart] Processing USDC payment:', {
                  amount: totalAmount,
                  wallet: walletAddress,
                });

                const paymentResult = await sendUSDCPayment(totalAmount);

                console.log('[Cart] Payment successful:', paymentResult);

                // 4. Accept Quote (Place Order) after successful payment
                await api.acceptDeliveryQuote(quote.external_delivery_id);

                // 5. Show success message with transaction details
                Alert.alert(
                  'Payment Successful!',
                  `Your payment of $${totalAmount.toFixed(2)} USDC has been processed.\n\nTransaction: ${paymentResult.signature.substring(0, 8)}...${paymentResult.signature.substring(paymentResult.signature.length - 8)}\n\nYour order has been placed!`,
                  [
                    {
                      text: 'View on Explorer',
                      onPress: () => Linking.openURL(paymentResult.explorerUrl),
                    },
                    {
                      text: 'Track Order',
                      onPress: () => {
                        clearCart();
                        router.push(`/order-status?id=${quote.external_delivery_id}`);
                      },
                    },
                  ]
                );

                setIsProcessingPayment(false);
              } catch (error: any) {
                console.error('[Cart] Payment failed:', error);
                setIsProcessingPayment(false);
                Alert.alert(
                  'Payment Failed',
                  error.message || 'Failed to process payment. Please try again.'
                );
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('[Cart] Checkout error:', error);
      setIsProcessingPayment(false);
      Alert.alert('Error', error.message || 'Failed to process checkout');
    }
  };

  const fillMockData = () => {
    updateDeliveryDetails({
      pickup_address: '123 Restaurant St, San Francisco, CA',
      pickup_business_name: 'Burger King',
      pickup_phone_number: '+14134741348',
      dropoff_address: '456 User Ave, San Francisco, CA',
      dropoff_business_name: 'User Home',
      dropoff_phone_number: '+14134741348',
    });
  };

  const testPhoneCall = async () => {
    if (!deliveryDetails.pickup_phone_number) {
      Alert.alert('Error', 'Please enter a pickup phone number first (or use Mock Data)');
      return;
    }

    try {
      const orderDesc = items.map(i => `${i.quantity} ${i.name}`).join(', ');
      await api.initiateCall({
        delivery_id: 'test-call-' + Date.now(),
        phone_number: deliveryDetails.pickup_phone_number,
        order_details: orderDesc || 'Test Order',
        dropoff_address: deliveryDetails.dropoff_address,
      });
      Alert.alert('Success', 'Call initiated successfully! You should receive a call shortly.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initiate call');
    }
  };



// ... imports

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['bottom']}>
        <Stack.Screen 
          options={{
            title: 'Cart',
            headerShown: true,
            headerBackTitle: 'Back',
            headerTintColor: Colors.light.primary,
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: '700' },
            headerRight: () => <HomeButton />,
          }} 
        />
        <ExpoImage 
          source={require('../assets/seekereats_logo.png')} 
          style={styles.emptyLogo} 
          contentFit="contain"
        />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => router.back()}>
          <Text style={styles.browseButtonText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: 'Cart',
          headerShown: true,
          headerBackTitle: 'Back',
          headerTintColor: Colors.light.primary,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => <HomeButton />,
        }} 
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.section}>
          <WalletConnect />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.qtyButton} 
                  onPress={() => removeFromCart(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.qtyButtonText}>−</Text>
                </TouchableOpacity>
                
                <Text style={styles.qtyText}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.qtyButton} 
                  onPress={() => {
                    const { quantity, ...rest } = item;
                    addToCart(rest);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <TouchableOpacity onPress={fillMockData} style={styles.mockButton}>
              <Text style={styles.mockButtonText}>Fill Mock Data</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subHeader}>Pickup (Restaurant)</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            value={deliveryDetails.pickup_business_name}
            onChangeText={(text) => updateDeliveryDetails({ pickup_business_name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={deliveryDetails.pickup_address}
            onChangeText={(text) => updateDeliveryDetails({ pickup_address: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={deliveryDetails.pickup_phone_number}
            onChangeText={(text) => updateDeliveryDetails({ pickup_phone_number: text })}
            keyboardType="phone-pad"
          />

          <Text style={styles.subHeader}>Dropoff (You)</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name / Name"
            value={deliveryDetails.dropoff_business_name}
            onChangeText={(text) => updateDeliveryDetails({ dropoff_business_name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={deliveryDetails.dropoff_address}
            onChangeText={(text) => updateDeliveryDetails({ dropoff_address: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={deliveryDetails.dropoff_phone_number}
            onChangeText={(text) => updateDeliveryDetails({ dropoff_phone_number: text })}
            keyboardType="phone-pad"
          />
          
          <TouchableOpacity style={styles.testCallButton} onPress={testPhoneCall}>
            <Text style={styles.testCallButtonText}>Test Phone Call</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, isProcessingPayment && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <View style={styles.checkoutButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.checkoutButtonText}>Processing Payment...</Text>
              </View>
            ) : (
              <Text style={styles.checkoutButtonText}>Pay with USDC</Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  emptyLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    opacity: 0.5,
  },
  browseButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    lineHeight: 20,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 16,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  mockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 16,
  },
  mockButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  testCallButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
  },
  testCallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
