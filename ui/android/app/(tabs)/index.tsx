
import { RestaurantCard } from '@/components/RestaurantCard';
import { Colors } from '@/constants/colors';
import { api, Restaurant } from '@/services/api';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const categories = ['All', 'Burgers', 'Sushi', 'Pizza', 'Mexican', 'Dessert'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await api.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRestaurants();
  };

  const filteredRestaurants = selectedCategory === 'All' 
    ? restaurants 
    : restaurants.filter(r => r.categories.includes(selectedCategory));

  const insets = useSafeAreaInsets();

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ListHeaderComponent={() => (
          <View>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <ExpoImage 
                  source={require('../../assets/seekereats_logo.png')} 
                  style={styles.headerLogo} 
                  contentFit="contain"
                />
                <View>
                  <Text style={styles.greeting}>Good Evening,</Text>
                  <Text style={styles.headerTitle}>Seeker Eats</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/account')}>
                <Text style={styles.profileText}>👤</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoriesContainer}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.categoryChip, 
                      selectedCategory === item && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === item && styles.categoryTextActive
                    ]}>{item}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.categoriesContent}
              />
            </View>
            <Text style={styles.sectionTitle}>Nearby Favorites</Text>
          </View>
        )}
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RestaurantCard restaurant={item} />}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No restaurants found.</Text>
            <TouchableOpacity onPress={loadRestaurants} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 20,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: Colors.light.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.icon,
  },
  categoryTextActive: {
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
    color: Colors.light.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
  },
  retryText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 48,
    height: 48,
  },
});
