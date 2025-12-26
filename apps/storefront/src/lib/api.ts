/**
 * Storefront API Client
 * Handles requests to the backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001');

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    reasonCodes?: string[];
    reasonCode?: string;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      error: data.error || { code: 'UNKNOWN_ERROR', message: 'Request failed' },
    };
  }

  return data;
}

// Products API
export async function getProducts(params?: {
  search?: string;
  flavorType?: string;
  minNicotine?: number;
  maxNicotine?: number;
  sort?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.flavorType) query.append('flavorType', params.flavorType);
  if (params?.minNicotine !== undefined) query.append('minNicotine', params.minNicotine.toString());
  if (params?.maxNicotine !== undefined) query.append('maxNicotine', params.maxNicotine.toString());
  if (params?.sort) query.append('sort', params.sort);
  
  const queryString = query.toString();
  return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
}

// Orders API
export async function createOrder(orderData: {
  shippingAddressId: string;
  billingAddressId: string;
  items: Array<{ productId: string; quantity: number }>;
  customerFirstName: string;
  customerLastName: string;
  customerDateOfBirth: string;
  isFirstTimeRecipient: boolean;
  payment: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}) {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// Addresses API
export async function createAddress(addressData: {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPoBox: boolean;
}) {
  return apiRequest<{ id: string }>('/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
}

// Auth API
export async function login(email: string, password: string) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: true };
  
  return apiRequest('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMe() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Customer Orders API
export async function getMyOrders(params?: { page?: number; pageSize?: number }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  
  const queryString = query.toString();
  return apiRequest(`/orders${queryString ? `?${queryString}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyOrder(id: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Saved Addresses API
export async function getMyAddresses() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/addresses', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createSavedAddress(data: {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isPoBox?: boolean;
  isDefault?: boolean;
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/addresses/saved', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateSavedAddress(id: string, data: {
  recipientName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isPoBox?: boolean;
  isDefault?: boolean;
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/addresses/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteSavedAddress(id: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/addresses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

