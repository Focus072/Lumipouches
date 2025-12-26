'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getMyOrder, type ApiResponse } from '@/lib/api';

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const loadOrder = async () => {
      try {
        const response = await getMyOrder(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          if (response.error?.code === 'UNAUTHORIZED') {
            router.push('/auth/login');
          } else {
            setError(response.error?.message || 'Failed to load order');
          }
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [router, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Lumi
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
            <Link
              href="/orders"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Orders
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
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Lumi
            </Link>
            <Link href="/orders" className="px-4 py-2 text-gray-700 hover:text-gray-900">
              Back to Orders
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Order #{order.id.substring(0, 8)}
        </h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                order.status === 'SHIPPED' ? 'bg-green-100 text-green-800' :
                order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Order Date</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {order.trackingNumber && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="text-sm font-medium text-blue-900 mb-1">Tracking Information</div>
              <div className="text-sm text-blue-700">
                <strong>Carrier:</strong> {order.carrier}
              </div>
              <div className="text-sm text-blue-700">
                <strong>Tracking Number:</strong> {order.trackingNumber}
              </div>
              {order.shippedAt && (
                <div className="text-sm text-blue-700">
                  <strong>Shipped:</strong> {new Date(order.shippedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="text-sm text-gray-600">
              <div>{order.shippingAddress.recipientName}</div>
              <div>{order.shippingAddress.line1}</div>
              {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${Number(order.subtotal || order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${Number(order.taxAmount).toFixed(2)}</span>
              </div>
              {Number(order.exciseTaxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Excise Tax</span>
                  <span className="text-gray-900">${Number(order.exciseTaxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-medium text-gray-900">${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0">
                <div>
                  <div className="font-medium text-gray-900">{item.product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                  <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${Number(item.unitPrice).toFixed(2)} each
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

