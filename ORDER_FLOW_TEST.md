# Complete Order Flow Test Guide

This document outlines the end-to-end testing process for the complete order flow from cart to delivery.

## Prerequisites

1. **Database Setup**
   - Ensure database migrations are up to date: `pnpm db:migrate`
   - Verify all required tables exist (users, products, orders, addresses, etc.)

2. **Environment Variables**
   - All required environment variables are set (see `.env.example`)
   - Test payment credentials configured (Authorize.Net sandbox)
   - Email service configured (SendGrid)
   - Shipping service configured (Shippo)
   - Age verification service configured (Veriff)

3. **Test Data**
   - At least one active product in the database
   - Test user account created
   - Test addresses available

## Test Flow Steps

### 1. User Registration & Email Verification

**Steps:**
1. Navigate to `/auth/signup`
2. Fill in email and password (min 8 characters)
3. Submit registration form
4. Check email inbox for verification email
5. Click verification link or navigate to `/auth/verify-email?token=<token>`
6. Verify email is marked as verified in database

**Expected Results:**
- User account created successfully
- Verification email sent
- Email verification link works
- User can log in after verification

**Database Check:**
```sql
SELECT id, email, email_verified, email_verification_token 
FROM users 
WHERE email = '<test_email>';
```

### 2. User Login & Session Management

**Steps:**
1. Navigate to `/auth/login`
2. Enter email and password
3. Submit login form
4. Verify redirect based on role (admin → `/dashboard`, customer → `/account`)
5. Test session timeout (30 minutes of inactivity)
6. Test session refresh functionality

**Expected Results:**
- Login successful
- Session token stored in localStorage
- Correct redirect based on user role
- Session timeout warning appears 5 minutes before expiry
- Session can be extended via "Stay Signed In" button

**API Test:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer <token>"

# Refresh session
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <token>"
```

### 3. Password Reset Flow

**Steps:**
1. Navigate to `/auth/forgot-password`
2. Enter email address
3. Submit form
4. Check email inbox for reset link
5. Click reset link or navigate to `/auth/reset-password?token=<token>`
6. Enter new password (min 8 characters)
7. Confirm password
8. Submit form
9. Verify can log in with new password

**Expected Results:**
- Reset email sent (even if email doesn't exist - security)
- Reset link works
- Password can be reset
- All existing sessions revoked after password reset
- Can log in with new password

**API Test:**
```bash
# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<reset_token>","password":"newpassword123"}'
```

### 4. Product Browsing & Cart

**Steps:**
1. Navigate to `/products`
2. Browse products
3. Add products to cart
4. View cart at `/cart`
5. Verify cart persistence (refresh page)
6. Update quantities
7. Remove items

**Expected Results:**
- Products display correctly
- Cart items persist in localStorage
- Cart calculations correct (subtotal, tax, total)
- Cart updates reflect immediately

**API Test:**
```bash
# Get products
curl -X GET "http://localhost:3000/api/products?sort=name"

# Get single product
curl -X GET "http://localhost:3000/api/products/<product_id>"
```

### 5. Address Management

**Steps:**
1. Navigate to `/account/addresses`
2. Add new shipping address
3. Add new billing address
4. Set default address
5. Edit address
6. Delete address

**Expected Results:**
- Addresses can be created, updated, deleted
- Default address can be set
- Addresses validate correctly (PO Box detection, etc.)

**API Test:**
```bash
# Create address
curl -X POST http://localhost:3000/api/addresses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientName":"John Doe",
    "phone":"555-1234",
    "line1":"123 Main St",
    "city":"Los Angeles",
    "state":"CA",
    "postalCode":"90001",
    "country":"US"
  }'

# Get addresses
curl -X GET http://localhost:3000/api/addresses \
  -H "Authorization: Bearer <token>"
```

### 6. Checkout Process

**Steps:**
1. Navigate to `/checkout` with items in cart
2. Select shipping address
3. Select billing address
4. Enter payment information (test card)
5. Review order summary
6. Submit order

**Expected Results:**
- Checkout page loads with cart items
- Addresses can be selected
- Payment form validates correctly
- Order submission works
- Order created in database with status `PAID` or `BLOCKED`

**API Test:**
```bash
# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId":"<address_id>",
    "billingAddressId":"<address_id>",
    "items":[{"productId":"<product_id>","quantity":1}],
    "customerFirstName":"John",
    "customerLastName":"Doe",
    "customerDateOfBirth":"1990-01-01",
    "isFirstTimeRecipient":true,
    "payment":{
      "cardNumber":"4111111111111111",
      "expirationDate":"12/25",
      "cvv":"123"
    }
  }'
