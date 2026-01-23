import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /restaurants
 * Get all active restaurants
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    console.log('[Restaurants API] GET /restaurants', city ? `city=${city}` : '');

    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        ...(city ? { city: city as string } : {}),
      },
      orderBy: { priority: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        imageUrl: true,
        rating: true,
        deliveryTime: true,
        deliveryFee: true,
        minimumOrder: true,
        cuisine: true,
        address: true,
        phone: true,
        city: true,
        fulfillmentType: true,
        operatingHours: true,
        estimatedPrepTime: true,
      },
    });

    // Map to frontend format (imageUrl fallback to image)
    const mapped = restaurants.map((r) => ({
      ...r,
      image: r.imageUrl || r.image,
    }));

    console.log(`[Restaurants API] Found ${mapped.length} restaurants`);

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    console.error('[Restaurants API] Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /restaurants/:id
 * Get restaurant details with menu
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`[Restaurants API] GET /restaurants/${id}`);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { available: true },
          orderBy: { category: 'asc' },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Not Found' });
    }

    // Map to frontend format
    const mapped = {
      ...restaurant,
      image: restaurant.imageUrl || restaurant.image,
      menu: restaurant.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        available: item.available,
      })),
    };

    console.log(
      `[Restaurants API] Found: ${restaurant.name} with ${restaurant.menuItems.length} items`
    );

    res.status(200).json({ success: true, data: mapped });
  } catch (error: any) {
    console.error('[Restaurants API] Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
