'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '@/lib/api';
import SessionTimeout from '@/components/SessionTimeout';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await getMe();
      if (!response.success || !response.data) {
        localStorage.removeItem('auth_token');
        router.push('/auth/login');
        return;
      }

      const userRole = response.data.role;
      // Only allow admin roles
      if (userRole !== 'ADMIN' && userRole !== 'FULFILLMENT' && userRole !== 'READ_ONLY') {
        router.push('/account');
        return;
      }

      setUser(response.data);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
      } catch (err) {
        // Ignore errors
      }
    }
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Lumi Admin</h1>
              <div className="flex space-x-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/dashboard/orders" className="text-sm text-gray-600 hover:text-gray-900">
                  Orders
                </Link>
                <Link href="/dashboard/products" className="text-sm text-gray-600 hover:text-gray-900">
                  Products
                </Link>
                <Link href="/dashboard/users" className="text-sm text-gray-600 hover:text-gray-900">
                  Users
                </Link>
                <Link href="/dashboard/reports/pact" className="text-sm text-gray-600 hover:text-gray-900">
                  PACT Reports
                </Link>
                <Link href="/dashboard/audit" className="text-sm text-gray-600 hover:text-gray-900">
                  Audit
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <SessionTimeout onLogout={handleLogout} />
    </div>
  );
}
