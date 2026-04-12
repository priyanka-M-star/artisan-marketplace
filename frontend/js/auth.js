// ============================================================
// auth.js — Token storage + Route Guards
// Include this file on EVERY page of your frontend
// It checks if the user is logged in and redirects if not
// ============================================================


// ─────────────────────────────────────────────
// TOKEN HELPERS
// After login, we save the JWT token and user
// info in localStorage so we can use it on
// every page without logging in again.
// ─────────────────────────────────────────────

// Save token and user after login
function saveAuth(token, user) {
  localStorage.setItem('token', token);           // JWT token for API calls
  localStorage.setItem('user', JSON.stringify(user)); // user info (name, role etc)
}

// Get the saved token
function getToken() {
  return localStorage.getItem('token');
}

// Get the saved user object
// Returns: { id, name, email, role } or null
function getUser() {
  const user = localStorage.getItem('user');
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
}

// Check if someone is logged in
function isLoggedIn() {
  const token = getToken();
  const user = getUser();
  return !!(token && user); // require both pieces of auth data
}

// Clear everything and go to login page (logout)
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = 'index.html';
}


// ─────────────────────────────────────────────
// ROUTE GUARDS
// These functions protect pages so only the
// right users can access them.
// Call them at the TOP of each page's JS.
// ─────────────────────────────────────────────

// Protect any private page (any logged-in user)
// If not logged in → go to login page
function requireAuth() {
  if (!isLoggedIn()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
}

// Protect buyer-only pages
// If not buyer → redirect to their correct page
function requireBuyer() {
  requireAuth(); // first check if logged in
  const user = getUser();
  if (user && user.role !== 'buyer') {
    // vendor trying to access buyer page → send to dashboard
    window.location.href = 'dashboard.html';
  }
}

// Protect vendor-only pages
// If not vendor → redirect to their correct page
function requireVendor() {
  requireAuth(); // first check if logged in
  const user = getUser();
  if (user && user.role !== 'vendor') {
    // buyer trying to access vendor page → send to marketplace
    window.location.href = 'marketplace.html';
  }
}

// If already logged in, don't show login page again
// Call this on index.html (login page)
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    const user = getUser();
    // Send to the right page based on role
    if (user && user.role === 'vendor') {
      window.location.href = 'dashboard.html';
    } else if (user) {
      window.location.href = 'marketplace.html';
    }
  }
}


// ─────────────────────────────────────────────
// TOAST NOTIFICATIONS
// Show small popup messages at bottom of screen
// type: 'success' (green) or 'error' (red)
// ─────────────────────────────────────────────
function showToast(message, type = 'success') {
  // Remove any existing toast
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  // Create the toast element
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: ${type === 'success' ? '#1A1714' : '#B71C1C'};
    color: white;
    padding: 12px 28px;
    border-radius: 40px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
    white-space: nowrap;
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  // Animate out and remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// ─────────────────────────────────────────────
// LOADING SPINNER
// Show/hide a full-page loading overlay
// ─────────────────────────────────────────────
function showLoading() {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(249,247,244,0.85);
      display: flex; align-items: center; justify-content: center;
      z-index: 8888;
      backdrop-filter: blur(4px);
    `;
    overlay.innerHTML = `
      <div style="text-align:center;">
        <div style="
          width: 36px; height: 36px;
          border: 2px solid rgba(26,23,20,0.1);
          border-top-color: #C4623A;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto 14px;
        "></div>
        <p style="font-size:13px;color:#6B6157;font-family:'DM Sans',sans-serif;">Loading...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}


// ─────────────────────────────────────────────
// SET ACTIVE NAV LINK
// Highlights the current page in the navbar
// Call on each page: setActiveNav('marketplace')
// ─────────────────────────────────────────────
function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) link.classList.add('active');
  });
}
