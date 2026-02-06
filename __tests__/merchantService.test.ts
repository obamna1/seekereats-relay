/**
 * Tests for Square OAuth Merchant Service
 *
 * CRITICAL: Verifies that OAuth tokens are always persisted in PostgreSQL
 * and never lost. Restaurants should NEVER need to re-authenticate.
 */

import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    squareMerchant: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    oAuthState: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

// Import after mocking
import {
  storeMerchantTokens,
  getCurrentMerchant,
  getMerchantById,
  getMerchantBySquareId,
  listMerchants,
  deactivateMerchant,
  deleteMerchant,
  tokenNeedsRefresh,
  getMerchantsNeedingRefresh,
  setOAuthState,
  getAndDeleteOAuthState,
} from '../src/services/merchantService';

describe('MerchantService', () => {
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('storeMerchantTokens', () => {
    it('should upsert merchant tokens to PostgreSQL', async () => {
      const tokens = {
        merchantId: 'test-merchant-123',
        accessToken: 'access-token-abc',
        refreshToken: 'refresh-token-xyz',
        expiresAt: new Date('2026-03-06'),
        businessName: 'Test Restaurant',
        locationId: 'location-456',
        isSandbox: false,
      };

      prisma.squareMerchant.upsert.mockResolvedValue({
        id: 'db-id-1',
        ...tokens,
        isActive: true,
      });

      const result = await storeMerchantTokens(tokens);

      expect(prisma.squareMerchant.upsert).toHaveBeenCalledWith({
        where: {
          merchantId_isSandbox: {
            merchantId: 'test-merchant-123',
            isSandbox: false,
          },
        },
        update: expect.objectContaining({
          accessToken: 'access-token-abc',
          refreshToken: 'refresh-token-xyz',
          isActive: true,
        }),
        create: expect.objectContaining({
          merchantId: 'test-merchant-123',
          accessToken: 'access-token-abc',
          isActive: true,
        }),
      });

      expect(result.accessToken).toBe('access-token-abc');
    });

    it('should update existing merchant on re-authentication', async () => {
      const tokens = {
        merchantId: 'existing-merchant',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date('2026-04-01'),
        isSandbox: false,
      };

      prisma.squareMerchant.upsert.mockResolvedValue({
        id: 'existing-db-id',
        ...tokens,
        isActive: true,
      });

      await storeMerchantTokens(tokens);

      // Verify upsert was called (not create)
      expect(prisma.squareMerchant.upsert).toHaveBeenCalled();
    });
  });

  describe('getCurrentMerchant', () => {
    it('should return first active merchant for production', async () => {
      const mockMerchant = {
        id: 'db-id-1',
        merchantId: 'merchant-123',
        accessToken: 'token-abc',
        businessName: 'Test Restaurant',
        isSandbox: false,
        isActive: true,
      };

      prisma.squareMerchant.findFirst.mockResolvedValue(mockMerchant);

      const result = await getCurrentMerchant(false);

      expect(prisma.squareMerchant.findFirst).toHaveBeenCalledWith({
        where: { isSandbox: false, isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result?.merchantId).toBe('merchant-123');
    });

    it('should return null when no merchants connected', async () => {
      prisma.squareMerchant.findFirst.mockResolvedValue(null);

      const result = await getCurrentMerchant(false);

      expect(result).toBeNull();
    });
  });

  describe('getMerchantBySquareId', () => {
    it('should find merchant by Square ID and environment', async () => {
      const mockMerchant = {
        id: 'db-id',
        merchantId: 'square-id-123',
        accessToken: 'token',
        isSandbox: false,
      };

      prisma.squareMerchant.findUnique.mockResolvedValue(mockMerchant);

      const result = await getMerchantBySquareId('square-id-123', false);

      expect(prisma.squareMerchant.findUnique).toHaveBeenCalledWith({
        where: {
          merchantId_isSandbox: {
            merchantId: 'square-id-123',
            isSandbox: false,
          },
        },
      });
      expect(result?.merchantId).toBe('square-id-123');
    });
  });

  describe('listMerchants', () => {
    it('should list all merchants for environment', async () => {
      const mockMerchants = [
        { merchantId: 'merchant-1', businessName: 'Restaurant A' },
        { merchantId: 'merchant-2', businessName: 'Restaurant B' },
      ];

      prisma.squareMerchant.findMany.mockResolvedValue(mockMerchants);

      const result = await listMerchants(false);

      expect(prisma.squareMerchant.findMany).toHaveBeenCalledWith({
        where: { isSandbox: false },
        orderBy: { businessName: 'asc' },
        select: expect.objectContaining({
          merchantId: true,
          businessName: true,
          // Should NOT include accessToken for security
        }),
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('tokenNeedsRefresh', () => {
    it('should return true if token expires within 24 hours', () => {
      const expiringSoon = new Date();
      expiringSoon.setHours(expiringSoon.getHours() + 12);

      expect(tokenNeedsRefresh(expiringSoon)).toBe(true);
    });

    it('should return false if token has more than 24 hours', () => {
      const expiresLater = new Date();
      expiresLater.setHours(expiresLater.getHours() + 48);

      expect(tokenNeedsRefresh(expiresLater)).toBe(false);
    });
  });

  describe('deactivateMerchant', () => {
    it('should soft delete merchant (not remove from DB)', async () => {
      prisma.squareMerchant.update.mockResolvedValue({
        id: 'db-id',
        isActive: false,
      });

      await deactivateMerchant('db-id');

      expect(prisma.squareMerchant.update).toHaveBeenCalledWith({
        where: { id: 'db-id' },
        data: { isActive: false },
      });
    });

    it('should preserve tokens after deactivation for potential reactivation', async () => {
      // Tokens should still be in DB after deactivation
      // This is important - we don't want restaurants to have to re-auth
      prisma.squareMerchant.update.mockResolvedValue({
        id: 'db-id',
        accessToken: 'still-here',
        isActive: false,
      });

      const result = await deactivateMerchant('db-id');

      // Verify we didn't call delete
      expect(prisma.squareMerchant.delete).not.toHaveBeenCalled();
    });
  });
});

describe('OAuthState', () => {
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('setOAuthState', () => {
    it('should store state for CSRF protection', async () => {
      prisma.oAuthState.deleteMany.mockResolvedValue({ count: 0 });
      prisma.oAuthState.create.mockResolvedValue({
        id: 'state-id',
        state: 'random-state-123',
        isSandbox: false,
      });

      await setOAuthState('random-state-123', false, 'https://redirect.url');

      expect(prisma.oAuthState.create).toHaveBeenCalledWith({
        data: {
          state: 'random-state-123',
          isSandbox: false,
          redirectUrl: 'https://redirect.url',
        },
      });
    });

    it('should clean up old states (older than 10 minutes)', async () => {
      prisma.oAuthState.deleteMany.mockResolvedValue({ count: 5 });
      prisma.oAuthState.create.mockResolvedValue({});

      await setOAuthState('new-state', false);

      expect(prisma.oAuthState.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      });
    });
  });

  describe('getAndDeleteOAuthState', () => {
    it('should return and delete state (one-time use)', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue({
        state: 'valid-state',
        isSandbox: false,
      });
      prisma.oAuthState.delete.mockResolvedValue({});

      const result = await getAndDeleteOAuthState('valid-state');

      expect(result?.state).toBe('valid-state');
      expect(prisma.oAuthState.delete).toHaveBeenCalledWith({
        where: { state: 'valid-state' },
      });
    });

    it('should return null for invalid state', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue(null);

      const result = await getAndDeleteOAuthState('invalid-state');

      expect(result).toBeNull();
      expect(prisma.oAuthState.delete).not.toHaveBeenCalled();
    });
  });
});
