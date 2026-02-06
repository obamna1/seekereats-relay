/**
 * Restaurants Routes - Connected Square merchants as restaurants
 *
 * This replaces the old Prisma-based restaurant table.
 * Each restaurant = one Square merchant connected via OAuth.
 */

import { Router, Request, Response } from 'express';
import { SquareClient, SquareEnvironment } from 'square';
import { listMerchants, getMerchantBySquareId } from '../services/merchantService';

const router = Router();

// Placeholder image for restaurants without Square logo
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';

interface RestaurantData {
  id: string;
  merchantId: string;
  name: string;
  image: string;
  address: string;
  city: string;
  deliveryTime: string; // Placeholder - will use Uber Direct later
  deliveryFee: number; // Placeholder - will use Uber Direct later
  categories: string[];
  isSandbox: boolean;
}

/**
 * Helper to fetch merchant location details from Square
 */
async function getLocationDetails(
  accessToken: string,
  locationId: string,
  isSandbox: boolean
): Promise<{ address: string; city: string; logoUrl: string | undefined }> {
  try {
    const client = new SquareClient({
      token: accessToken,
      environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    });

    const response = await client.locations.get({ locationId });
    const location = response.location;

    return {
      address: location?.address?.addressLine1 || 'Address not available',
      city: location?.address?.locality || '',
      logoUrl: location?.logoUrl || undefined,
    };
  } catch (error) {
    console.error('[Restaurants] Error fetching location:', error);
    return { address: 'Address not available', city: '', logoUrl: undefined };
  }
}

/**
 * Helper to parse sandbox parameter
 */
function isSandbox(req: Request): boolean {
  const queryVal = req.query.sandbox;
  if (queryVal !== undefined) {
    return queryVal === 'true';
  }
  return false; // Default to production for restaurant listing
}

/**
 * GET /restaurants - List all connected Square merchants as restaurants
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const sandbox = isSandbox(req);
    console.log(`[Restaurants] Fetching restaurant list (sandbox: ${sandbox})`);

    // Get all active merchants from PostgreSQL
    const merchants = await listMerchants(sandbox);
    const activeMerchants = merchants.filter((m) => m.isActive);

    if (activeMerchants.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No restaurants connected yet',
      });
    }

    // Fetch additional details from Square for each merchant
    const restaurants: RestaurantData[] = await Promise.all(
      activeMerchants.map(
        async (merchant: {
          id: string;
          merchantId: string;
          businessName: string | null;
          locationId: string | null;
          isSandbox: boolean;
          isActive: boolean;
        }) => {
          // Get full merchant record with access token
          const fullMerchant = await getMerchantBySquareId(merchant.merchantId, sandbox);

          let locationDetails: { address: string; city: string; logoUrl: string | undefined } = {
            address: 'Address not available',
            city: '',
            logoUrl: undefined,
          };

          if (fullMerchant?.locationId && fullMerchant.accessToken) {
            locationDetails = await getLocationDetails(
              fullMerchant.accessToken,
              fullMerchant.locationId,
              sandbox
            );
          }

          return {
            id: merchant.id, // Internal DB ID
            merchantId: merchant.merchantId, // Square merchant ID
            name: merchant.businessName || 'Restaurant',
            image: locationDetails.logoUrl || PLACEHOLDER_IMAGE,
            address: locationDetails.address || 'Address not available',
            city: locationDetails.city || '',
            deliveryTime: '20-35 min', // Placeholder
            deliveryFee: 2.99, // Placeholder
            categories: ['Restaurant'], // Placeholder
            isSandbox: merchant.isSandbox,
          };
        }
      )
    );

    res.json({
      success: true,
      data: restaurants,
      count: restaurants.length,
    });
  } catch (error) {
    console.error('[Restaurants] Error listing restaurants:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list restaurants',
    });
  }
});

/**
 * GET /restaurants/:id - Get single restaurant details
 * Note: id is the internal DB id, not Square merchantId
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sandbox = isSandbox(req);

    // Find merchant by internal ID
    const { getMerchantById } = await import('../services/merchantService');
    const merchant = await getMerchantById(id);

    if (!merchant || merchant.isSandbox !== sandbox) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    let locationDetails: { address: string; city: string; logoUrl: string | undefined } = {
      address: 'Address not available',
      city: '',
      logoUrl: undefined,
    };

    if (merchant.locationId) {
      locationDetails = await getLocationDetails(
        merchant.accessToken,
        merchant.locationId,
        sandbox
      );
    }

    const restaurant: RestaurantData = {
      id: merchant.id,
      merchantId: merchant.merchantId,
      name: merchant.businessName || 'Restaurant',
      image: locationDetails.logoUrl || PLACEHOLDER_IMAGE,
      address: locationDetails.address || 'Address not available',
      city: locationDetails.city || '',
      deliveryTime: '20-35 min',
      deliveryFee: 2.99,
      categories: ['Restaurant'],
      isSandbox: merchant.isSandbox,
    };

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error('[Restaurants] Error getting restaurant:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get restaurant',
    });
  }
});

export default router;
