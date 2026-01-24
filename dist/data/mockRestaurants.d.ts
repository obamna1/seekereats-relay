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
    phone?: string;
    priority?: number;
}
export declare const MOCK_RESTAURANTS: Restaurant[];
/**
 * Get all restaurants
 */
export declare function getAllRestaurants(): Restaurant[];
/**
 * Get a restaurant by ID
 * @param id - Restaurant ID
 * @returns Restaurant or undefined if not found
 */
export declare function getRestaurantById(id: string): Restaurant | undefined;
/**
 * Get restaurants by cuisine type
 * @param cuisine - Cuisine type
 * @returns Array of restaurants matching the cuisine
 */
export declare function getRestaurantsByCuisine(cuisine: string): Restaurant[];
//# sourceMappingURL=mockRestaurants.d.ts.map