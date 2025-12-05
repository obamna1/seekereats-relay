import { api, Restaurant } from '@/services/api';
import { useCart } from '@/store/cart-store';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeButton } from '@/components/ui/home-button';
import { Colors } from '@/constants/colors';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, removeFromCart, items, total } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadRestaurant(id as string);
    }
  }, [id]);

  const loadRestaurant = async (restaurantId: string) => {
    try {
      const data = await api.getRestaurant(restaurantId);
      setRestaurant(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Restaurant not found</Text>
      </View>
    );
  }

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      restaurantId: restaurant.id,
    });

    // Visual feedback
    setAddedItems(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: restaurant.name,
          headerShown: true,
          headerBackTitle: 'Back',
          headerTintColor: Colors.light.primary,
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerRight: () => <HomeButton />,
        }}
      />
      <FlatList
        ListHeaderComponent={() => (
          <View>
            <Image source={{ uri: restaurant.image }} style={styles.headerImage} />
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{restaurant.name}</Text>
              <Text style={styles.subtitle}>
                {restaurant.categories.join(', ')} • {restaurant.rating} ★
              </Text>
              <Text style={styles.subtitle}>
                {restaurant.deliveryTime} • ${restaurant.deliveryFee} delivery
              </Text>
            </View>
            <Text style={styles.sectionTitle}>Menu</Text>
          </View>
        )}
        data={restaurant.menu}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isAdded = addedItems.has(item.id);
          const cartItem = items.find(i => i.id === item.id);
          const quantity = cartItem?.quantity || 0;

          return (
            <View style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDesc}>{item.description}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </View>
              {quantity === 0 ? (
                <TouchableOpacity
                  style={[styles.addButton, isAdded && styles.addButtonSuccess]}
                  onPress={() => handleAddToCart(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.addButtonText, isAdded && styles.addButtonTextSuccess]}>
                    {isAdded ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => {
                      if (quantity === 1) {
                        // If quantity is 1, removing it should remove the item
                        // We can use removeFromCart which handles this logic
                        const cartItem = items.find(i => i.id === item.id);
                        if (cartItem) removeFromCart(cartItem.id);
                      } else {
                        // If quantity > 1, just decrement
                        // We can use removeFromCart for this too as it decrements
                         const cartItem = items.find(i => i.id === item.id);
                        if (cartItem) removeFromCart(cartItem.id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityText}>{quantity}</Text>
                  
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => handleAddToCart(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Cart Button - DoorDash Style */}
      {items.length > 0 && (
        <SafeAreaView style={styles.cartFooter} edges={['bottom']}>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.reduce((sum, i) => sum + i.quantity, 0)}</Text>
            </View>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Text style={styles.cartTotal}>${total.toFixed(2)}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  headerInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 120, // Space for tab bar
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: Colors.light.text,
  },
  menuItemDesc: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 8,
    lineHeight: 20,
  },
  menuItemPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: Colors.light.card,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: Colors.light.primary,
    fontWeight: '700',
    fontSize: 24,
  },
  addButtonSuccess: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  addButtonTextSuccess: {
    color: '#fff',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    minWidth: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewCartButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBadge: {
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  viewCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 16,
  },
  cartTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
