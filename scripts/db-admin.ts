import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Database management utilities
 * Run with: npx ts-node scripts/db-admin.ts <command> [args]
 *
 * Commands:
 *   list-codes           - List all access codes
 *   list-waitlist        - List waitlist entries
 *   approve-email <email>- Approve a user by email
 *   stats                - Show database statistics
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case "list-codes":
      const codes = await prisma.accessCode.findMany({
        orderBy: { createdAt: "desc" },
      });
      console.log("\n📋 Access Codes:\n");
      console.table(
        codes.map((c) => ({
          code: c.code,
          uses: `${c.currentUses}/${c.maxUses}`,
          active: c.isActive ? "✅" : "❌",
          created: c.createdAt.toLocaleDateString(),
        }))
      );
      break;

    case "list-waitlist":
      const waitlist = await prisma.waitlist.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      console.log("\n📋 Waitlist (last 50):\n");
      console.table(
        waitlist.map((w) => ({
          email: w.email,
          status: w.status === "APPROVED" ? "✅ APPROVED" : "⏳ PENDING",
          joined: w.createdAt.toLocaleDateString(),
        }))
      );
      break;

    case "approve-email":
      if (!arg) {
        console.log(
          "Usage: npx ts-node scripts/db-admin.ts approve-email <email>"
        );
        break;
      }
      const updated = await prisma.waitlist.upsert({
        where: { email: arg },
        update: { status: "APPROVED" },
        create: { email: arg, status: "APPROVED" },
      });
      console.log(`✅ Approved: ${updated.email}`);
      break;

    case "stats":
      const [userCount, restaurantCount, orderCount, waitlistCount, codeCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.restaurant.count(),
          prisma.order.count(),
          prisma.waitlist.count(),
          prisma.accessCode.count(),
        ]);
      console.log("\n📊 Database Statistics:\n");
      console.log(`  Users:        ${userCount}`);
      console.log(`  Restaurants:  ${restaurantCount}`);
      console.log(`  Orders:       ${orderCount}`);
      console.log(`  Waitlist:     ${waitlistCount}`);
      console.log(`  Access Codes: ${codeCount}`);
      break;

    default:
      console.log(`
📦 SeekerEats Database Admin

Commands:
  npx ts-node scripts/db-admin.ts list-codes          List all access codes
  npx ts-node scripts/db-admin.ts list-waitlist       List waitlist entries
  npx ts-node scripts/db-admin.ts approve-email <email>  Approve a user
  npx ts-node scripts/db-admin.ts stats               Show statistics
      `);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
