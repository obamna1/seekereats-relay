"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ConnectionStatus {
  connected: boolean;
  merchantId?: string;
  businessName?: string;
  isSandbox?: boolean;
}

export default function ConnectPage() {
  const [isSandbox, setIsSandbox] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on mount and when environment changes
  useEffect(() => {
    checkConnectionStatus();
  }, [isSandbox]);

  async function checkConnectionStatus() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/merchants/status?sandbox=${isSandbox}`,
      );
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      } else {
        throw new Error(data.error || "Failed to check status");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check connection",
      );
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function startOAuth() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/oauth/start?sandbox=${isSandbox}`);
      const data = await response.json();
      if (data.success && data.data.authUrl) {
        // Redirect to Square OAuth
        window.location.href = data.data.authUrl;
      } else {
        throw new Error(data.error || "Failed to start OAuth");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start OAuth");
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchants/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandbox: isSandbox }),
      });
      const data = await response.json();
      if (data.success) {
        // Clear status and refresh
        setStatus({ connected: false });
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Connect Square</h1>
          <div></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Environment Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Environment
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setIsSandbox(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                isSandbox
                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-400"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
              }`}
            >
              🧪 Sandbox
            </button>
            <button
              onClick={() => setIsSandbox(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                !isSandbox
                  ? "bg-green-100 text-green-800 border-2 border-green-400"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
              }`}
            >
              🚀 Production
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3 text-center">
            {isSandbox
              ? "Test with sandbox merchant accounts"
              : "Connect real merchant accounts"}
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connection Status
          </h2>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Checking...</p>
            </div>
          ) : status?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-xl">✅</span>
                <span className="font-medium">Connected</span>
              </div>
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="text-gray-600">Merchant:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {status.businessName || status.merchantId}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Environment:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {status.isSandbox ? "Sandbox" : "Production"}
                  </span>
                </p>
              </div>
              <Link
                href="/menu"
                className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Menu →
              </Link>
              <button
                onClick={disconnect}
                className="w-full text-center bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                🔌 Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-xl">⚪</span>
                <span>Not connected</span>
              </div>
              <button
                onClick={startOAuth}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? "Connecting..." : "🔗 Connect with Square"}
              </button>
              <p className="text-xs text-gray-500 text-center">
                You'll be redirected to Square to authorize access
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select your environment (Sandbox or Production)</li>
            <li>Click &quot;Connect with Square&quot;</li>
            <li>Log into your Square account</li>
            <li>Authorize SeekerEats to access your catalog and orders</li>
            <li>You&apos;ll be redirected back here</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
