/**
 * Backend Code Verification Script
 * Verifies backend code structure without requiring server to be running
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
let warnings = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    const result = fn();
    if (result === false) {
      throw new Error('Test returned false');
    }
    passed++;
    log(`✅ PASSED: ${name}`, 'green');
    return true;
  } catch (error) {
    failed++;
    log(`❌ FAILED: ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

function warn(name, message) {
  warnings++;
  log(`⚠️  WARNING: ${name} - ${message}`, 'yellow');
}

// Expected API routes
const expectedRoutes = {
  auth: [
    'login',
    'signup',
    'logout',
    'forgot-password',
    'reset-password',
    'verify-email',
    'resend-verification',
    'refresh',
  ],
  products: ['route', '[id]/route'],
  orders: ['route', '[id]/route'],
  addresses: ['route', 'saved/route', '[id]/route'],
  admin: {
    dashboard: ['stats/route'],
    products: ['route', '[id]/route'],
    orders: ['route', '[id]/route', '[id]/ship/route', '[id]/stake-call/route'],
    users: ['route', '[id]/route', '[id]/reset-password/route'],
    'audit-events': ['route'],
    'files/presign': ['route'],
    'reports/pact': ['route'],
    'test/veriff': ['route'],
  },
  health: ['route', 'detailed/route'],
  'csrf-token': ['route'],
  me: ['route'],
  inngest: ['route'],
  'test-db': ['route'],
};

function checkRouteExists(basePath, routePath) {
  const fullPath = path.join(basePath, routePath + '.ts');
  return fs.existsSync(fullPath);
}

function checkFileHasExport(filePath, exportName) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(`export async function ${exportName}`) ||
         content.includes(`export function ${exportName}`);
}

function main() {
  log('\n🚀 Starting Backend Code Verification', 'blue');
  log('📍 Checking code structure and API routes\n', 'blue');

  const apiDir = path.join(__dirname, '../apps/main/src/app/api');

  // Test 1: API directory exists
  test('API directory exists', () => {
    if (!fs.existsSync(apiDir)) {
      throw new Error(`API directory not found: ${apiDir}`);
    }
    return true;
  });

  // Test 2: Check auth routes
  test('Auth routes exist', () => {
    const authDir = path.join(apiDir, 'auth');
    if (!fs.existsSync(authDir)) {
      throw new Error('Auth directory not found');
    }

    for (const route of expectedRoutes.auth) {
      const routePath = path.join(authDir, route, 'route.ts');
      if (!fs.existsSync(routePath)) {
        throw new Error(`Missing auth route: ${route}`);
      }
      
      // Check for proper exports
      if (route === 'login' || route === 'signup' || route === 'forgot-password' || 
          route === 'reset-password' || route === 'verify-email' || 
          route === 'resend-verification' || route === 'logout' || route === 'refresh') {
        if (!checkFileHasExport(routePath, 'POST')) {
          warn(`Auth route ${route}`, 'Missing POST export');
        }
      }
    }
    return true;
  });

  // Test 3: Check products routes
  test('Products routes exist', () => {
    const productsDir = path.join(apiDir, 'products');
    if (!fs.existsSync(productsDir)) {
      throw new Error('Products directory not found');
    }

    if (!checkRouteExists(productsDir, 'route')) {
      throw new Error('Missing products/route.ts');
    }
    if (!checkRouteExists(productsDir, '[id]/route')) {
      throw new Error('Missing products/[id]/route.ts');
    }
    return true;
  });

  // Test 4: Check orders routes
  test('Orders routes exist', () => {
    const ordersDir = path.join(apiDir, 'orders');
    if (!fs.existsSync(ordersDir)) {
      throw new Error('Orders directory not found');
    }

    if (!checkRouteExists(ordersDir, 'route')) {
      throw new Error('Missing orders/route.ts');
    }
    if (!checkRouteExists(ordersDir, '[id]/route')) {
      throw new Error('Missing orders/[id]/route.ts');
    }
    return true;
  });

  // Test 5: Check addresses routes
  test('Addresses routes exist', () => {
    const addressesDir = path.join(apiDir, 'addresses');
    if (!fs.existsSync(addressesDir)) {
      throw new Error('Addresses directory not found');
    }

    if (!checkRouteExists(addressesDir, 'route')) {
      throw new Error('Missing addresses/route.ts');
    }
    if (!checkRouteExists(addressesDir, 'saved/route')) {
      throw new Error('Missing addresses/saved/route.ts');
    }
    if (!checkRouteExists(addressesDir, '[id]/route')) {
      throw new Error('Missing addresses/[id]/route.ts');
    }
    return true;
  });

  // Test 6: Check admin routes
  test('Admin routes exist', () => {
    const adminDir = path.join(apiDir, 'admin');
    if (!fs.existsSync(adminDir)) {
      throw new Error('Admin directory not found');
    }

    // Check dashboard
    if (!checkRouteExists(adminDir, 'dashboard/stats/route')) {
      throw new Error('Missing admin/dashboard/stats/route.ts');
    }

    // Check products
    if (!checkRouteExists(adminDir, 'products/route')) {
      throw new Error('Missing admin/products/route.ts');
    }
    if (!checkRouteExists(adminDir, 'products/[id]/route')) {
      throw new Error('Missing admin/products/[id]/route.ts');
    }

    // Check orders
    if (!checkRouteExists(adminDir, 'orders/route')) {
      throw new Error('Missing admin/orders/route.ts');
    }
    if (!checkRouteExists(adminDir, 'orders/[id]/route')) {
      throw new Error('Missing admin/orders/[id]/route.ts');
    }
    if (!checkRouteExists(adminDir, 'orders/[id]/ship/route')) {
      throw new Error('Missing admin/orders/[id]/ship/route.ts');
    }
    if (!checkRouteExists(adminDir, 'orders/[id]/stake-call/route')) {
      throw new Error('Missing admin/orders/[id]/stake-call/route.ts');
    }

    // Check users
    if (!checkRouteExists(adminDir, 'users/route')) {
      throw new Error('Missing admin/users/route.ts');
    }
    if (!checkRouteExists(adminDir, 'users/[id]/route')) {
      throw new Error('Missing admin/users/[id]/route.ts');
    }
    if (!checkRouteExists(adminDir, 'users/[id]/reset-password/route')) {
      throw new Error('Missing admin/users/[id]/reset-password/route.ts');
    }

    // Check other admin routes
    if (!checkRouteExists(adminDir, 'audit-events/route')) {
      throw new Error('Missing admin/audit-events/route.ts');
    }
    if (!checkRouteExists(adminDir, 'files/presign/route')) {
      throw new Error('Missing admin/files/presign/route.ts');
    }
    if (!checkRouteExists(adminDir, 'reports/pact/route')) {
      throw new Error('Missing admin/reports/pact/route.ts');
    }
    if (!checkRouteExists(adminDir, 'test/veriff/route')) {
      throw new Error('Missing admin/test/veriff/route.ts');
    }

    return true;
  });

  // Test 7: Check health routes
  test('Health routes exist', () => {
    const healthDir = path.join(apiDir, 'health');
    if (!fs.existsSync(healthDir)) {
      throw new Error('Health directory not found');
    }

    if (!checkRouteExists(healthDir, 'route')) {
      throw new Error('Missing health/route.ts');
    }
    if (!checkRouteExists(healthDir, 'detailed/route')) {
      throw new Error('Missing health/detailed/route.ts');
    }
    return true;
  });

  // Test 8: Check CSRF token route
  test('CSRF token route exists', () => {
    if (!checkRouteExists(apiDir, 'csrf-token/route')) {
      throw new Error('Missing csrf-token/route.ts');
    }
    return true;
  });

  // Test 9: Check me route
  test('Me route exists', () => {
    if (!checkRouteExists(apiDir, 'me/route')) {
      throw new Error('Missing me/route.ts');
    }
    return true;
  });

  // Test 10: Check Inngest route
  test('Inngest route exists', () => {
    if (!checkRouteExists(apiDir, 'inngest/route')) {
      throw new Error('Missing inngest/route.ts');
    }
    return true;
  });

  // Test 11: Check security utilities
  test('Security utilities exist', () => {
    const securityDir = path.join(__dirname, '../apps/main/src/lib/security');
    if (!fs.existsSync(securityDir)) {
      throw new Error('Security directory not found');
    }

    const requiredFiles = ['csrf.ts', 'rate-limit.ts', 'sanitize.ts', 'secure-fetch.ts'];
    for (const file of requiredFiles) {
      const filePath = path.join(securityDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing security file: ${file}`);
      }
    }
    return true;
  });

  // Test 12: Check service files
  test('Service files exist', () => {
    const servicesDir = path.join(__dirname, '../apps/main/src/lib/services');
    if (!fs.existsSync(servicesDir)) {
      throw new Error('Services directory not found');
    }

    const requiredServices = [
      'authorizenet.ts',
      'email.ts',
      'shippo.ts',
      'veriff.ts',
      'tax.ts',
      'monitoring.ts',
    ];

    for (const service of requiredServices) {
      const servicePath = path.join(servicesDir, service);
      if (!fs.existsSync(servicePath)) {
        warn(`Service file ${service}`, 'Not found (may be optional)');
      }
    }
    return true;
  });

  // Test 13: Check order helpers
  test('Order helpers exist', () => {
    const orderHelpersPath = path.join(__dirname, '../apps/main/src/lib/order-helpers.ts');
    if (!fs.existsSync(orderHelpersPath)) {
      throw new Error('Missing order-helpers.ts');
    }
    return true;
  });

  // Test 14: Check API auth utilities
  test('API auth utilities exist', () => {
    const apiAuthPath = path.join(__dirname, '../apps/main/src/lib/api-auth.ts');
    if (!fs.existsSync(apiAuthPath)) {
      throw new Error('Missing api-auth.ts');
    }
    return true;
  });

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Verification Summary', 'blue');
  log('='.repeat(50), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'green');
  log('='.repeat(50), 'blue');

  if (failed > 0) {
    log('\n❌ Code verification failed. Please fix issues before proceeding.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All code verification tests passed!', 'green');
    log('📝 Note: This verifies code structure. Run "pnpm test:backend" with server running for full API tests.', 'yellow');
    process.exit(0);
  }
}

main();
