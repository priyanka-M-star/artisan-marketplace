const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');
connectDB();


const app = express();

const { stripeWebhook } = require('./controllers/paymentController');
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'"],
      "script-src-attr": ["'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:", "blob:", "https:"]
    }
  }
}));
app.use(morgan('dev'));
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const userRoutes    = require('./routes/userRoutes');
const vendorRoutes  = require('./routes/vendorRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');

const orderRoutes    = require('./routes/orderRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

app.use('/api/users',    userRoutes);
app.use('/api/vendors',  vendorRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/products', productRoutes);

app.use('/api/orders',   orderRoutes);
app.use('/api/shipping', shippingRoutes);

const path = require('path');

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Frontend routes - serve HTML pages
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});
app.get('/vendor/stripe/success', (req, res) => {
  res.redirect('/dashboard.html');
});
app.get('/vendor/stripe/refresh', (req, res) => {
  res.redirect('/dashboard.html');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
