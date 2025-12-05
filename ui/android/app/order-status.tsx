import { HomeButton } from '@/components/ui/home-button';
import { Colors } from '@/constants/colors';
import { api } from '@/services/api';
import { Image as ExpoImage } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderStatusScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<string>('loading');
  const [delivery, setDelivery] = useState<any>(null);

  useEffect(() => {
    if (id) {
      checkStatus();
      const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [id]);

  const checkStatus = async () => {
    try {
      const data = await api.getDeliveryStatus(id as string);
      if (data) {
        setDelivery(data);
        setStatus(data.delivery_status || 'unknown');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const steps = [
    { key: 'created', label: 'Order Confirmed' },
    { key: 'confirmed', label: 'Preparing Order' },
    { key: 'picked_up', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getCurrentStepIndex = () => {
    if (!status) return 0;
    if (status === 'delivered') return 3;
    if (['picked_up', 'en_route_to_dropoff', 'arrived_at_dropoff'].includes(status)) return 2;
    if (['confirmed', 'en_route_to_pickup', 'arrived_at_pickup'].includes(status)) return 1;
    return 0;
  };

  const currentStep = getCurrentStepIndex();



// ... imports

  const handleGoHome = () => {
    router.dismissAll();
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Order Status',
          headerShown: true,
          headerBackTitle: 'Back',
          headerTintColor: Colors.light.primary,
          headerStyle: { backgroundColor: Colors.light.background },
          headerTitleStyle: { fontWeight: '700', color: Colors.light.text },
          headerRight: () => <HomeButton />,
        }}
      />

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>📍 Map View (Coming Soon)</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ExpoImage 
            source={require('../assets/seekereats_logo.png')} 
            style={styles.logo} 
            contentFit="contain"
          />
          <Text style={styles.title}>
            {status === 'delivered' ? 'Arrived!' : 'On the way'}
          </Text>
          <Text style={styles.subtitle}>
            {delivery?.dropoff_time_estimated 
              ? `ETA: ${new Date(delivery.dropoff_time_estimated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Calculating ETA...'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          {steps.map((step, index) => (
            <View key={step.key} style={styles.statusItem}>
              <View style={[
                styles.statusDot, 
                index <= currentStep && styles.statusDotActive
              ]} />
              {index < steps.length - 1 && <View style={styles.statusLine} />}
              <Text style={[
                styles.statusText,
                index <= currentStep && styles.statusTextActive
              ]}>{step.label}</Text>
            </View>
          ))}
        </View>

        {delivery && (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>#{id?.slice(0, 8)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          </View>
        )}

        {status === 'loading' && <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loader} />}
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
          <Text style={styles.buttonText}>Browse More Restaurants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/orders')}>
          <Text style={styles.buttonSecondaryText}>View All Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.border,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  mapPlaceholder: {
    height: '40%',
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: Colors.light.icon,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  statusContainer: {
    marginBottom: 32,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.border,
    marginRight: 16,
  },
  statusDotActive: {
    backgroundColor: Colors.light.primary,
    transform: [{ scale: 1.2 }],
  },
  statusLine: {
    position: 'absolute',
    left: 5,
    top: 12,
    bottom: -24,
    width: 2,
    backgroundColor: Colors.light.border,
    zIndex: -1,
  },
  statusText: {
    fontSize: 16,
    color: Colors.light.icon,
    flex: 1,
  },
  statusTextActive: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 18,
  },
  details: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: Colors.light.icon,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginTop: 40,
  },
  bottomButtons: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonSecondaryText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
