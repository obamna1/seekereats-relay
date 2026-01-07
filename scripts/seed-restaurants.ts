import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed the database with initial mock restaurant data
 * Run with: npx ts-node scripts/seed-restaurants.ts
 */
async function main() {
  console.log("🌱 Seeding database with restaurants...\n");

  const restaurants = [
    {
      name: "Pizza House",
      description:
        "Authentic pizzas made with fresh ingredients and traditional recipes",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
      rating: 4.6,
      deliveryTime: "25-35 min",
      deliveryFee: 3.49,
      minimumOrder: 12.0,
      cuisine: "Italian",
      address:
        "Ross School of Business RM0230, 701 Tappan Ave, Ann Arbor, MI 48109",
      phone: "+17349955095",
      priority: 1,
      menuItems: {
        create: [
          {
            name: "Large Pepperoni Pizza",
            description:
              "Classic pepperoni with mozzarella cheese and tangy tomato sauce",
            price: 16.99,
            category: "Pizzas",
            image:
              "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
          },
          {
            name: "Medium Cheese Pizza",
            description: "Simple and delicious mozzarella and tomato sauce",
            price: 12.99,
            category: "Pizzas",
            image:
              "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
          },
          {
            name: "Medium Meat Lovers Pizza",
            description: "Loaded with pepperoni, sausage, bacon, and ham",
            price: 17.99,
            category: "Pizzas",
            image:
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
          },
          {
            name: "Large Veggie Supreme Pizza",
            description:
              "Bell peppers, mushrooms, onions, olives, and tomatoes",
            price: 16.99,
            category: "Pizzas",
            image:
              "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&q=80",
          },
        ],
      },
    },
    {
      name: "Burger King",
      description: "Flame-grilled burgers and classic fast food favorites",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      rating: 4.3,
      deliveryTime: "20-30 min",
      deliveryFee: 2.99,
      minimumOrder: 10.0,
      cuisine: "American",
      address: "123 Main St, Downtown",
      priority: 2,
      menuItems: {
        create: [
          {
            name: "Whopper Meal",
            description: "Flame-grilled beef patty with fries and drink",
            price: 9.99,
            category: "Meals",
            image:
              "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80",
          },
          {
            name: "Chicken Fries",
            description: "Crispy chicken strips shaped like fries",
            price: 4.99,
            category: "Sides",
            image:
              "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80",
          },
          {
            name: "Onion Rings",
            description: "Crispy golden onion rings",
            price: 3.49,
            category: "Sides",
            image:
              "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80",
          },
        ],
      },
    },
    {
      name: "Sushi Bar",
      description: "Fresh sushi and Japanese cuisine",
      image:
        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80",
      rating: 4.7,
      deliveryTime: "30-40 min",
      deliveryFee: 3.99,
      minimumOrder: 15.0,
      cuisine: "Japanese",
      address: "456 Ocean Ave, Waterfront",
      priority: 3,
      menuItems: {
        create: [
          {
            name: "Spicy Tuna Roll",
            description: "Fresh tuna with spicy mayo and cucumber",
            price: 12.99,
            category: "Rolls",
            image:
              "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&q=80",
          },
          {
            name: "California Roll",
            description: "Crab, avocado, and cucumber",
            price: 9.99,
            category: "Rolls",
            image:
              "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80",
          },
          {
            name: "Edamame",
            description: "Steamed soybeans lightly salted",
            price: 5.99,
            category: "Appetizers",
            image:
              "https://images.unsplash.com/photo-1607813011726-d0e2d6da9069?w=600&q=80",
          },
        ],
      },
    },
  ];

  for (const restaurant of restaurants) {
    const existing = await prisma.restaurant.findFirst({
      where: { name: restaurant.name },
    });

    if (existing) {
      console.log(`⏭️  Skipping "${restaurant.name}" (already exists)`);
      continue;
    }

    const created = await prisma.restaurant.create({
      data: restaurant,
      include: { menuItems: true },
    });

    console.log(
      `✅ Created "${created.name}" with ${created.menuItems.length} menu items`
    );
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
