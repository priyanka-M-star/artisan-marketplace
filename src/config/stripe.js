const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY ||
     process.env.STRIPE_SECRET_KEY.includes('YOUR_KEY')) {
  throw new Error('Add your real STRIPE_SECRET_KEY to .env file!');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
module.exports = stripe;