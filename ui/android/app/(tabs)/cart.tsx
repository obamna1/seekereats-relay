import { Colors } from '@/constants/colors';
import { useAuthorization } from '@/components/solana/use-authorization';
import { useMobileWallet } from '@/components/solana/use-mobile-wallet';
import { api } from '@/services/api';
import { useCart } from '@/store/cart-store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { items, removeFromCart, total, clearCart, deliveryDetails, updateDeliveryDetails } = useCart();
  const router = useRouter();
  const { accounts } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();

  const handleCheckout = async () => {
    if (!accounts || accounts.length === 0) {
      Alert.alert('Connect Wallet', 'Please connect your Solana wallet to checkout.');
      return;
    }

    try {
      // 1. Get Delivery Quote
      // Use delivery details from context
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
        return;
      }

      Alert.alert(
        'Confirm Order',
        `Total: $${total.toFixed(2)}\nDelivery Fee: $${(quote.fee / 100).toFixed(2)}\nETA: ${new Date(quote.dropoff_time_estimated).toLocaleTimeString()}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pay & Order', 
            onPress: async () => {
              try {
                // 2. Accept Quote (Place Order)
                await api.acceptDeliveryQuote(quote.external_delivery_id);
                
                // 3. Process Payment (Mock for now)
                // await signAndSendTransaction(...);

                Alert.alert('Success', 'Order placed successfully!');
                clearCart();
                // router.dismissAll();
                // Navigate to status page
                router.push(`/order-status?id=${quote.external_delivery_id}`);
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to place order');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process checkout');
    }
  };

  const fillMockData = () => {
    updateDeliveryDetails({
      pickup_address: '123 Restaurant St, San Francisco, CA',
      pickup_business_name: 'Burger King',
      pickup_phone_number: '+16505555555',
      dropoff_address: '456 User Ave, San Francisco, CA',
      dropoff_business_name: 'User Home',
      dropoff_phone_number: '+16505555555',
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

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top', 'bottom']}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
          <Text style={styles.browseButtonText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearCart();
            router.push('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Actions */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <Text style={styles.backButtonText}>← Browse Menu</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

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
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
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
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>Checkout with Solana</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 15,
    color: Colors.light.icon,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.icon,
    marginBottom: 16,
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
    borderBottomColor: Colors.light.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  removeText: {
    color: Colors.light.primary,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  checkoutButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    color: Colors.light.text,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.icon,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.text,
  },
  mockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 16,
  },
  mockButtonText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600',
  },
  testCallButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  testCallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
