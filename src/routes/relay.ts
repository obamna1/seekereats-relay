import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DoorDashClient, QuotePayload, AcceptQuotePayload } from '../clients/DoorDashClient';
import config from '../config/doorDashConfig';
import twilioConfig from '../config/twilioConfig';
import twilio from 'twilio';

const router = Router();
const doorDashClient = new DoorDashClient(config);

// Initialize Twilio client
const twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);

// In-memory call store (for demo purposes)
const callStore: { [key: string]: any } = {};

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

    const missing = required.filter(field => !req.body[field]);
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

    // Create TwiML message with text-to-speech
    const message = `Hello, I would like to place an order for ${order_details}${dropoff_address ? `, delivered to ${dropoff_address}` : ''}`;

    // Initiate the call with simple text-to-speech
    const call = await twilioClient.calls.create({
      from: twilioConfig.phoneNumber!,
      to: phone_number,
      twiml: `<Response><Say>${message}</Say></Response>`,
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
    const call = await twilioClient.calls(call_sid).fetch();

    // Get stored call info
    const storedCall = callStore[call_sid] || {};

    res.status(200).json({
      call_sid: call.sid,
      status: call.status,
      phone_number: storedCall.phone_number,
      delivery_id: storedCall.delivery_id,
      duration: call.duration,
      created_at: call.dateCreated,
      end_time: call.dateUpdated,
    });
  } catch (error: any) {
    console.error('Error fetching call status:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch call status',
    });
  }
});

export default router;
