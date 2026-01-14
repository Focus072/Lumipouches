/**
 * Backend API Testing Script
 * Tests all critical backend endpoints
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
let skipped = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    await fn();
    passed++;
    log(`✅ PASSED: ${name}`, 'green');
    return true;
  } catch (error) {
    failed++;
    log(`❌ FAILED: ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.stack) {
      log(`   ${error.stack.split('\n')[1]}`, 'red');
    }
    return false;
  }
}

async function skip(name, reason) {
  skipped++;
  log(`⏭️  SKIPPED: ${name} - ${reason}`, 'yellow');
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return { data, response };
}

async function main() {
  log('\n🚀 Starting Backend API Tests', 'blue');
  log(`📍 Base URL: ${BASE_URL}\n`, 'blue');

  // Test 1: Health Check
  await test('Health Check', async () => {
    const { data } = await fetchJSON(`${BASE_URL}/api/health`);
    if (data.status !== 'ok' && data.status !== 'healthy') {
      throw new Error(`Expected status 'ok' or 'healthy', got '${data.status}'`);
    }
  });

  // Test 2: Detailed Health Check
  await test('Detailed Health Check', async () => {
    const { data } = await fetchJSON(`${BASE_URL}/api/health/detailed`);
    if (!data.checks || !data.timestamp) {
      throw new Error('Missing required fields in health check response');
    }
  });

  // Test 3: Database Connection
  await test('Database Connection', async () => {
    const { data } = await fetchJSON(`${BASE_URL}/api/test-db`);
    if (!data.success) {
      throw new Error('Database connection failed');
    }
  });

  // Test 4: CSRF Token
  let csrfToken = null;
  await test('CSRF Token Generation', async () => {
    const { data, response } = await fetchJSON(`${BASE_URL}/api/csrf-token`);
    if (!data.success || !data.data?.token) {
      throw new Error('CSRF token not generated');
    }
    csrfToken = data.data.token;
    
    // Check if cookie is set
    const cookies = response.headers.get('set-cookie');
    if (!cookies || !cookies.includes('csrf-token')) {
      throw new Error('CSRF cookie not set');
    }
  });

  // Test 5: Products List (Public)
  let productId = null;
  await test('Get Products (Public)', async () => {
    const { data } = await fetchJSON(`${BASE_URL}/api/products`);
    if (!Array.isArray(data)) {
      throw new Error('Products should be an array');
    }
    if (data.length > 0) {
      productId = data[0].id;
    }
  });

  // Test 6: Get Product by ID (if products exist)
  if (productId) {
    await test('Get Product by ID', async () => {
      const { data } = await fetchJSON(`${BASE_URL}/api/products/${productId}`);
      if (!data.id || data.id !== productId) {
        throw new Error('Product ID mismatch');
      }
    });
  } else {
    await skip('Get Product by ID', 'No products in database');
  }

  // Test 7: Login (with CSRF)
  let authToken = null;
  await test('Login with CSRF', async () => {
    if (!csrfToken) {
      // Get new CSRF token
      const { data } = await fetchJSON(`${BASE_URL}/api/csrf-token`);
      csrfToken = data.data.token;
    }

    const { data } = await fetchJSON(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123',
      }),
    });

    if (!data.success || !data.data?.token) {
      throw new Error('Login failed');
    }
    authToken = data.data.token;
  });

  // Test 8: Get Current User
  await test('Get Current User (/api/me)', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!data.id || !data.email) {
      throw new Error('User data incomplete');
    }
  });

  // Test 9: Admin Dashboard Stats
  await test('Admin Dashboard Stats', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/admin/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!data.success) {
      throw new Error('Failed to get dashboard stats');
    }
  });

  // Test 10: Admin Products List
  await test('Admin Products List', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/admin/products`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!data.success || !Array.isArray(data.data?.items)) {
      throw new Error('Invalid products response');
    }
  });

  // Test 11: Admin Orders List
  await test('Admin Orders List', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!data.success || !Array.isArray(data.data?.items)) {
      throw new Error('Invalid orders response');
    }
  });

  // Test 12: Admin Users List
  await test('Admin Users List', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!data.success || !Array.isArray(data.data?.items)) {
      throw new Error('Invalid users response');
    }
  });

  // Test 13: Audit Events
  await test('Admin Audit Events', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/admin/audit-events`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!data.success || !Array.isArray(data.data?.items)) {
      throw new Error('Invalid audit events response');
    }
  });

  // Test 14: Rate Limiting (should allow first request)
  await test('Rate Limiting - First Request', async () => {
    const { data } = await fetchJSON(`${BASE_URL}/api/csrf-token`);
    if (!data.success) {
      throw new Error('Rate limiting blocked first request');
    }
  });

  // Test 15: Logout
  await test('Logout', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const { data } = await fetchJSON(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    // Logout should succeed even if token is invalid
    if (data.success === false && data.error?.code !== 'UNAUTHORIZED') {
      throw new Error('Unexpected logout error');
    }
  });

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(50), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⏭️  Skipped: ${skipped}`, 'yellow');
  log('='.repeat(50), 'blue');

  if (failed > 0) {
    log('\n❌ Some tests failed. Please fix issues before proceeding.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed! Backend is ready.', 'green');
    process.exit(0);
  }
}

// Handle fetch if not available (Node.js < 18)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
