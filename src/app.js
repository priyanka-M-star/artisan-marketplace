const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');
connectDB();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes   = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes  = require('./routes/adminRoutes');

app.use('/api/users',   userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin',   adminRoutes);


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