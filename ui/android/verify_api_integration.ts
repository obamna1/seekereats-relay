
import { api } from './services/api';

async function verify() {
  console.log('Verifying API Integration...');

  try {
    // Test 1: Get All Restaurants
    console.log('\nTest 1: Fetching all restaurants...');
    const restaurants = await api.getRestaurants();
    console.log(`Success! Found ${restaurants.length} restaurants.`);
    
    if (restaurants.length > 0) {
      const first = restaurants[0];
      console.log('First restaurant sample:', {
        name: first.name,
        categories: first.categories,
        rating: first.rating,
        deliveryFee: first.deliveryFee
      });

      // Verify mapping
      if (!first.categories || first.categories.length === 0) {
        console.error('ERROR: Categories not mapped correctly!');
      } else {
        console.log('Categories mapped successfully:', first.categories);
      }
    } else {
      console.warn('WARNING: No restaurants returned from API.');
    }

    // Test 2: Get Specific Restaurant
    console.log('\nTest 2: Fetching restaurant with ID 1...');
    const restaurant = await api.getRestaurant('1');
    if (restaurant) {
      console.log('Success! Found restaurant:', restaurant.name);
      console.log('Menu items count:', restaurant.menu?.length);
    } else {
      console.error('ERROR: Failed to fetch restaurant 1');
    }

    // Test 3: Invalid ID
    console.log('\nTest 3: Fetching invalid restaurant ID...');
    const invalid = await api.getRestaurant('999999');
    if (invalid === null) {
      console.log('Success! correctly returned null for invalid ID.');
    } else {
      console.error('ERROR: Should have returned null for invalid ID, got:', invalid);
    }

  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  }
}

verify();
