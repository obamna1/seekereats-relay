import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Simple token-based auth using localStorage on frontend
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Auth middleware for admin API routes
function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }

  next();
}

/**
 * POST /admin/api/login
 * Authenticate with password, returns token
 */
router.post('/api/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// ============ RESTAURANT CRUD ============

/**
 * GET /admin/api/restaurants
 * List all restaurants (including inactive)
 */
router.get('/api/restaurants', adminAuth, async (req: Request, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { priority: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        cuisine: true,
        city: true,
        phone: true,
        isActive: true,
        priority: true,
        fulfillmentType: true,
        createdAt: true,
        _count: { select: { menuItems: true } },
      },
    });

    res.json({ success: true, data: restaurants });
  } catch (error: any) {
    console.error('[Admin API] Error listing restaurants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/api/restaurants/:id
 * Get single restaurant with all fields
 */
router.get('/api/restaurants/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { menuItems: true },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error: any) {
    console.error('[Admin API] Error fetching restaurant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /admin/api/restaurants
 * Create new restaurant
 */
router.post('/api/restaurants', adminAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        cuisine: data.cuisine,
        imageUrl: data.imageUrl,
        rating: data.rating || 0,
        deliveryTime: data.deliveryTime,
        deliveryFee: data.deliveryFee || 0,
        minimumOrder: data.minimumOrder || 0,
        operatingHours: data.operatingHours,
        orderNotes: data.orderNotes,
        pickupInstructions: data.pickupInstructions,
        paymentMethod: data.paymentMethod || 'CARD_ON_FILE',
        paymentNotes: data.paymentNotes,
        fulfillmentType: data.fulfillmentType || 'PICKUP',
        estimatedPrepTime: data.estimatedPrepTime,
        priority: data.priority || 999,
        isActive: data.isActive ?? true,
      },
    });

    console.log(`[Admin API] Created restaurant: ${restaurant.name}`);
    res.status(201).json({ success: true, data: restaurant });
  } catch (error: any) {
    console.error('[Admin API] Error creating restaurant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /admin/api/restaurants/:id
 * Update restaurant
 */
router.put('/api/restaurants/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
    });

    console.log(`[Admin API] Updated restaurant: ${restaurant.name}`);
    res.json({ success: true, data: restaurant });
  } catch (error: any) {
    console.error('[Admin API] Error updating restaurant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /admin/api/restaurants/:id
 * Soft delete (set isActive=false)
 */
router.delete('/api/restaurants/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });

    console.log(`[Admin API] Soft-deleted restaurant: ${restaurant.name}`);
    res.json({ success: true, message: 'Restaurant deactivated' });
  } catch (error: any) {
    console.error('[Admin API] Error deleting restaurant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ MENU ITEM CRUD ============

/**
 * GET /admin/api/restaurants/:id/menu
 * Get menu items for a restaurant
 */
router.get('/api/restaurants/:id/menu', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: id },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: menuItems });
  } catch (error: any) {
    console.error('[Admin API] Error listing menu items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /admin/api/restaurants/:id/menu
 * Add menu item to restaurant
 */
router.post('/api/restaurants/:id/menu', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId: id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image: data.image,
        available: data.available ?? true,
        customizable: data.customizable ?? false,
        customNotes: data.customNotes,
      },
    });

    console.log(`[Admin API] Created menu item: ${menuItem.name}`);
    res.status(201).json({ success: true, data: menuItem });
  } catch (error: any) {
    console.error('[Admin API] Error creating menu item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /admin/api/menu/:id
 * Update menu item
 */
router.put('/api/menu/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data,
    });

    console.log(`[Admin API] Updated menu item: ${menuItem.name}`);
    res.json({ success: true, data: menuItem });
  } catch (error: any) {
    console.error('[Admin API] Error updating menu item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /admin/api/menu/:id
 * Delete menu item (hard delete)
 */
router.delete('/api/menu/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const menuItem = await prisma.menuItem.delete({
      where: { id },
    });

    console.log(`[Admin API] Deleted menu item: ${menuItem.name}`);
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error: any) {
    console.error('[Admin API] Error deleting menu item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ORDERS ADMIN ============

/**
 * GET /admin/api/orders
 * List recent orders with full details
 */
router.get('/api/orders', adminAuth, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        restaurant: { select: { name: true, phone: true } },
        user: { select: { id: true, walletAddress: true } },
        items: { include: { menuItem: { select: { name: true, price: true } } } },
      },
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('[Admin API] Error listing orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/api/orders/:id
 * Get single order with full details
 */
router.get('/api/orders/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: { select: { name: true, phone: true, address: true } },
        user: { select: { id: true, walletAddress: true } },
        items: { include: { menuItem: { select: { name: true, price: true } } } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('[Admin API] Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /admin/api/orders/:id/refund
 * Mark order for refund with detailed logging for manual processing
 */
router.post('/api/orders/:id/refund', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get order with user wallet for refund info
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { walletAddress: true } },
        restaurant: { select: { name: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Update order status
    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'REFUND_PENDING',
        status: 'CANCELLED',
        rejectedReason: reason || 'Marked for refund by admin',
      },
    });

    // Log detailed refund notification for manual processing
    const refundDetails = {
      orderId: id,
      orderDate: order.createdAt,
      restaurant: order.restaurant?.name,
      customerWallet: order.user?.walletAddress,
      paymentTxHash: order.paymentTxHash,
      refundAmount: order.total,
      items: order.items.map((i) => `${i.quantity}x ${i.menuItem?.name}`).join(', '),
      reason: reason || 'Admin refund',
    };

    console.log('\n' + '='.repeat(60));
    console.log('[REFUND NOTIFICATION] Order requires manual refund');
    console.log('='.repeat(60));
    console.log(JSON.stringify(refundDetails, null, 2));
    console.log('='.repeat(60) + '\n');

    // Future: Send Discord/email notification here
    // await sendDiscordNotification(refundDetails);
    // await sendEmailNotification(refundDetails);

    res.json({
      success: true,
      message: 'Order marked for refund. See server logs for refund details.',
      data: {
        orderId: id,
        refundAmount: order.total,
        customerWallet: order.user?.walletAddress,
        paymentTxHash: order.paymentTxHash,
      },
    });
  } catch (error: any) {
    console.error('[Admin API] Error marking refund:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
