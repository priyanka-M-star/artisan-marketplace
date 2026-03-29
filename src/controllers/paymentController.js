const stripe = require('../config/stripe');
const Vendor = require('../models/Vendor');
const Order  = require('../models/Order');

const onboardVendor = async (req, res) => {
  try {
    let vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found. Create one first.' });
    if (!vendor.stripeAccountId) {
      const account = await stripe.accounts.create({ type: 'express', email: req.user.email });
      vendor.stripeAccountId = account.id;
      await vendor.save();
    }
    const accountLink = await stripe.accountLinks.create({
      account: vendor.stripeAccountId,
      refresh_url: 'http://localhost:5000/api/payments/connect/onboard',
      return_url:  'http://localhost:5000/api/payments/connect/status',
      type: 'account_onboarding'
    });
    res.json({ success: true, url: accountLink.url });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getConnectStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor || !vendor.stripeAccountId) return res.json({ success: true, onboarded: false });
    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);
    const onboarded = account.payouts_enabled;
    if (onboarded && !vendor.stripeOnboarded) { vendor.stripeOnboarded = true; await vendor.save(); }
    res.json({ success: true, onboarded, stripeAccountId: vendor.stripeAccountId });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const checkout = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('items.vendor');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const vendorId = order.items[0].vendor;
    const vendor   = await Vendor.findOne({ user: vendorId });
    if (!vendor?.stripeAccountId) return res.status(400).json({ message: 'Vendor has not completed Stripe setup' });
    const commission   = Number(process.env.PLATFORM_COMMISSION) || 10;
    const amountPaise  = Math.round(order.totalAmount * 100);
    const platformFee  = Math.round(amountPaise * commission / 100);
    const vendorAmount = amountPaise - platformFee;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPaise, currency: 'inr',
      transfer_data: { destination: vendor.stripeAccountId, amount: vendorAmount },
      metadata: { orderId: orderId.toString() }
    });
    await Order.findByIdAndUpdate(orderId, { stripePaymentId: paymentIntent.id });
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      breakdown: {
        total: order.totalAmount,
        commission: order.totalAmount * commission / 100,
        vendorGets: order.totalAmount * (100 - commission) / 100
      }
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const orderId = pi.metadata.orderId;
      if (orderId) await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'processing' });
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      const orderId = pi.metadata.orderId;
      if (orderId) await Order.findByIdAndUpdate(orderId, { status: 'cancelled' });
      break;
    }
    default: console.log(`Unhandled event: ${event.type}`);
  }
  res.json({ received: true });
};

module.exports = { onboardVendor, getConnectStatus, checkout, stripeWebhook };