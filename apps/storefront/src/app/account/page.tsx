'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout, getMyOrders, type ApiResponse } from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const [userResponse, ordersResponse] = await Promise.all([
          getMe(),
          getMyOrders({ page: 1, pageSize: 5 }),
        ]);

        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        } else {
          localStorage.removeItem('auth_token');
          router.push('/auth/login');
          return;
        }

        if (ordersResponse.success && ordersResponse.data) {
          setOrders(ordersResponse.data.items || []);
        }
      } catch (err) {
        setError('Failed to load account data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Lumi
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
              {orders.length === 0 ? (
                <p className="text-gray-600">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            Order #{order.id.substring(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${Number(order.totalAmount).toFixed(2)}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'SHIPPED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link
                  href="/orders"
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View all orders →
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-900">{user.email}</div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                <Link
                  href="/account/addresses"
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Manage Addresses →
                </Link>
              </div>
              <Link
                href="/account/addresses"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View and manage your saved addresses
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

