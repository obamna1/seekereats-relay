"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Square Web Payments SDK types
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<Payments>;
    };
  }
}

interface Payments {
  card: () => Promise<Card>;
}

interface Card {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => Promise<void>;
}

interface TokenResult {
  status: "OK" | "ERROR";
  token?: string;
  errors?: Array<{ message: string }>;
}

interface CardPaymentProps {
  isSandbox: boolean;
  merchantId?: string;
  onTokenize: (sourceId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

interface SquareConfig {
  applicationId: string;
  locationId: string;
  sdkUrl: string;
}

export default function CardPayment({
  isSandbox,
  merchantId,
  onTokenize,
  onError,
  disabled = false,
}: CardPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [cardReady, setCardReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cardRef = useRef<Card | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);

  // Fetch config and initialize Square
  const initializeSquare = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      // Fetch config from API (includes merchantId for correct location)
      const merchantParam = merchantId ? `&merchantId=${merchantId}` : "";
      const configRes = await fetch(
        `/api/config?sandbox=${isSandbox}${merchantParam}`,
      );
      const configData = await configRes.json();

      if (!configData.success) {
        throw new Error(configData.error);
      }

      const config: SquareConfig = configData.data;

      // Load SDK script if not already loaded
      if (!window.Square) {
        await loadScript(config.sdkUrl);
      }

      if (!window.Square) {
        throw new Error("Square SDK failed to load");
      }

      // Initialize payments
      const payments = await window.Square.payments(
        config.applicationId,
        config.locationId,
      );

      // Create and attach card
      const card = await payments.card();

      if (containerRef.current) {
        await card.attach("#card-container");
        cardRef.current = card;
        setCardReady(true);
      }
    } catch (err) {
      console.error("Square init error:", err);
      onError(
        err instanceof Error ? err.message : "Failed to initialize payment",
      );
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, [isSandbox, merchantId, onError]);

  // Load script helper
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Remove any existing Square script
      const existing = document.querySelector('script[src*="squarecdn.com"]');
      if (existing) {
        existing.remove();
        // Reset Square object
        delete window.Square;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Square SDK"));
      document.body.appendChild(script);
    });
  };

  // Initialize on mount
  useEffect(() => {
    initializeSquare();

    return () => {
      // Cleanup card on unmount
      if (cardRef.current) {
        cardRef.current.destroy().catch(console.error);
        cardRef.current = null;
      }
    };
  }, [initializeSquare]);

  // Handle payment
  const handlePayment = async () => {
    if (!cardRef.current || processing || disabled) return;

    setProcessing(true);
    try {
      const result = await cardRef.current.tokenize();

      if (result.status === "OK" && result.token) {
        onTokenize(result.token);
      } else {
        const errorMsg =
          result.errors?.[0]?.message || "Card tokenization failed";
        onError(errorMsg);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Environment indicator */}
      <div
        className={`text-xs px-2 py-1 rounded inline-block ${
          isSandbox
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {isSandbox ? "🧪 Sandbox Mode" : "💳 Production Mode"}
      </div>

      {/* Card input container - always present for Square SDK attachment */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {loading && (
          <div className="flex items-center justify-center h-12">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">
              Loading payment form...
            </span>
          </div>
        )}
        {/* Container is always rendered, visibility controlled by loading state */}
        <div
          id="card-container"
          ref={containerRef}
          className={loading ? "hidden" : ""}
          style={{ minHeight: "56px" }}
        ></div>
      </div>

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={!cardReady || processing || disabled}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {processing ? "Processing..." : "Pay with Card"}
      </button>

      {/* Sandbox test card hint */}
      {isSandbox && (
        <p className="text-xs text-gray-500 text-center">
          Test card: 4532 0123 4567 8901, any CVV/expiry
        </p>
      )}
    </div>
  );
}
