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
app.use(helmet());
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

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Artisan Marketplace API is running!'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});