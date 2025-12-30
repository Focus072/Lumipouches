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

// ===== ADMIN API FUNCTIONS =====

// Helper function to get auth token for admin requests
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Admin Orders API
export async function getOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  statuses?: string[];
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.statuses) {
    params.statuses.forEach(s => query.append('statuses', s));
  }
  
  const queryString = query.toString();
  return apiRequest(`/admin/orders${queryString ? `?${queryString}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getOrder(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logStakeCall(orderId: string, notes: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/orders/${orderId}/stake-call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
}

export async function shipOrder(orderId: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/orders/${orderId}/ship`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Admin Products API
export async function getAdminProducts(params?: { page?: number; pageSize?: number; search?: string; active?: boolean }) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.active !== undefined) query.append('active', params.active.toString());
  
  const queryString = query.toString();
  return apiRequest(`/admin/products${queryString ? `?${queryString}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getProduct(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createProduct(data: {
  name: string;
  sku: string;
  flavorType: string;
  nicotineMg: number;
  netWeightGrams: number;
  price: number;
  caUtlApproved?: boolean;
  sensoryCooling?: boolean;
  active?: boolean;
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/admin/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: {
  name?: string;
  sku?: string;
  flavorType?: string;
  nicotineMg?: number;
  netWeightGrams?: number;
  price?: number;
  caUtlApproved?: boolean;
  sensoryCooling?: boolean;
  active?: boolean;
  imageUrl?: string | null;
  imageFileId?: string | null;
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function presignFileUpload(data: { key: string; contentType: string; sizeBytes: number }) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/admin/files/presign', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateProductImage(id: string, data: { imageUrl?: string; imageFileId?: string }) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/products/${id}/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// Admin Users API
export async function getUsers(params?: { page?: number; pageSize?: number; search?: string; role?: string }) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.role) query.append('role', params.role);
  
  const queryString = query.toString();
  return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getUser(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  role: string;
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/admin/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: {
  email?: string;
  role?: string;
  disabled?: boolean;
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function resetUserPassword(id: string, newPassword: string) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });
}

// Dashboard Analytics API
export async function getDashboardStats() {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/admin/dashboard/stats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Reports API
export async function generatePactReport(params: {
  state: string;
  periodStart: string;
  periodEnd: string;
}) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  return apiRequest('/admin/reports/pact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
}

// Audit API
export async function getAuditEvents(params?: { page?: number; pageSize?: number }) {
  const token = await getAuthToken();
  if (!token) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  
  const queryString = query.toString();
  return apiRequest(`/admin/audit-events${queryString ? `?${queryString}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
