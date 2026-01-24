"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockRestaurants_1 = require("../data/mockRestaurants");
const router = (0, express_1.Router)();
/**
 * GET /restaurants
 * Get all restaurants
 */
router.get('/', async (req, res) => {
    try {
        console.log('[Restaurants API] GET /restaurants - Fetching all restaurants');
        const restaurants = (0, mockRestaurants_1.getAllRestaurants)();
        console.log(`[Restaurants API] Found ${restaurants.length} restaurants`);
        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants,
        });
    }
    catch (error) {
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
router.get('/:id', async (req, res) => {
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
        const restaurant = (0, mockRestaurants_1.getRestaurantById)(id);
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
    }
    catch (error) {
        console.error('[Restaurants API] Error fetching restaurant:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch restaurant',
        });
    }
});
exports.default = router;
//# sourceMappingURL=restaurants.js.map