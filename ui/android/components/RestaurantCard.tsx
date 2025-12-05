import { Colors } from '@/constants/colors';
import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  categories: string[];
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurant/${restaurant.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image source={{ uri: restaurant.image }} style={styles.image} />
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>{restaurant.rating}</Text>
              <Text style={styles.star}>★</Text>
            </View>
          </View>
          <Text style={styles.details}>
            {restaurant.deliveryTime} • ${restaurant.deliveryFee} delivery
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  info: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: Colors.light.text,
  },
  star: {
    fontSize: 12,
    color: Colors.light.accent,
  },
  details: {
    color: Colors.light.icon,
    fontSize: 14,
    marginBottom: 4,
  },
});
