'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Warning Banner */}
      <div className="bg-black text-white py-2 text-center text-sm font-semibold">
        WARNING: This product contains nicotine. Nicotine is an addictive chemical.
      </div>

      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button className="lg:hidden text-white focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="text-2xl font-bold">
                LUMI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/products" className="text-sm hover:underline">
                SHOP
              </Link>
              <Link href="/" className="text-sm hover:underline">
                LOGIN
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Welcome Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
            WELCOME TO LUMIPOUCHES.COM
          </h1>
          <p className="text-center text-lg text-gray-600 mb-12">
            Premium nicotine pouches delivered to your door
          </p>

          <div className="text-center">
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              SHOP NOW
            </Link>
          </div>
        </section>

        {/* Rewards Section */}
        <section className="bg-blue-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">LUMI REWARDS</h2>
            <p className="text-xl mb-6">SCAN THE CAN. COLLECT POINTS. START SHOPPING.</p>
            <Link
              href="/account"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              ENTER CODES
            </Link>
          </div>
        </section>

        {/* More Reasons Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            MORE REASONS TO LOVE LUMI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping to your door</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">Premium nicotine pouches you can trust</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold mb-2">Exclusive Rewards</h3>
              <p className="text-gray-600">Earn points with every purchase</p>
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-4">LUMI GO FOR IT GIVEAWAY</h2>
            <p className="text-xl mb-8">EPISODE 2 IS HERE</p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
              WATCH NOW
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FOLLOW US</h3>
              <div className="space-y-2">
                <a href="#" className="block hover:underline">Facebook</a>
                <a href="#" className="block hover:underline">Instagram</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">LEGAL</h3>
              <div className="space-y-2">
                <Link href="/legal/terms" className="block hover:underline">TERMS OF USE</Link>
                <Link href="/legal/privacy" className="block hover:underline">PRIVACY POLICY</Link>
                <Link href="/legal/returns" className="block hover:underline">RETURN POLICY</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">CONTACT</h3>
              <p className="text-sm text-gray-400">
                MAILING ADDRESS<br />
                Lumi Pouches<br />
                United States
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>©2025 LUMI POUCHES. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