```

### 7. Order Processing (Admin)

**Steps:**
1. Log in as admin
2. Navigate to `/dashboard/orders`
3. View order list
4. Click on order to view details
5. If order is `BLOCKED`, verify compliance reasons
6. If order requires STAKE call, log STAKE call
7. Ship order (if order is `PAID`)

**Expected Results:**
- Orders list displays correctly
- Order details show all information
- Compliance checks are visible
- STAKE calls can be logged
- Shipping process works (payment capture, label generation, status update)

**API Test:**
```bash
# Get orders
curl -X GET "http://localhost:3000/api/admin/orders?status=PAID" \
  -H "Authorization: Bearer <admin_token>"

# Get order details
curl -X GET "http://localhost:3000/api/admin/orders/<order_id>" \
  -H "Authorization: Bearer <admin_token>"

# Ship order
curl -X POST "http://localhost:3000/api/admin/orders/<order_id>/ship" \
  -H "Authorization: Bearer <admin_token>"
```

### 8. Email Notifications

**Steps:**
1. After order creation, check email for order confirmation
2. After order shipping, check email for shipping notification
3. Verify email templates render correctly

**Expected Results:**
- Order confirmation email sent immediately after order creation
- Shipping notification email sent after order ships
- Emails contain correct order information
- Email links work correctly

### 9. Compliance Checks

**Test Scenarios:**

**A. California Flavor Ban:**
- Create order with flavored product shipping to California
- Verify order is blocked with reason `CA_FLAVOR_BAN`

**B. California Sensory Cooling:**
- Create order with sensory cooling product shipping to California
- Verify order is blocked with reason `CA_SENSORY_BAN`

**C. California UTL Approval:**
- Create order with non-UTL approved product shipping to California
- Verify order is blocked with reason `CA_UTL_REQUIRED`

**D. PO Box Detection:**
- Create order shipping to PO Box
- Verify order is blocked with reason `PO_BOX_NOT_ALLOWED`

**E. Age Verification:**
- Create order with age verification
- Verify Veriff integration works
- Verify order blocked if age verification fails

**F. STAKE Act:**
- Create order for first-time California recipient
- Verify STAKE call required
- Log STAKE call as admin
- Verify order can proceed after call logged

### 10. Error Handling

**Test Scenarios:**
1. Invalid payment information → Payment error
2. Expired session → Redirect to login
3. Network error → User-friendly error message
4. Invalid form input → Validation errors
5. Rate limiting → Rate limit error

**Expected Results:**
- All errors display user-friendly messages
- Errors are logged to Sentry (if configured)
- Users can recover from errors

## Database Verification Queries

```sql
-- Check order status
SELECT id, status, total_amount, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check compliance snapshots
SELECT * FROM compliance_snapshots 
WHERE order_id = '<order_id>';

-- Check age verifications
SELECT * FROM age_verifications 
WHERE order_id = '<order_id>';

-- Check payments
SELECT * FROM payments 
WHERE order_id = '<order_id>';

-- Check audit events
SELECT * FROM audit_events 
WHERE entity_type = 'ORDER' 
ORDER BY created_at DESC 
LIMIT 20;
```

## Performance Checks

1. **Page Load Times:**
   - Landing page: < 2s
   - Product listing: < 3s
   - Checkout: < 2s

2. **API Response Times:**
   - Product listing: < 500ms
   - Order creation: < 3s
   - Order shipping: < 5s

3. **Database Queries:**
   - Verify indexes are used
   - Check for N+1 query problems
   - Monitor slow queries

## Security Checks

1. **Authentication:**
   - Verify JWT tokens are validated
   - Check session expiration
   - Verify CSRF protection

2. **Authorization:**
   - Verify admin routes require admin role
   - Check customer data isolation

3. **Input Validation:**
   - Test SQL injection attempts
   - Test XSS attempts
   - Test rate limiting

## Checklist

- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Session timeout works
- [ ] Password reset works
- [ ] Product browsing works
- [ ] Cart functionality works
- [ ] Address management works
- [ ] Checkout process works
- [ ] Payment processing works
- [ ] Order creation works
- [ ] Compliance checks work
- [ ] Age verification works
- [ ] Order shipping works
- [ ] Email notifications work
- [ ] Error handling works
- [ ] All API endpoints work
- [ ] Database queries are optimized
- [ ] Security measures are in place

## Notes

- Use test payment cards (Authorize.Net sandbox)
- Use test email addresses
- Monitor logs for errors
- Check Sentry for error tracking
- Verify all environment variables are set correctly
