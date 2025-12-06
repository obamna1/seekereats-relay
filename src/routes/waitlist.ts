import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Simple file-based storage for waitlist emails
const WAITLIST_FILE = path.join(__dirname, '../../data/waitlist.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize waitlist file if it doesn't exist
if (!fs.existsSync(WAITLIST_FILE)) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify({ emails: [] }, null, 2));
}

interface WaitlistEntry {
  email: string;
  timestamp: string;
  source: string;
}

interface WaitlistData {
  emails: WaitlistEntry[];
}

// Helper to read waitlist
function readWaitlist(): WaitlistData {
  try {
    const data = fs.readFileSync(WAITLIST_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading waitlist:', error);
    return { emails: [] };
  }
}

// Helper to write waitlist
function writeWaitlist(data: WaitlistData): void {
  try {
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing waitlist:', error);
    throw error;
  }
}

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

    // Read current waitlist
    const waitlist = readWaitlist();

    // Check if email already exists
    const exists = waitlist.emails.some((entry) => entry.email === normalizedEmail);
    if (exists) {
      return res.status(200).json({
        success: true,
        message: 'You are already on the waitlist!',
        alreadyExists: true,
      });
    }

    // Add to waitlist
    const newEntry: WaitlistEntry = {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
      source: 'mobile-app',
    };

    waitlist.emails.push(newEntry);
    writeWaitlist(waitlist);

    console.log(`✅ New waitlist signup: ${normalizedEmail}`);

    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position: waitlist.emails.length,
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
router.get('/count', (req: Request, res: Response) => {
  try {
    const waitlist = readWaitlist();
    return res.status(200).json({
      success: true,
      count: waitlist.emails.length,
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
router.get('/', (req: Request, res: Response) => {
  try {
    // Check for simple admin secret in headers
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const waitlist = readWaitlist();
    return res.status(200).json({
      success: true,
      count: waitlist.emails.length,
      emails: waitlist.emails,
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
