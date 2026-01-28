"use client";

import { useEffect, useState, useCallback } from "react";

interface Merchant {
  merchantId: string;
  businessName: string;
  locationId: string;
  isSandbox: boolean;
  expiresAt: string;
}

interface MerchantSelectorProps {
  isSandbox: boolean;
  selectedMerchantId: string | null;
  onSelect: (merchantId: string | null) => void;
}

export default function MerchantSelector({
  isSandbox,
  selectedMerchantId,
  onSelect,
}: MerchantSelectorProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/merchants/status?sandbox=${isSandbox}&all=true`,
      );
      const data = await res.json();

      if (data.success && data.data?.merchants) {
        setMerchants(data.data.merchants);

        // Auto-select first merchant if none selected
        if (!selectedMerchantId && data.data.merchants.length > 0) {
          onSelect(data.data.merchants[0].merchantId);
        }
      } else {
        setMerchants([]);
      }
    } catch (err) {
      setError("Failed to load merchants");
      console.error("Fetch merchants error:", err);
    } finally {
      setLoading(false);
    }
  }, [isSandbox, selectedMerchantId, onSelect]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // Reset selection when environment changes
  useEffect(() => {
    onSelect(null);
  }, [isSandbox, onSelect]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        Loading restaurants...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 flex items-center gap-2">
        <span>⚠️</span>
        {error}
        <button
          onClick={fetchMerchants}
          className="underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p className="text-yellow-800 font-medium">
          No {isSandbox ? "sandbox" : "production"} restaurants connected
        </p>
        <a
          href={`/api/oauth/authorize?sandbox=${isSandbox}`}
          className="text-yellow-700 underline hover:no-underline text-xs mt-1 block"
        >
          → Connect a restaurant via OAuth
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Restaurant
      </label>
      <select
        value={selectedMerchantId || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {merchants.map((merchant) => (
          <option key={merchant.merchantId} value={merchant.merchantId}>
            {merchant.businessName ||
              `Merchant ${merchant.merchantId.slice(-6)}`}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        {merchants.length} restaurant{merchants.length !== 1 ? "s" : ""}{" "}
        connected ({isSandbox ? "sandbox" : "production"})
      </p>
    </div>
  );
}
