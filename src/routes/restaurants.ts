import { Router, Request, Response } from 'express';
import { getAllRestaurants, getRestaurantById } from '../data/mockRestaurants';

const router = Router();

/**
 * GET /restaurants
 * Get all restaurants
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[Restaurants API] GET /restaurants - Fetching all restaurants');

    const restaurants = getAllRestaurants();

    console.log(`[Restaurants API] Found ${restaurants.length} restaurants`);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error: any) {
    console.error('[Restaurants API] Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch restaurants',
    });
  }
});

/**
 * GET /restaurants/:id
 * Get a specific restaurant by ID with full menu
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`[Restaurants API] GET /restaurants/${id} - Fetching restaurant`);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Restaurant ID is required',
      });
    }

    const restaurant = getRestaurantById(id);

    if (!restaurant) {
      console.log(`[Restaurants API] Restaurant with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Restaurant with ID ${id} not found`,
      });
    }

    console.log(`[Restaurants API] Found restaurant: ${restaurant.name} with ${restaurant.menu.length} menu items`);

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error: any) {
    console.error('[Restaurants API] Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch restaurant',
    });
  }
});

export default router;
