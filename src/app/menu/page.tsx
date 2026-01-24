"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { MenuItem, MenuResponse } from "@/types";

function formatPrice(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default function MenuPage() {
  const searchParams = useSearchParams();
  const isSandbox = searchParams.get("sandbox") === "true";

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, totalItems } = useCart();

  useEffect(() => {
    async function fetchMenu() {
      try {
        // Pass sandbox param to API
        const response = await fetch(`/api/menu?sandbox=${isSandbox}`);
        if (!response.ok) {
          throw new Error("Failed to fetch menu");
        }
        const data: MenuResponse = await response.json();
        setMenuItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [isSandbox]);

  const handleAddToCart = (
    item: MenuItem,
    variation: MenuItem["variations"][0],
  ) => {
    addItem({
      variationId: variation.id,
      itemId: item.id,
      name: item.name,
      variationName: variation.name,
      priceCents: variation.priceCents,
      currency: variation.currency,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* POC Banner */}
      <div className="bg-blue-600 text-white text-sm py-2 px-4 text-center">
        <Link href="/" className="hover:underline">
          This is a proof of concept demonstrating Square integration. Learn
          more about the architecture.
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 hover:text-gray-700"
          >
            SeekerEats
          </Link>
          <Link
            href="/checkout"
            className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Our Menu</h2>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading menu...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && menuItems.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p>No menu items available.</p>
            <p className="text-sm mt-2">
              Make sure you have items in your Square Catalog.
            </p>
          </div>
        )}

        {!loading && !error && menuItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">🍽️</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    {item.variations.map((variation) => (
                      <div
                        key={variation.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <span className="text-sm text-gray-700">
                            {variation.name}
                          </span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatPrice(
                              variation.priceCents,
                              variation.currency,
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item, variation)}
                          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
