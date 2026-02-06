/**
 * Merchants Routes - List and manage connected Square merchants
 */

import { Router, Request, Response } from 'express';
import {
  listMerchants,
  getCurrentMerchant,
  deactivateMerchant,
  deleteMerchant,
  getMerchantById,
} from '../services/merchantService';

const router = Router();

/**
 * Helper to parse sandbox parameter
 */
function isSandbox(req: Request): boolean {
  const queryVal = req.query.sandbox;
  if (queryVal !== undefined) {
    return queryVal === 'true';
  }
  return false; // Default to production for merchant listing
}

/**
 * GET /merchants - List all connected merchants
 * Query params:
 *   - sandbox: "true" to filter sandbox only, "false" for production only
 *   - all: "true" to list all merchants regardless of environment
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const all = req.query.all === 'true';
    const sandbox = all ? undefined : isSandbox(req);

    const merchants = await listMerchants(sandbox);

    res.json({
      success: true,
      data: {
        merchants: merchants.map(
          (m: {
            id: string;
            merchantId: string;
            businessName: string | null;
            locationId: string | null;
            isSandbox: boolean;
            isActive: boolean;
            expiresAt: Date;
            createdAt: Date;
          }) => ({
            id: m.id,
            merchantId: m.merchantId,
            businessName: m.businessName,
            locationId: m.locationId,
            isSandbox: m.isSandbox,
            isActive: m.isActive,
            expiresAt: m.expiresAt,
            createdAt: m.createdAt,
          })
        ),
        count: merchants.length,
      },
    });
  } catch (error) {
    console.error('List merchants error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list merchants',
    });
  }
});

/**
 * GET /merchants/current - Get the current/default merchant for environment
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const sandbox = isSandbox(req);
    const merchant = await getCurrentMerchant(sandbox);

    if (!merchant) {
      return res.json({
        success: true,
        data: { connected: false },
      });
    }

    res.json({
      success: true,
      data: {
        connected: true,
        id: merchant.id,
        merchantId: merchant.merchantId,
        businessName: merchant.businessName,
        locationId: merchant.locationId,
        isSandbox: merchant.isSandbox,
        expiresAt: merchant.expiresAt,
      },
    });
  } catch (error) {
    console.error('Get current merchant error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get merchant',
    });
  }
});

/**
 * GET /merchants/:id - Get a specific merchant
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const merchant = await getMerchantById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: merchant.id,
        merchantId: merchant.merchantId,
        businessName: merchant.businessName,
        locationId: merchant.locationId,
        isSandbox: merchant.isSandbox,
        isActive: merchant.isActive,
        expiresAt: merchant.expiresAt,
        createdAt: merchant.createdAt,
      },
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get merchant',
    });
  }
});

/**
 * DELETE /merchants/:id - Disconnect a merchant (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      await deleteMerchant(req.params.id);
    } else {
      await deactivateMerchant(req.params.id);
    }

    res.json({
      success: true,
      message: permanent ? 'Merchant deleted' : 'Merchant deactivated',
    });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete merchant',
    });
  }
});

export default router;
