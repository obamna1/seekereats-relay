import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PILOT_RESTAURANTS = [
  {
    name: 'Test Restaurant - Anchorage',
    description: 'Pilot test restaurant for development',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    address: '123 Main St, Anchorage, AK 99501',
    city: 'Anchorage',
    state: 'AK',
    zipCode: '99501',
    phone: '+14134741348', // Your test phone
    cuisine: 'American',
    rating: 4.5,
    deliveryTime: '25-35 min',
    deliveryFee: 0,
    minimumOrder: 15.0,
    operatingHours: {
      mon: '11:00-21:00',
      tue: '11:00-21:00',
      wed: '11:00-21:00',
      thu: '11:00-21:00',
      fri: '11:00-22:00',
      sat: '11:00-22:00',
      sun: '12:00-20:00',
    },
    orderNotes: 'Order for pickup under name SEEKER',
    paymentMethod: 'CARD_ON_FILE',
    paymentNotes: 'Test card on file',
    fulfillmentType: 'PICKUP',
    estimatedPrepTime: 20,
    priority: 1,
    isActive: true,
    menuItems: [
      {
        name: 'Classic Burger',
        price: 12.99,
        category: 'Entrees',
        description: 'Juicy beef patty with all the fixings',
      },
      {
        name: 'Crispy Fries',
        price: 4.99,
        category: 'Sides',
        description: 'Golden crispy fries',
      },
      {
        name: 'Fountain Soda',
        price: 2.49,
        category: 'Drinks',
        description: 'Choice of soda',
      },
      {
        name: 'Chicken Sandwich',
        price: 11.99,
        category: 'Entrees',
        description: 'Grilled chicken with lettuce and tomato',
      },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const restaurant of PILOT_RESTAURANTS) {
    const { menuItems, ...restaurantData } = restaurant;

    try {
      // Upsert restaurant
      const created = await prisma.restaurant.upsert({
        where: { name: restaurantData.name },
        update: restaurantData,
        create: restaurantData,
      });

      console.log(`✅ Created/Updated restaurant: ${created.name}`);

      // Delete existing menu items and recreate
      await prisma.menuItem.deleteMany({ where: { restaurantId: created.id } });

      for (const item of menuItems) {
        await prisma.menuItem.create({
          data: {
            ...item,
            restaurantId: created.id,
            available: true,
          },
        });
      }

      console.log(`   📋 Added ${menuItems.length} menu items`);
    } catch (error) {
      console.error(`❌ Failed to seed restaurant: ${restaurantData.name}`);
      console.error(error);
      throw error;
    }
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
