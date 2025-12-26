'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, type ApiResponse } from '@/lib/api';
import { useCart } from '@/lib/cart';

interface Product {
  id: string;
  name: string;
  sku: string;
  flavorType: string;
  nicotineMg: number;
  netWeightGrams: number;
  caUtlApproved: boolean;
  sensoryCooling: boolean;
  imageUrl?: string | null;
  price: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [flavorFilter, setFlavorFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const { addItem } = useCart();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        search: searchQuery || undefined,
        flavorType: flavorFilter || undefined,
        sort: sortBy,
      });
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error?.message || 'Failed to load products');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [flavorFilter, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  const getFlavorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TOBACCO: 'Tobacco',
      MENTHOL: 'Menthol',
      FRUIT: 'Fruit',
      DESSERT: 'Dessert',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  const isCaRestricted = (product: Product) => {
    return product.flavorType !== 'TOBACCO' || product.sensoryCooling || !product.caUtlApproved;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Lumi</h1>
            <div className="flex items-center space-x-4">
              {typeof window !== 'undefined' && localStorage.getItem('auth_token') ? (
                <>
                  <Link
                    href="/account"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/orders"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Orders
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/cart"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Cart
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Age Warning */}
      <div className="bg-red-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm font-semibold">
          ⚠️ 21+ ONLY - Adult signature required at delivery
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
          
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Flavor:</label>
            <select
              value={flavorFilter}
              onChange={(e) => setFlavorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Flavors</option>
              <option value="TOBACCO">Tobacco</option>
              <option value="MENTHOL">Menthol</option>
              <option value="FRUIT">Fruit</option>
              <option value="DESSERT">Dessert</option>
              <option value="OTHER">Other</option>
            </select>

            <label className="text-sm font-medium text-gray-700 ml-4">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Name (A-Z)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="nicotine-asc">Nicotine (Low to High)</option>
              <option value="nicotine-desc">Nicotine (High to Low)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No products available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                {product.imageUrl && (
                  <div className="mb-4 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                  {isCaRestricted(product) && (
                    <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">
                      CA Restricted
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">SKU:</span> {product.sku}
                  </div>
                  <div>
                    <span className="font-medium">Flavor:</span> {getFlavorTypeLabel(product.flavorType)}
                  </div>
                  <div>
                    <span className="font-medium">Nicotine:</span> {product.nicotineMg}mg
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span> {product.netWeightGrams}g
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
