/**
 * Merchant Service - Prisma CRUD for Square OAuth tokens
 *
 * Handles persistent storage and retrieval of OAuth tokens
 * with automatic token refresh before expiration.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MerchantTokens {
  merchantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  businessName?: string;
  locationId?: string;
  isSandbox: boolean;
}

/**
 * Store or update merchant tokens
 */
export async function storeMerchantTokens(tokens: MerchantTokens) {
  return prisma.squareMerchant.upsert({
    where: {
      merchantId_isSandbox: {
        merchantId: tokens.merchantId,
        isSandbox: tokens.isSandbox,
      },
    },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      businessName: tokens.businessName,
      locationId: tokens.locationId,
      isActive: true,
    },
    create: {
      merchantId: tokens.merchantId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      businessName: tokens.businessName,
      locationId: tokens.locationId,
      isSandbox: tokens.isSandbox,
      isActive: true,
    },
  });
}

/**
 * Get first active merchant for environment
 * Used when no specific merchant is selected
 */
export async function getCurrentMerchant(isSandbox: boolean) {
  return prisma.squareMerchant.findFirst({
    where: {
      isSandbox,
      isActive: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

/**
 * Get merchant by ID
 */
export async function getMerchantById(id: string) {
  return prisma.squareMerchant.findUnique({
    where: { id },
  });
}

/**
 * Get merchant by Square merchant ID and environment
 */
export async function getMerchantBySquareId(merchantId: string, isSandbox: boolean) {
  return prisma.squareMerchant.findUnique({
    where: {
      merchantId_isSandbox: {
        merchantId,
        isSandbox,
      },
    },
  });
}

/**
 * List all merchants for environment
 */
export async function listMerchants(isSandbox?: boolean) {
  return prisma.squareMerchant.findMany({
    where: isSandbox !== undefined ? { isSandbox } : undefined,
    orderBy: { businessName: 'asc' },
    select: {
      id: true,
      merchantId: true,
      businessName: true,
      locationId: true,
      isSandbox: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      // Don't select accessToken/refreshToken for listings
    },
  });
}

/**
 * Deactivate a merchant (soft delete)
 */
export async function deactivateMerchant(id: string) {
  return prisma.squareMerchant.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Delete a merchant permanently
 */
export async function deleteMerchant(id: string) {
  return prisma.squareMerchant.delete({
    where: { id },
  });
}

/**
 * Check if token needs refresh (within 24 hours of expiration)
 */
export function tokenNeedsRefresh(expiresAt: Date): boolean {
  const now = new Date();
  const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilExpiry < 24;
}

/**
 * Get merchants that need token refresh
 */
export async function getMerchantsNeedingRefresh() {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() + 24); // Within next 24 hours

  return prisma.squareMerchant.findMany({
    where: {
      isActive: true,
      expiresAt: {
        lte: cutoff,
      },
    },
  });
}

// ============================================================
// OAuth State Management
// ============================================================

/**
 * Store OAuth state for CSRF protection
 */
export async function setOAuthState(state: string, isSandbox: boolean, redirectUrl?: string) {
  // Clean up old states first (older than 10 minutes)
  const tenMinutesAgo = new Date();
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

  await prisma.oAuthState.deleteMany({
    where: {
      createdAt: { lt: tenMinutesAgo },
    },
  });

  return prisma.oAuthState.create({
    data: {
      state,
      isSandbox,
      redirectUrl,
    },
  });
}

/**
 * Get and delete OAuth state (one-time use)
 */
export async function getAndDeleteOAuthState(state: string) {
  const found = await prisma.oAuthState.findUnique({
    where: { state },
  });

  if (found) {
    await prisma.oAuthState.delete({
      where: { state },
    });
  }

  return found;
}
