import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

// POST /waitlist - Add email to waitlist
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingEntry = await prisma.waitlist.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEntry) {
      const position = await prisma.waitlist.count({
        where: {
          createdAt: {
            lte: existingEntry.createdAt,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'You are already on the waitlist!',
        alreadyExists: true,
        position,
      });
    }

    // Add to waitlist
    const newEntry = await prisma.waitlist.create({
      data: {
        email: normalizedEmail,
        source: 'mobile-app',
      },
    });

    // Get position (count of all entries up to and including this one)
    const position = await prisma.waitlist.count();

    console.log(`✅ New waitlist signup: ${normalizedEmail} (#${position})`);

    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position,
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to join waitlist',
    });
  }
});

// GET /waitlist/count - Get waitlist count (public)
router.get('/count', async (req: Request, res: Response) => {
  try {
    const count = await prisma.waitlist.count();

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get waitlist count',
    });
  }
});

// GET /waitlist - Get all emails (admin only - requires auth)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check for simple admin secret in headers
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const waitlistEntries = await prisma.waitlist.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      count: waitlistEntries.length,
      emails: waitlistEntries,
    });
  } catch (error) {
    console.error('Error getting waitlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get waitlist',
    });
  }
});

export default router;
