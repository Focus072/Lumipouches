'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyAddresses, deleteSavedAddress, updateSavedAddress, type ApiResponse } from '@/lib/api';

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPoBox: boolean;
  isDefault: boolean;
  createdAt: string;
}

export default function SavedAddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const loadAddresses = async () => {
      try {
        const response = await getMyAddresses();
        if (response.success && response.data) {
          setAddresses(response.data);
        } else {
          if (response.error?.code === 'UNAUTHORIZED') {
            router.push('/auth/login');
          } else {
            setError(response.error?.message || 'Failed to load addresses');
          }
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await deleteSavedAddress(id);
      if (response.success) {
        setAddresses(addresses.filter(a => a.id !== id));
      } else {
        alert(response.error?.message || 'Failed to delete address');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await updateSavedAddress(id, { isDefault: true });
      if (response.success) {
        setAddresses(addresses.map(a => ({
          ...a,
          isDefault: a.id === id,
        })));
      } else {
        alert(response.error?.message || 'Failed to set default address');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
            <Link href="/account" className="px-4 py-2 text-gray-700 hover:text-gray-900">
              My Account
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/account" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Account
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Addresses</h1>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="mb-4">
          <Link
            href="/account/addresses/new"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add New Address
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No saved addresses</p>
            <Link
              href="/account/addresses/new"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Address
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded mb-2">
                        Default
                      </span>
                    )}
                    <div className="font-medium text-gray-900">{address.recipientName}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <div>{address.line1}</div>
                  {address.line2 && <div>{address.line2}</div>}
                  <div>
                    {address.city}, {address.state} {address.postalCode}
                  </div>
                  <div>{address.country}</div>
                  <div>{address.phone}</div>
                  {address.isPoBox && (
                    <div className="text-orange-600 font-medium">PO Box Address</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Set as Default
                    </button>
                  )}
                  <Link
                    href={`/account/addresses/${address.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

