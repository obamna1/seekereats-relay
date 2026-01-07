import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Join Waitlist
router.post("/join", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const existing = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      res
        .status(200)
        .json({ message: "Already on waitlist", status: existing.status });
      return;
    }

    const entry = await prisma.waitlist.create({
      data: { email },
    });

    res
      .status(201)
      .json({ message: "Joined waitlist successfully", status: entry.status });
  } catch (error) {
    console.error("Waitlist join error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check Status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }

    const entry = await prisma.waitlist.findUnique({ where: { email } });

    if (!entry) {
      res.status(200).json({ status: "NOT_FOUND", hasAccess: false });
      return;
    }

    const hasAccess = entry.status === "APPROVED";
    res.status(200).json({ status: entry.status, hasAccess });
  } catch (error) {
    console.error("Waitlist status check error:", error);
    res.status(500).json({ error: "Error checking status" });
  }
});

// Verify Access Code
router.post("/verify-code", async (req: Request, res: Response) => {
  try {
    const { email, code, name, walletAddress } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required" });
      return;
    }

    // 1. Find code
    const accessCode = await prisma.accessCode.findUnique({ where: { code } });

    if (!accessCode || !accessCode.isActive) {
      res.status(400).json({ error: "Invalid or inactive code" });
      return;
    }

    if (accessCode.currentUses >= accessCode.maxUses) {
      res.status(400).json({ error: "Code usage limit reached" });
      return;
    }

    // 2. Update code usage
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { currentUses: { increment: 1 } },
    });

    // 3. Approve on waitlist
    await prisma.waitlist.upsert({
      where: { email },
      update: { status: "APPROVED" },
      create: { email, status: "APPROVED" },
    });

    // 4. Create or update User record in database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        walletAddress: walletAddress || undefined,
      },
      create: {
        email,
        name: name || null,
        walletAddress: walletAddress || null,
      },
    });

    console.log(`✅ User created/updated: ${user.email} (ID: ${user.id})`);

    res.status(200).json({
      success: true,
      message: "Access granted",
      userId: user.id,
    });
  } catch (e) {
    console.error("Verify code error:", e);
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
