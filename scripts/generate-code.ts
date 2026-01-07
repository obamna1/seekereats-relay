import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    const code = process.argv[2];
    const uses = parseInt(process.argv[3] || '1', 10);
    
    if (!code) {
        console.log("Usage: npx ts-node scripts/generate-code.ts <CODE> [MAX_USES]");
        console.log("Example: npx ts-node scripts/generate-code.ts SEEKER_VIP 100");
        return;
    }
    
    console.log(`Generating code: ${code} with ${uses} max uses...`);
    
    const result = await prisma.accessCode.create({
        data: {
            code,
            maxUses: uses,
            isActive: true
        }
    });
    
    console.log('✅ Code generated successfully!');
    console.log(result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
