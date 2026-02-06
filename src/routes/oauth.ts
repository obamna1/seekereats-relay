/**
 * OAuth Routes - Handle Square OAuth flow
 */

import { Router, Request, Response } from 'express';
import {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getMerchantInfo,
  generateState,
} from '../lib/square-oauth';
import {
  storeMerchantTokens,
  setOAuthState,
  getAndDeleteOAuthState,
} from '../services/merchantService';

const router = Router();

// CORS headers for cross-origin requests from landing page
const setCorsHeaders = (res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

/**
 * OPTIONS /oauth/start - CORS preflight
 */
router.options('/start', (req: Request, res: Response) => {
  setCorsHeaders(res);
  res.status(204).send();
});

/**
 * GET /oauth/start - Start OAuth flow
 * Query params:
 *   - sandbox: "true" or "false" (default: false for production)
 *   - redirect_url: Where to redirect after success (optional)
 */
router.get('/start', async (req: Request, res: Response) => {
  setCorsHeaders(res);

  try {
    const isSandbox = req.query.sandbox === 'true';
    const redirectUrl = req.query.redirect_url as string | undefined;

    // Generate state for CSRF protection
    const state = generateState();

    // Store state in database
    await setOAuthState(state, isSandbox, redirectUrl);

    // Build redirect URI
    const redirectUri =
      process.env.OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/oauth/callback`;

    const authUrl = buildAuthorizationUrl(redirectUri, isSandbox, state);

    res.json({
      success: true,
      data: { authUrl, state },
    });
  } catch (error) {
    console.error('OAuth start error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start OAuth',
    });
  }
});

/**
 * GET /oauth/callback - Handle OAuth redirect from Square
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;

    // Determine base URL for redirects
    const baseUrl = process.env.LANDING_PAGE_URL || 'https://seekereats.xyz';

    // Handle OAuth errors
    if (error) {
      const errorUrl = new URL('/connect-success', baseUrl);
      errorUrl.searchParams.set('oauth_error', errorDescription || error);
      return res.redirect(errorUrl.toString());
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing code or state parameter',
      });
    }

    // Verify state (CSRF protection)
    const stateData = await getAndDeleteOAuthState(state);
    if (!stateData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired state parameter',
      });
    }

    const isSandbox = stateData.isSandbox;
    const redirectUri =
      process.env.OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/oauth/callback`;

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code, redirectUri, isSandbox);

    // Get merchant info
    const merchantInfo = await getMerchantInfo(tokenData.accessToken, isSandbox);

    // Store tokens in PostgreSQL
    await storeMerchantTokens({
      merchantId: tokenData.merchantId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      businessName: merchantInfo.businessName,
      locationId: merchantInfo.mainLocationId,
      isSandbox,
    });

    console.log(
      `[OAuth] Successfully connected merchant: ${merchantInfo.businessName || tokenData.merchantId} (${isSandbox ? 'sandbox' : 'production'})`
    );

    // Redirect to custom URL if provided, otherwise to landing page
    let successUrl: URL;
    if (stateData.redirectUrl) {
      successUrl = new URL(stateData.redirectUrl);
    } else {
      successUrl = new URL('/connect-success', baseUrl);
    }
    successUrl.searchParams.set('oauth_success', 'true');
    successUrl.searchParams.set('merchant_id', tokenData.merchantId);
    successUrl.searchParams.set('sandbox', String(isSandbox));

    return res.redirect(successUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    const baseUrl = process.env.LANDING_PAGE_URL || 'https://seekereats.xyz';
    const errorUrl = new URL('/connect-success', baseUrl);
    errorUrl.searchParams.set(
      'oauth_error',
      error instanceof Error ? error.message : 'OAuth failed'
    );
    return res.redirect(errorUrl.toString());
  }
});

export default router;
