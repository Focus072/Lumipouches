'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Lumi</h1>
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Lumi</h1>
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      <div>{item.product.nicotineMg}mg nicotine</div>
                      <div>{item.product.netWeightGrams}g</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-1 border border-gray-300 rounded-l-md hover:bg-gray-50"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border-t border-b border-gray-300 text-center text-sm"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-1 border border-gray-300 rounded-r-md hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push('/checkout')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Proceed to Checkout ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
          </button>
        </div>
      </main>
    </div>
  );
}

