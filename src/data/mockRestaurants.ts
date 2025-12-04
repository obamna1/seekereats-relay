/**
 * Mock restaurant and menu data for SeekerEats
 * Used for development and testing purposes
 */

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  cuisine: string;
  address: string;
  menu: MenuItem[];
}

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Burger King',
    description: 'Flame-grilled burgers and classic fast food favorites',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    rating: 4.3,
    deliveryTime: '20-30 min',
    deliveryFee: 2.99,
    minimumOrder: 10.00,
    cuisine: 'American',
    address: '123 Main St, Downtown',
    menu: [
      {
        id: '1-1',
        name: 'Whopper Meal',
        description: 'Flame-grilled beef patty with lettuce, tomato, pickles, onions, and mayo on a sesame seed bun. Includes fries and drink.',
        price: 9.99,
        category: 'Meals',
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
        available: true,
      },
      {
        id: '1-2',
        name: 'Chicken Fries',
        description: 'Crispy, golden chicken strips shaped like fries. Perfect for dipping!',
        price: 4.99,
        category: 'Sides',
        image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
        available: true,
      },
      {
        id: '1-3',
        name: 'Onion Rings',
        description: 'Crispy golden onion rings with a crunchy coating',
        price: 3.49,
        category: 'Sides',
        image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80',
        available: true,
      },
      {
        id: '1-4',
        name: 'Fountain Drink',
        description: 'Choose from a variety of refreshing fountain beverages',
        price: 2.29,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
        available: true,
      },
    ],
  },
  {
    id: '2',
    name: 'Sushi Bar',
    description: 'Fresh sushi and Japanese cuisine made with premium ingredients',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    rating: 4.7,
    deliveryTime: '30-40 min',
    deliveryFee: 3.99,
    minimumOrder: 15.00,
    cuisine: 'Japanese',
    address: '456 Ocean Ave, Waterfront',
    menu: [
      {
        id: '2-1',
        name: 'Spicy Tuna Roll',
        description: 'Fresh tuna with spicy mayo, cucumber, and sesame seeds rolled in nori and rice',
        price: 12.99,
        category: 'Rolls',
        image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&q=80',
        available: true,
      },
      {
        id: '2-2',
        name: 'California Roll',
        description: 'Imitation crab, avocado, and cucumber rolled inside-out with sesame seeds',
        price: 9.99,
        category: 'Rolls',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
        available: true,
      },
      {
        id: '2-3',
        name: 'Edamame',
        description: 'Steamed soybeans lightly salted, a healthy and delicious appetizer',
        price: 5.99,
        category: 'Appetizers',
        image: 'https://images.unsplash.com/photo-1607813011726-d0e2d6da9069?w=600&q=80',
        available: true,
      },
      {
        id: '2-4',
        name: 'Miso Soup',
        description: 'Traditional Japanese soup with tofu, seaweed, and green onions',
        price: 3.99,
        category: 'Soups',
        image: 'https://images.unsplash.com/photo-1623360493651-0e5e6a5a0e1f?w=600&q=80',
        available: true,
      },
    ],
  },
];

/**
 * Get all restaurants
 */
export function getAllRestaurants(): Restaurant[] {
  return MOCK_RESTAURANTS;
}

/**
 * Get a restaurant by ID
 * @param id - Restaurant ID
 * @returns Restaurant or undefined if not found
 */
export function getRestaurantById(id: string): Restaurant | undefined {
  return MOCK_RESTAURANTS.find((restaurant) => restaurant.id === id);
}

/**
 * Get restaurants by cuisine type
 * @param cuisine - Cuisine type
 * @returns Array of restaurants matching the cuisine
 */
export function getRestaurantsByCuisine(cuisine: string): Restaurant[] {
  return MOCK_RESTAURANTS.filter(
    (restaurant) => restaurant.cuisine.toLowerCase() === cuisine.toLowerCase()
  );
}
