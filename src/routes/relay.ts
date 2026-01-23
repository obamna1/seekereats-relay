import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DoorDashClient, QuotePayload, AcceptQuotePayload } from '../clients/DoorDashClient';
import config from '../config/doorDashConfig';
import twilioConfig from '../config/twilioConfig';
import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';
import { callStore } from './twilio';

const router = Router();
const doorDashClient = new DoorDashClient(config);
const prisma = new PrismaClient();

// Configuration
const TEST_PHONE_OVERRIDE = process.env.TEST_PHONE_OVERRIDE || '';

// Lazy-initialize Twilio client (only when needed)
let _twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (!_twilioClient) {
    if (
      !twilioConfig.accountSid ||
      !twilioConfig.authToken ||
      twilioConfig.accountSid === 'placeholder' ||
      twilioConfig.authToken === 'placeholder'
    ) {
      throw new Error(
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
      );
    }
    _twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  }
  return _twilioClient;
}

/**
 * POST /relay/delivery
 * Get a delivery quote to check if delivery is serviceable
 */
router.post('/delivery', async (req: Request, res: Response) => {
  try {
    const {
      pickup_address,
      pickup_business_name,
      pickup_phone_number,
      pickup_instructions,
      dropoff_address,
      dropoff_business_name,
      dropoff_phone_number,
      dropoff_instructions,
      order_value,
    } = req.body;

    // Validate required fields
    const required = [
      'pickup_address',
      'pickup_business_name',
      'pickup_phone_number',
      'dropoff_address',
      'dropoff_business_name',
      'dropoff_phone_number',
      'order_value',
    ];

    const missing = required.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Missing required fields: ${missing.join(', ')}`,
      });
      return;
    }

    // Generate unique delivery ID if not provided
    const external_delivery_id = req.body.external_delivery_id || uuidv4();

    const payload: QuotePayload = {
      external_delivery_id,
      pickup_address,
      pickup_business_name,
      pickup_phone_number,
      pickup_instructions: pickup_instructions || undefined,
      dropoff_address,
      dropoff_business_name,
      dropoff_phone_number,
      dropoff_instructions: dropoff_instructions || undefined,
      order_value,
    };

    // Get quote from DoorDash API
    const response = await doorDashClient.getQuote(payload);

    // Normalize response
    const normalizedResponse = {
      ...response,
      status: response.delivery_status,
    };

    res.status(200).json(normalizedResponse);
  } catch (error: any) {
    console.error('Error getting delivery quote:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get delivery quote',
    });
  }
});

/**
 * GET /relay/delivery/:external_delivery_id
 * Get delivery status
 */
router.get('/delivery/:external_delivery_id', async (req: Request, res: Response) => {
  try {
    const { external_delivery_id } = req.params;

    if (!external_delivery_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'external_delivery_id is required',
      });
      return;
    }

    const response = await doorDashClient.getDelivery(external_delivery_id);

    // Normalize response
    const normalizedResponse = {
      ...response,
      external_delivery_id: response.external_delivery_id,
      status: response.delivery_status || 'unknown',
    };

    res.status(200).json(normalizedResponse);
  } catch (error: any) {
    console.error('Error fetching delivery:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch delivery',
    });
  }
});

/**
 * POST /relay/delivery/:external_delivery_id/accept
 * Accept a delivery quote to create the actual delivery
 */
router.post('/delivery/:external_delivery_id/accept', async (req: Request, res: Response) => {
  try {
    const { external_delivery_id } = req.params;
    const { tip } = req.body;

    if (!external_delivery_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'external_delivery_id is required',
      });
      return;
    }

    const payload: AcceptQuotePayload = tip !== undefined ? { tip } : {};
    const response = await doorDashClient.acceptQuote(external_delivery_id, payload);

    // Normalize response
    const normalizedResponse = {
      ...response,
      status: response.delivery_status || 'created',
    };

    res.status(201).json(normalizedResponse);
  } catch (error: any) {
    console.error(`Error accepting quote ${req.params.external_delivery_id}:`, error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to accept delivery quote',
    });
  }
});

/**
 * POST /relay/order-call
 * Initiate a phone call using Twilio with TwiML text-to-speech
 */
router.post('/order-call', async (req: Request, res: Response) => {
  try {
    const { delivery_id, phone_number, order_details, dropoff_address } = req.body;

    // Validate required fields
    if (!phone_number || !order_details) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'phone_number and order_details are required',
      });
      return;
    }

    // Override phone number to verified Twilio number for testing
    const actualPhoneNumber = '+14134741348';
    console.log(
      '[PHONE CALL] Overriding phone number - Requested:',
      phone_number,
      '-> Calling:',
      actualPhoneNumber
    );

    // Create TwiML message with text-to-speech
    const message = `Hello, I would like to place an order for ${order_details}${dropoff_address ? `, delivered to ${dropoff_address}` : ''}`;

    // Ensure BASE_URL is configured
    if (!twilioConfig.baseUrl) {
      throw new Error('BASE_URL is not configured');
    }

    // Initiate the call with URL for TwiML (include delivery_id for tracking)
    const call = await getTwilioClient().calls.create({
      from: twilioConfig.phoneNumber!,
      to: actualPhoneNumber,
      url: `${twilioConfig.baseUrl}/twilio/twiml?message=${encodeURIComponent(message)}&delivery_id=${delivery_id}`,
    });

    // Store call info in memory
    callStore[call.sid] = {
      sid: call.sid,
      phone_number,
      delivery_id,
      order_details,
      status: 'initiated',
      created_at: new Date().toISOString(),
    };

    res.status(200).json({
      call_sid: call.sid,
      status: 'initiated',
      phone_number,
      message: 'Call initiated successfully',
    });
  } catch (error: any) {
    console.error('Error initiating call:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to initiate call',
    });
  }
});

/**
 * GET /relay/config
 * Return frontend configuration (phone numbers for calls)
 */
router.get('/config', (req: Request, res: Response) => {
  res.status(200).json({
    test_phone_number: twilioConfig.testPhoneNumber,
  });
});

/**
 * GET /relay/order-call/:call_sid/status
 * Get the status of a Twilio call
 */
router.get('/order-call/:call_sid/status', async (req: Request, res: Response) => {
  try {
    const { call_sid } = req.params;

    if (!call_sid) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'call_sid is required',
      });
      return;
    }

    // Get call details from Twilio
    const call = await getTwilioClient().calls(call_sid).fetch();

    // Get stored call info
    const storedCall = callStore[call_sid] || {};

    res.status(200).json({
      call_sid: call.sid,
      call_status: call.status,
      order_status: storedCall.status || 'pending',
      phone_number: storedCall.phone_number,
      delivery_id: storedCall.delivery_id,
      duration: call.duration,
      created_at: call.dateCreated,
      end_time: call.dateUpdated,
      response_time: storedCall.response_time,
    });
  } catch (error: any) {
    console.error('Error fetching call status:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch call status',
    });
  }
});

// ============================================================
// ORDER ENDPOINTS (Phase 4)
// ============================================================

/**
 * POST /relay/orders
 * Create a new order in the database
 */
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const {
      restaurantId,
      items,
      total,
      paymentTxHash,
      customerWallet,
      deliveryAddress,
      deliveryNotes,
    } = req.body;

    // Validate required fields
    if (!restaurantId || !items || !total || !customerWallet) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'restaurantId, items, total, and customerWallet are required',
      });
      return;
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Restaurant not found',
      });
      return;
    }

    // Create or find user by wallet address
    let user = await prisma.user.findUnique({
      where: { walletAddress: customerWallet },
    });

    if (!user) {
      // Create user with wallet as identifier
      user = await prisma.user.create({
        data: {
          email: `${customerWallet.substring(0, 8)}@wallet.seekereats.app`,
          walletAddress: customerWallet,
        },
      });
      console.log(`[Orders API] Created new user for wallet: ${customerWallet.substring(0, 8)}...`);
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        restaurantId,
        subtotal: total,
        deliveryFee: 0, // Restaurant pickup for now
        total,
        status: 'PENDING',
        deliveryAddress: deliveryAddress || 'Pickup',
        deliveryNotes,
        paymentMethod: 'USDC',
        paymentTxHash: paymentTxHash || null,
        paymentStatus: paymentTxHash ? 'COMPLETED' : 'PENDING',
        items: {
          create: items.map(
            (item: { menuItemId: string; quantity: number; price: number; notes?: string }) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
            })
          ),
        },
      },
      include: {
        restaurant: { select: { name: true, phone: true, orderNotes: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });

    console.log(`[Orders API] Created order: ${order.id} for ${restaurant.name}`);

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        total: order.total,
        restaurant: order.restaurant.name,
        itemCount: order.items.length,
        createdAt: order.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Orders API] Error creating order:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create order',
    });
  }
});

/**
 * GET /relay/orders/:id/status
 * Get order status for mobile polling
 */
router.get('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: { select: { name: true, estimatedPrepTime: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });

    if (!order) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        callStatus: order.callStatus,
        restaurant: order.restaurant.name,
        estimatedPrepTime: order.restaurant.estimatedPrepTime,
        total: order.total,
        paymentStatus: order.paymentStatus,
        confirmedAt: order.confirmedAt,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Orders API] Error fetching order status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch order status',
    });
  }
});

/**
 * POST /relay/orders/:id/call
 * Initiate a phone call for an existing order
 */
router.post('/orders/:id/call', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch order with restaurant details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });

    if (!order) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
      });
      return;
    }

    // Get restaurant phone (use test override if set)
    const targetPhone = TEST_PHONE_OVERRIDE || order.restaurant.phone;

    if (!targetPhone) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Restaurant has no phone number configured',
      });
      return;
    }

    console.log(
      `[ORDER CALL] Order: ${id}, Restaurant: ${order.restaurant.name}, Phone: ${targetPhone}`
    );

    // Build order details string
    const orderDetails = order.items
      .map((item) => `${item.quantity} ${item.menuItem.name}`)
      .join(', ');

    // Build TwiML script with restaurant-specific notes
    const script = `
      Hello, this is Seeker Eats placing an order for pickup.
      ${order.restaurant.orderNotes || ''}
      Order: ${orderDetails}.
      ${order.restaurant.paymentMethod === 'CARD_ON_FILE' ? 'Payment is on our card on file.' : 'We will provide payment details.'}
      Press 1 to confirm this order.
      Press 2 to reject this order.
      Press 3 to repeat this message.
    `
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure BASE_URL is configured
    if (!twilioConfig.baseUrl) {
      throw new Error('BASE_URL is not configured');
    }

    // Initiate the call with orderId in URL for DTMF tracking
    const call = await getTwilioClient().calls.create({
      from: twilioConfig.phoneNumber!,
      to: targetPhone,
      url: `${twilioConfig.baseUrl}/twilio/twiml?message=${encodeURIComponent(script)}&orderId=${id}`,
    });

    // Update order with call info
    await prisma.order.update({
      where: { id },
      data: {
        callSid: call.sid,
        callStatus: 'initiated',
      },
    });

    // Also store in memory for backward compatibility
    callStore[call.sid] = {
      sid: call.sid,
      orderId: id,
      phone_number: targetPhone,
      order_details: orderDetails,
      status: 'initiated',
      created_at: new Date().toISOString(),
    };

    console.log(`[ORDER CALL] Call initiated: ${call.sid}`);

    res.status(200).json({
      success: true,
      data: {
        callSid: call.sid,
        status: 'initiated',
        orderId: id,
      },
    });
  } catch (error: any) {
    console.error('[Orders API] Error initiating call:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to initiate call',
    });
  }
});

export default router;
