import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">SeekerEats</h1>
          <p className="text-sm text-gray-500">Square Integration Proof of Concept</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Restaurant Ordering Platform - POC
          </h2>
          <p className="text-gray-600 mb-6">
            This proof of concept demonstrates how SeekerEats can integrate with restaurants
            that use Square as their point-of-sale system. We pull their menu directly from
            Square&apos;s Catalog API and create orders through Square&apos;s Orders API.
          </p>
          <Link
            href="/menu"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Demo Menu
          </Link>
        </section>

        {/* Current Implementation */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">CURRENT</span>
            How This POC Works
          </h3>
          <div className="space-y-4 text-gray-600">
            <p>
              Right now, we&apos;re using a <strong>Seller Access Token</strong> from a test restaurant
              account. This token gives us direct access to that restaurant&apos;s Square data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Catalog API</strong> - Fetches the restaurant&apos;s menu items, prices, and images</li>
              <li><strong>Orders API</strong> - Creates orders in the restaurant&apos;s Square Dashboard</li>
              <li><strong>Payments API</strong> - Processes payments to the restaurant&apos;s account</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-4 mt-4 font-mono text-sm">
              <p className="text-gray-500 mb-2"># Environment Configuration</p>
              <p>SQUARE_SELLER_ACCESS_TOKEN=&lt;restaurant&apos;s token&gt;</p>
              <p>SQUARE_LOCATION_ID=&lt;restaurant&apos;s location&gt;</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              This proves we can display a real Square merchant&apos;s catalog and create real orders
              in their system.
            </p>
          </div>
        </section>

        {/* OAuth Flow - Future */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">NEXT STEP</span>
            OAuth Integration for Automatic Onboarding
          </h3>
          <div className="space-y-4 text-gray-600">
            <p>
              With <strong>Square OAuth</strong>, any restaurant using Square can connect to SeekerEats
              with just a few clicks - no manual token sharing required.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">The OAuth Flow:</h4>
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong>Restaurant clicks &quot;Connect with Square&quot;</strong>
                  <p className="ml-6 text-sm">They&apos;re redirected to Square&apos;s authorization page</p>
                </li>
                <li>
                  <strong>Restaurant logs into their Square account</strong>
                  <p className="ml-6 text-sm">Square shows what permissions SeekerEats is requesting</p>
                </li>
                <li>
                  <strong>Restaurant approves the connection</strong>
                  <p className="ml-6 text-sm">Square redirects back to SeekerEats with an authorization code</p>
                </li>
                <li>
                  <strong>SeekerEats exchanges the code for access tokens</strong>
                  <p className="ml-6 text-sm">We securely store their tokens and can now access their catalog</p>
                </li>
              </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Benefits for Restaurants</h4>
                <ul className="text-sm space-y-1 text-green-700">
                  <li>- One-click onboarding</li>
                  <li>- No technical setup required</li>
                  <li>- Menu syncs automatically from Square</li>
                  <li>- Orders appear in their existing Square Dashboard</li>
                  <li>- Revoke access anytime from Square</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Benefits for SeekerEats</h4>
                <ul className="text-sm space-y-1 text-blue-700">
                  <li>- Scalable onboarding process</li>
                  <li>- No manual token management</li>
                  <li>- Automatic token refresh handling</li>
                  <li>- Access to any Square merchant</li>
                  <li>- Enterprise-grade security</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Architecture</h3>
          <div className="space-y-4 text-gray-600">
            {/* Visual Flow Diagram */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center min-w-[140px]">
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium">Customer</div>
                <div className="text-xs text-gray-500">Browser</div>
              </div>
              <div className="text-gray-400 text-2xl hidden md:block">→</div>
              <div className="text-gray-400 text-2xl md:hidden">↓</div>
              <div className="bg-blue-100 rounded-lg p-4 text-center min-w-[140px]">
                <div className="text-2xl mb-2">🍽️</div>
                <div className="font-medium">SeekerEats</div>
                <div className="text-xs text-gray-500">Next.js App</div>
              </div>
              <div className="text-gray-400 text-2xl hidden md:block">→</div>
              <div className="text-gray-400 text-2xl md:hidden">↓</div>
              <div className="bg-green-100 rounded-lg p-4 text-center min-w-[140px]">
                <div className="text-2xl mb-2">🟦</div>
                <div className="font-medium">Square API</div>
                <div className="text-xs text-gray-500">Restaurant Data</div>
              </div>
            </div>

            {/* Flow Steps */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Request Flow:</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>Customer visits menu page</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>SeekerEats calls Square Catalog API <span className="text-gray-500">(using seller token)</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  <span>Square returns restaurant&apos;s menu items</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                  <span>Customer places order</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span>
                  <span>SeekerEats creates order via Square Orders API</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">6</span>
                  <span>Order appears in restaurant&apos;s Square Dashboard</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              The key insight: by using the restaurant&apos;s access token, all API calls are made
              on behalf of that merchant. Their catalog, their orders, their payments.
            </p>
          </div>
        </section>

        {/* What This Proves */}
        <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6">
          <h3 className="text-xl font-semibold text-green-900 mb-4">What This POC Proves</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">1.</span>
              <div>
                <h4 className="font-medium text-green-900">Real Menu Integration</h4>
                <p className="text-sm text-green-700">We can pull and display any Square merchant&apos;s catalog</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">2.</span>
              <div>
                <h4 className="font-medium text-green-900">Real Order Creation</h4>
                <p className="text-sm text-green-700">Orders appear in the restaurant&apos;s Square Dashboard</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">3.</span>
              <div>
                <h4 className="font-medium text-green-900">Payment Processing</h4>
                <p className="text-sm text-green-700">Payments go directly to the merchant&apos;s account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">4.</span>
              <div>
                <h4 className="font-medium text-green-900">Scalability Path</h4>
                <p className="text-sm text-green-700">OAuth enables self-service restaurant onboarding</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-4">
          <Link
            href="/menu"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Try the Demo
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            Browse the test restaurant&apos;s menu and place a test order
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>SeekerEats - Square Integration POC</p>
          <p className="mt-1">Built with Next.js + Square SDK</p>
        </div>
      </footer>
    </div>
  );
}
