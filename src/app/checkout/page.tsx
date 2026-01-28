"use client";

import { useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CreateOrderResponse, PayOrderResponse } from "@/types";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues
const CardPayment = dynamic(() => import("@/components/CardPayment"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-24">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  ),
});

const MerchantSelector = dynamic(
  () => import("@/components/MerchantSelector"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        Loading...
      </div>
    ),
  },
);

function formatPrice(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSandbox = searchParams.get("sandbox") !== "false"; // Default to sandbox

  const { items, updateQuantity, removeItem, clearCart, totalCents } =
    useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSandbox, setIsSandbox] = useState(initialSandbox);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [orderCurrency, setOrderCurrency] = useState<string>("USD");

  // Memoize merchant selection handler to avoid infinite loops
  const handleMerchantSelect = useCallback((merchantId: string | null) => {
    setSelectedMerchantId(merchantId);
    setOrderId(null); // Reset order when merchant changes
    setError(null);
  }, []);

  // Step 1: Create order with customer info
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const createResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variationId: item.variationId,
            quantity: item.quantity,
          })),
          fulfillment: {
            displayName: name,
            phoneNumber: phone,
          },
          sandbox: isSandbox,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData: CreateOrderResponse = await createResponse.json();
      setOrderId(orderData.orderId);
      setOrderAmount(orderData.totalAmountCents);
      setOrderCurrency(orderData.currency);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Pay with tokenized card
  const handlePayment = async (sourceId: string) => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const payResponse = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          sourceId,
          amountCents: orderAmount,
          currency: orderCurrency,
          sandbox: isSandbox,
        }),
      });

      if (!payResponse.ok) {
        const errorData = await payResponse.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const paymentData: PayOrderResponse = await payResponse.json();
      clearCart();
      router.push(
        `/success?orderId=${orderId}&paymentId=${paymentData.paymentId}&status=${paymentData.status}&sandbox=${isSandbox}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  // Toggle environment (resets order if created)
  const handleToggleEnvironment = () => {
    setIsSandbox(!isSandbox);
    setOrderId(null); // Reset order when switching environments
    setError(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Your cart is empty
        </h1>
        <Link
          href={`/menu?sandbox=${isSandbox}`}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href={`/menu?sandbox=${isSandbox}`}
            className="text-blue-600 hover:underline"
          >
            &larr; Back to Menu
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>

          {/* Environment Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleEnvironment}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isSandbox ? "bg-yellow-500" : "bg-green-500"
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSandbox ? "translate-x-1" : "translate-x-6"
                }`}
              />
            </button>
            <span className="text-xs text-gray-600">
              {isSandbox ? "Sandbox" : "Production"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Order
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.variationId}
                  className="flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.variationName}
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatPrice(item.priceCents, item.currency)} each
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        updateQuantity(item.variationId, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.variationId, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.variationId)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {!orderId ? (
              // Step 1: Customer info form
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pickup Details
                </h2>
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  {/* Restaurant Selector */}
                  <MerchantSelector
                    isSandbox={isSandbox}
                    selectedMerchantId={selectedMerchantId}
                    onSelect={handleMerchantSelect}
                  />

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <span className="text-lg">⚡</span>
                      <span className="font-medium">ASAP Order</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Ready for pickup in approximately 15 minutes
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Order..." : "Continue to Payment"}
                  </button>
                </form>
              </>
            ) : (
              // Step 2: Payment form
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment
                </h2>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Order #{orderId.slice(-8)}
                  </p>
                  <p className="text-lg font-semibold">
                    Total: {formatPrice(orderAmount, orderCurrency)}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                  </div>
                )}

                <CardPayment
                  isSandbox={isSandbox}
                  merchantId={selectedMerchantId || undefined}
                  onTokenize={handlePayment}
                  onError={handlePaymentError}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setOrderId(null)}
                  className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Back to details
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
