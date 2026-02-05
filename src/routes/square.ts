/**
 * Square API Routes for Express backend
 *
 * Endpoints:
 * - GET  /square/menu           - Get Square catalog menu
 * - GET  /square/config         - Get Square configuration status
 * - POST /square/orders/quote   - Quote an order (get total price)
 * - POST /square/orders/create  - Create a Square order
 * - POST /square/orders/pay     - Pay for an order with company card
 * - POST /square/orders/submit  - Validate Solana + Create + Pay
 */

import { Router, Request, Response } from 'express';
import * as SquareClient from '../clients/SquareClient';
import { validateSolanaPayment, getValidatorConfig } from '../lib/solana-validator';

const router = Router();

/**
 * GET /square/menu
 * Fetch menu items from Square Catalog
 */
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const menu = await SquareClient.getMenu();
    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    console.error('[Square] Error fetching menu:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch menu',
    });
  }
});

/**
 * GET /square/config
 * Get Square and Solana configuration status
 */
router.get('/config', (req: Request, res: Response) => {
  const squareConfig = SquareClient.getConfig();
  const solanaConfig = getValidatorConfig();
  res.status(200).json({
    success: true,
    data: {
      square: squareConfig,
      solana: solanaConfig,
    },
  });
});

/**
 * POST /square/orders/quote
 * Calculate order total from Square catalog prices
 */
router.post('/orders/quote', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'items array is required',
      });
      return;
    }

    const quote = await SquareClient.quoteOrder(items);
    res.status(200).json({
      success: true,
      ...quote,
      estimatedPickupMinutes: 15,
    });
  } catch (error: any) {
    console.error('[Square] Error quoting order:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to quote order',
    });
  }
});

/**
 * POST /square/orders/create
 * Create a Square order (without payment)
 */
router.post('/orders/create', async (req: Request, res: Response) => {
  try {
    const { items, fulfillment } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'items array is required',
      });
      return;
    }

    if (!fulfillment?.displayName || !fulfillment?.phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'fulfillment.displayName and fulfillment.phoneNumber are required',
      });
      return;
    }

    const order = await SquareClient.createOrder({ items, fulfillment });
    res.status(201).json({
      success: true,
      ...order,
    });
  } catch (error: any) {
    console.error('[Square] Error creating order:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
});

/**
 * POST /square/orders/pay
 * Pay for an existing order using company card
 */
router.post('/orders/pay', async (req: Request, res: Response) => {
  try {
    const { orderId, amountCents, currency, note } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
      return;
    }

    if (!amountCents || amountCents <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid amountCents is required',
      });
      return;
    }

    const payment = await SquareClient.payOrder({ orderId, amountCents, currency, note });
    res.status(200).json({
      success: true,
      ...payment,
    });
  } catch (error: any) {
    console.error('[Square] Error paying order:', error.message);

    // Check for Square API errors
    if (error.errors) {
      res.status(400).json({
        success: false,
        error: error.errors[0]?.detail || 'Payment failed',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pay order',
    });
  }
});

/**
 * POST /square/orders/submit
 * Full order flow with Solana validation:
 * 1. Validate Solana transaction on-chain
 * 2. Quote to verify prices
 * 3. Create Square order
 * 4. Pay with company card
 */
router.post('/orders/submit', async (req: Request, res: Response) => {
  try {
    const {
      items,
      fulfillment,
      solanaTxSignature,
      expectedTotalCents,
      sandbox = true, // Default to sandbox/test mode
    } = req.body;

    const isSandbox = sandbox === true || sandbox === 'true';

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'items array is required',
      });
      return;
    }

    if (!fulfillment?.displayName || !fulfillment?.phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'fulfillment details required (displayName, phoneNumber)',
      });
      return;
    }

    if (!solanaTxSignature) {
      res.status(400).json({
        success: false,
        error: 'solanaTxSignature is required',
      });
      return;
    }

    // ====================================================
    // STEP 1: Validate Solana payment on-chain
    // ====================================================
    console.log('[Square] Step 1: Validating Solana transaction...');
    console.log('[Square] Signature:', solanaTxSignature);
    console.log('[Square] Test mode:', isSandbox);

    const validationResult = await validateSolanaPayment({
      signature: solanaTxSignature,
      expectedAmountCents: expectedTotalCents || 0,
      isTestMode: isSandbox,
    });

    if (!validationResult.valid) {
      console.error('[Square] Solana validation failed:', validationResult.error);
      res.status(400).json({
        success: false,
        error: `Payment validation failed: ${validationResult.error}`,
      });
      return;
    }

    console.log('[Square] Solana payment validated:', validationResult.confirmationStatus);

    // ====================================================
    // STEP 2: Quote to verify current prices
    // ====================================================
    console.log('[Square] Step 2: Quoting order...');
    const quote = await SquareClient.quoteOrder(items);

    // Verify amount matches expected (allow $0.01 variance for rounding)
    if (expectedTotalCents && Math.abs(quote.totalCents - expectedTotalCents) > 1) {
      res.status(400).json({
        success: false,
        error: `Price changed: expected ${expectedTotalCents} cents, got ${quote.totalCents} cents`,
      });
      return;
    }

    // ====================================================
    // STEP 3: Create Square order
    // ====================================================
    console.log('[Square] Step 3: Creating order...');
    const order = await SquareClient.createOrder({ items, fulfillment });
    console.log('[Square] Order created:', order.orderId);

    // ====================================================
    // STEP 4: Pay with company card
    // ====================================================
    console.log('[Square] Step 4: Processing payment...');
    const payment = await SquareClient.payOrder({
      orderId: order.orderId,
      amountCents: order.totalAmountCents,
      currency: order.currency,
      note: `SeekerEats - Solana: ${solanaTxSignature.slice(0, 20)}...`,
    });

    console.log('[Square] Payment complete:', payment.paymentId, payment.status);

    // ====================================================
    // Return success
    // ====================================================
    res.status(201).json({
      success: true,
      orderId: order.orderId,
      paymentId: payment.paymentId,
      status: payment.status,
      totalCents: order.totalAmountCents,
      currency: order.currency,
      solanaValidation: {
        signature: solanaTxSignature,
        confirmationStatus: validationResult.confirmationStatus,
      },
    });
  } catch (error: any) {
    console.error('[Square] Error submitting order:', error.message);

    if (error.errors) {
      res.status(400).json({
        success: false,
        error: error.errors[0]?.detail || 'Order failed',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit order',
    });
  }
});

export default router;
