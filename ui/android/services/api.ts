// API Client for SeekerEats Relay

// Android Emulator uses 10.0.2.2 to access host localhost
// For physical device, use your computer's local IP address (e.g., 192.168.1.x)
// Configuration for API endpoints
const API_CONFIG = {
  LOCAL: 'http://10.0.2.2:3000', // Android Emulator
  PROD: 'https://seekereats-relay-backend-production.up.railway.app',
};

// Default to PROD for now, can be easily switched
const API_URL = API_CONFIG.PROD; 

// Demo Mode: If true, uses low-cost mock data for testing payments
export let DEMO_MODE = true;

export const setDemoMode = (enabled: boolean) => {
  DEMO_MODE = enabled;
  console.log('[API] Demo Mode set to:', enabled);
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  image?: string;
  available?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  categories: string[];
  menu?: MenuItem[];
  description?: string;
  minimumOrder?: number;
  cuisine?: string;
  address?: string;
}

export interface DeliveryQuote {
  external_delivery_id: string;
  fee: number;
  currency: string;
  pickup_time_estimated: string;
  dropoff_time_estimated: string;
  delivery_status: string;
}

// Helper to map API cuisine to frontend categories
const mapCuisineToCategories = (cuisine: string | undefined): string[] => {
  if (!cuisine) return ['All'];
  
  // Map specific cuisines to our frontend categories
  switch (cuisine) {
    case 'American':
      return ['Burgers', 'American'];
    case 'Japanese':
      return ['Sushi', 'Japanese'];
    case 'Mexican':
      return ['Mexican', 'Tacos'];
    case 'Italian':
      return ['Pizza', 'Italian'];
    default:
      return [cuisine];
  }
};

export const api = {
  /**
   * Get all restaurants
   */
  getRestaurants: async (): Promise<Restaurant[]> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/restaurants`);
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      
      const result = await response.json();
      
      // Handle { success: true, data: [...] } structure
      const restaurantsData = result.success ? result.data : result;
      
      if (!Array.isArray(restaurantsData)) {
        console.error('API returned unexpected format:', result);
        return [];
      }

      // Map API response to frontend model
      return restaurantsData.map((r: any) => ({
        ...r,
        categories: mapCuisineToCategories(r.cuisine),
        // Ensure numbers are numbers
        rating: Number(r.rating),
        deliveryFee: DEMO_MODE ? 0.01 : Number(r.deliveryFee),
      }));
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  /**
   * Get restaurant details by ID
   */
  getRestaurant: async (id: string): Promise<Restaurant | null> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/restaurants/${id}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      
      const result = await response.json();
      const restaurantData = result.success ? result.data : result;

      if (!restaurantData) return null;

      // If in demo mode, override all prices to 0.01
      const menu = DEMO_MODE 
        ? restaurantData.menu?.map((item: any) => ({ ...item, price: 0.01 }))
        : restaurantData.menu;

      return {
        ...restaurantData,
        menu,
        categories: mapCuisineToCategories(restaurantData.cuisine),
        rating: Number(restaurantData.rating),
        deliveryFee: DEMO_MODE ? 0.01 : Number(restaurantData.deliveryFee),
      };
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  /**
   * Get delivery quote
   */
  getDeliveryQuote: async (details: any): Promise<DeliveryQuote | null> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/relay/delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'X-Relay-Secret': 'seekereats-hackathon-secret-2024'
        },
        body: JSON.stringify(details),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to get quote');
      }
      
      const quote = await response.json();
      
      if (DEMO_MODE) {
        return {
          ...quote,
          fee: 0.01,
        };
      }
      
      return quote;
    } catch (error) {
      console.error('API Error:', error);
      if (DEMO_MODE) {
         return {
            external_delivery_id: 'demo-delivery-id',
            fee: 0.01,
            currency: 'USD',
            pickup_time_estimated: new Date(Date.now() + 15 * 60000).toISOString(),
            dropoff_time_estimated: new Date(Date.now() + 45 * 60000).toISOString(),
            delivery_status: 'quote',
         };
      }
      throw error;
    }
  },

  /**
   * Accept delivery quote
   */
  acceptDeliveryQuote: async (deliveryId: string, tip: number = 0): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/relay/delivery/${deliveryId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'X-Relay-Secret': 'seekereats-hackathon-secret-2024'
        },
        body: JSON.stringify({ tip }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to accept quote');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Get delivery status
   */
  getDeliveryStatus: async (deliveryId: string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/relay/delivery/${deliveryId}`, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'X-Relay-Secret': 'seekereats-hackathon-secret-2024'
        }
      });
      if (!response.ok) throw new Error('Failed to get status');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  /**
   * Initiate a phone call for order
   */
  initiateCall: async (details: {
    delivery_id: string;
    phone_number: string;
    order_details: string;
    dropoff_address: string;
  }): Promise<any> => {
    try {
      // Demo Mode: We still want real calls to go through
      if (DEMO_MODE) {
        console.log('[API] Demo Mode: Proceeding with REAL initiateCall', details);
      }

      const response = await fetch(`${API_URL}/relay/order-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'X-Relay-Secret': 'seekereats-hackathon-secret-2024'
        },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to initiate call');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
