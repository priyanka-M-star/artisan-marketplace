// ============================================================
// api.js — ALL fetch() calls to your backend live here
// Think of this file as your "remote control" for the backend
// ============================================================

// BASE URL — your backend address
// When you deploy to Render, change this ONE line to your live URL
// Example: const BASE_URL = 'https://artisan-marketplace-api.onrender.com';
const BASE_URL = 'http://localhost:5000';


// ─────────────────────────────────────────────
// HELPER: makeRequest
// Every API call goes through this function.
// It automatically adds your JWT token to headers
// so you don't have to repeat it everywhere.
// ─────────────────────────────────────────────
async function makeRequest(endpoint, options = {}) {

  // Get token from localStorage (saved after login)
  const token = localStorage.getItem('token');

  // Build the full URL → e.g. http://localhost:5000/api/auth/login
  const url = BASE_URL + endpoint;

  // Default headers for every request
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers  // spread any extra headers passed in
  };

  // If we have a token, add it as Authorization header
  // Your backend's protect() middleware checks for this
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  // Make the actual HTTP request
  const response = await fetch(url, {
    ...options,   // method, body etc
    headers       // our headers with token
  });

  // Parse the JSON response from your backend
  const data = await response.json();

  // If the server returned an error (like 400, 401, 403, 500)
  // throw it so we can catch it in the calling code
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}


// ─────────────────────────────────────────────
// AUTH APIs
// ─────────────────────────────────────────────

// Register new user
// endpoint: POST /api/auth/register
// body: { name, email, password, role }
async function apiRegister(name, email, password, role) {
  return await makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role })
  });
}

// Login user
// endpoint: POST /api/auth/login
// body: { email, password }
// returns: { token, user: { id, name, email, role } }
async function apiLogin(email, password) {
  return await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

// Get currently logged-in user's profile
// endpoint: GET /api/auth/me
// requires: Bearer token (added automatically by makeRequest)
async function apiGetMe() {
  return await makeRequest('/api/auth/me');
}


// ─────────────────────────────────────────────
// PRODUCT APIs
// ─────────────────────────────────────────────

// Get all products (public — no login needed)
// endpoint: GET /api/products
// params: search, category, minPrice, maxPrice, page, limit
async function apiGetProducts(params = {}) {
  // Build query string from params object
  // e.g. { category: 'art', page: 1 } → ?category=art&page=1
  const query = new URLSearchParams(params).toString();
  const endpoint = '/api/products' + (query ? '?' + query : '');
  return await makeRequest(endpoint);
}

// Get single product by ID
// endpoint: GET /api/products/:id
async function apiGetProduct(id) {
  return await makeRequest('/api/products/' + id);
}

// Create new product (vendor only)
// endpoint: POST /api/products
// NOTE: uses FormData (not JSON) because images are included
async function apiCreateProduct(formData) {
  const token = localStorage.getItem('token');
  const response = await fetch(BASE_URL + '/api/products', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    // NOTE: Do NOT set Content-Type here — browser sets it
    // automatically with the correct boundary for FormData
    body: formData
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create product');
  return data;
}

// Update product (vendor only, own product)
// endpoint: PUT /api/products/:id
async function apiUpdateProduct(id, updates) {
  return await makeRequest('/api/products/' + id, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Delete product (vendor only, own product)
// endpoint: DELETE /api/products/:id
async function apiDeleteProduct(id) {
  return await makeRequest('/api/products/' + id, {
    method: 'DELETE'
  });
}


// ─────────────────────────────────────────────
// ORDER APIs
// ─────────────────────────────────────────────

// Place a new order (buyer only)
// endpoint: POST /api/orders
// body: { items: [{product, quantity}], shippingAddress, shippingCost }
async function apiPlaceOrder(items, shippingAddress, shippingCost = 0) {
  return await makeRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ items, shippingAddress, shippingCost })
  });
}

// Get buyer's own orders
// endpoint: GET /api/orders
async function apiGetMyOrders() {
  return await makeRequest('/api/orders');
}

// Get all orders for a vendor
// endpoint: GET /api/orders/vendor/all
async function apiGetVendorOrders() {
  return await makeRequest('/api/orders/vendor/all');
}

// Update order status (vendor only)
// endpoint: PATCH /api/orders/:id/status
// status: 'processing' | 'shipped' | 'delivered' | 'cancelled'
async function apiUpdateOrderStatus(orderId, status) {
  return await makeRequest('/api/orders/' + orderId + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// Cancel order (buyer only)
// endpoint: PATCH /api/orders/:id/cancel
// Only pending/processing orders can be cancelled
async function apiCancelOrder(orderId) {
  return await makeRequest('/api/orders/' + orderId + '/cancel', {
    method: 'PATCH'
  });
}


// ─────────────────────────────────────────────
// PAYMENT APIs
// ─────────────────────────────────────────────

// Start Stripe Connect onboarding (vendor only)
// endpoint: POST /api/payments/connect/onboard
// returns: { url } — open this URL in browser for vendor to set up bank
async function apiOnboardVendor() {
  return await makeRequest('/api/payments/connect/onboard', {
    method: 'POST'
  });
}

// Check Stripe Connect status (vendor only)
// endpoint: GET /api/payments/connect/status
// returns: { onboarded: true/false }
async function apiGetStripeStatus() {
  return await makeRequest('/api/payments/connect/status');
}

// Create checkout / payment intent (buyer only)
// endpoint: POST /api/payments/checkout
// returns: { clientSecret, breakdown: { total, commission, vendorGets } }
async function apiCheckout(orderId) {
  return await makeRequest('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  });
}


// ─────────────────────────────────────────────
// PROFILE APIs
// ─────────────────────────────────────────────

// Get user profile
async function apiGetProfile() {
  return await makeRequest('/api/users/me');
}

// Update user profile
async function apiUpdateProfile(updates) {
  return await makeRequest('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Get vendor profile (shop info)
async function apiGetVendorProfile() {
  return await makeRequest('/api/vendors/me');
}

// Update vendor profile
async function apiUpdateVendorProfile(updates) {
  return await makeRequest('/api/vendors/me', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}


// ─────────────────────────────────────────────
// SHIPPING APIs
// ─────────────────────────────────────────────

// Get vendor shipping profile
async function apiGetShipping() {
  return await makeRequest('/api/shipping');
}

// Create/update vendor shipping profile
async function apiSaveShipping(zones, freeShippingAbove) {
  return await makeRequest('/api/shipping', {
    method: 'POST',
    body: JSON.stringify({ zones, freeShippingAbove })
  });
}