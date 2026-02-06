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
 *
 * All endpoints accept ?sandbox=true/false query param or sandbox field in body
 */

import { Router, Request, Response } from 'express';
import * as SquareClient from '../clients/SquareClient';
import { validateSolanaPayment, getValidatorConfig } from '../lib/solana-validator';
import { getMerchantBySquareId } from '../services/merchantService';
import { SquareClient as SquareSDK, SquareEnvironment } from 'square';

const router = Router();

/**
 * Helper to get sandbox flag from request
 */
function isSandbox(req: Request): boolean {
  // Check query param first
  const queryVal = req.query.sandbox;
  if (queryVal !== undefined) {
    return queryVal === 'true';
  }
  // Check body
  if (req.body?.sandbox !== undefined) {
    return req.body.sandbox === 'true' || req.body.sandbox === true;
  }
  // Default to sandbox for safety
  return true;
}

/**
 * GET /square/menu?sandbox=true&merchantId=xxx
 * Fetch menu items from Square Catalog
 * Optional merchantId for specific restaurant
 */
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const sandbox = isSandbox(req);
    const merchantId = req.query.merchantId as string | undefined;
    console.log(
      `[Square] Fetching menu (sandbox: ${sandbox}, merchant: ${merchantId || 'default'})`
    );

    let menu;
    if (merchantId && !sandbox) {
      // Get specific merchant's catalog
      const { client, locationId } = await SquareClient.getClientForMerchant(merchantId, sandbox);
      // Fetch catalog using the merchant-specific client
      const response = await client.catalog.list({ types: 'ITEM' });
      const items = [];
      for await (const obj of response) {
        if (obj.type === 'ITEM' && obj.itemData) {
          const variations = (obj.itemData.variations || []).map((v: any) => ({
            id: v.id || '',
            name: v.itemVariationData?.name || 'Regular',
            priceCents: Number(v.itemVariationData?.priceMoney?.amount || 0),
            currency: v.itemVariationData?.priceMoney?.currency || 'USD',
          }));
          items.push({
            id: obj.id || '',
            name: obj.itemData.name || 'Unnamed Item',
            description: obj.itemData.description || '',
            imageUrl: null,
            variations,
          });
        }
      }
      menu = { items };
    } else {
      // Use default merchant
      menu = await SquareClient.getMenu(sandbox);
    }

    res.status(200).json({
      success: true,
      environment: sandbox ? 'sandbox' : 'production',
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
 * GET /square/config?sandbox=true
 * Get Square and Solana configuration status
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const sandbox = isSandbox(req);
    const squareConfig = await SquareClient.getConfig(sandbox);
    const solanaConfig = getValidatorConfig();

    res.status(200).json({
      success: true,
      data: {
        square: squareConfig,
        solana: solanaConfig,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get config',
    });
  }
});

/**
 * POST /square/orders/quote
 * Calculate order total from Square catalog prices
 */
router.post('/orders/quote', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const sandbox = isSandbox(req);

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'items array is required',
      });
      return;
    }

    console.log(`[Square] Quoting order (sandbox: ${sandbox})`);
    const quote = await SquareClient.quoteOrder(items, sandbox);

    res.status(200).json({
      success: true,
      environment: sandbox ? 'sandbox' : 'production',
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
    const sandbox = isSandbox(req);

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

    console.log(`[Square] Creating order (sandbox: ${sandbox})`);
    const order = await SquareClient.createOrder({ items, fulfillment, isSandbox: sandbox });

    res.status(201).json({
      success: true,
      environment: sandbox ? 'sandbox' : 'production',
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
    const sandbox = isSandbox(req);

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

    console.log(`[Square] Paying order ${orderId} (sandbox: ${sandbox})`);
    const payment = await SquareClient.payOrder({
      orderId,
      amountCents,
      currency,
      note,
      isSandbox: sandbox,
    });

    res.status(200).json({
      success: true,
      environment: sandbox ? 'sandbox' : 'production',
      ...payment,
    });
  } catch (error: any) {
    console.error('[Square] Error paying order:', error.message);

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
    const { items, fulfillment, solanaTxSignature, expectedTotalCents } = req.body;
    const sandbox = isSandbox(req);

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

    console.log(`[Square] Submit order (sandbox: ${sandbox})`);

    // ====================================================
    // STEP 1: Validate Solana payment on-chain
    // ====================================================
    console.log('[Square] Step 1: Validating Solana transaction...');

    const validationResult = await validateSolanaPayment({
      signature: solanaTxSignature,
      expectedAmountCents: expectedTotalCents || 0,
      isTestMode: sandbox,
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
    const quote = await SquareClient.quoteOrder(items, sandbox);

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
    const order = await SquareClient.createOrder({ items, fulfillment, isSandbox: sandbox });
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
      isSandbox: sandbox,
    });

    console.log('[Square] Payment complete:', payment.paymentId, payment.status);

    // ====================================================
    // Return success
    // ====================================================
    res.status(201).json({
      success: true,
      environment: sandbox ? 'sandbox' : 'production',
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
