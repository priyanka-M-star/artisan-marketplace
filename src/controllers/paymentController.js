const stripe = require('../config/stripe');
const Vendor = require('../models/Vendor');
const Order  = require('../models/Order');

const onboardVendor = async (req, res) => {
  try {
    let vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found. Create one first.' });

    // TEST MODE: Skip real Stripe onboarding for testing
    if (process.env.NODE_ENV === 'development' || process.env.STRIPE_TEST_MODE === 'true') {
      if (!vendor.stripeAccountId) {
        vendor.stripeAccountId = 'acct_TEST_' + req.user._id.toString().slice(-10);
        vendor.stripeOnboarded = true;
        await vendor.save();
      }
      return res.json({
        success: true,
        message: 'Test mode: Stripe connected (simulated)',
        stripeAccountId: vendor.stripeAccountId,
        onboarded: true
      });
    }

    if (!vendor.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: req.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: {
          user_id: req.user._id.toString()
        }
      });
      vendor.stripeAccountId = account.id;
      await vendor.save();
    }

    const accountLink = await stripe.accountLinks.create({
      account: vendor.stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/stripe/refresh`,
      return_url:  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard.html`,
      type: 'account_onboarding'
    });

    res.json({ success: true, url: accountLink.url });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getConnectStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor || !vendor.stripeAccountId) return res.json({ success: true, onboarded: false });

    // TEST MODE: Return simulated connected status
    if (process.env.NODE_ENV === 'development' || process.env.STRIPE_TEST_MODE === 'true') {
      return res.json({
        success: true,
        onboarded: true,
        detailsSubmitted: true,
        chargesEnabled: true,
        stripeAccountId: vendor.stripeAccountId,
        testMode: true,
        capabilities: {
          card_payments: 'active',
          transfers: 'active'
        }
      });
    }

    const account = await stripe.accounts.retrieve(vendor.stripeAccountId);

    const onboarded = account.payouts_enabled;
    const detailsSubmitted = account.details_submitted;
    const chargesEnabled = account.charges_enabled;
    const requirements = account.requirements;

    if (onboarded && !vendor.stripeOnboarded) {
      vendor.stripeOnboarded = true;
      await vendor.save();
    }

    res.json({
      success: true,
      onboarded,
      detailsSubmitted,
      chargesEnabled,
      requirements,
      stripeAccountId: vendor.stripeAccountId,
      capabilities: account.capabilities
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const checkout = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const commission = Number(process.env.PLATFORM_COMMISSION) || 10;

    // DEBUG: Log environment variables
    console.log('checkout: NODE_ENV =', process.env.NODE_ENV, ', STRIPE_TEST_MODE =', process.env.STRIPE_TEST_MODE);

    // TEST MODE: Return simulated payment intent for development
    // No real Stripe account needed - works out of the box
    if (process.env.NODE_ENV === 'development' || process.env.STRIPE_TEST_MODE === 'true') {
      console.log('checkout: TEST MODE ACTIVE - skipping Stripe');
      await Order.findByIdAndUpdate(orderId, {
        stripePaymentId: 'pi_test_' + orderId,
        paymentStatus: 'pending'
      });
      return res.json({
        success: true,
        clientSecret: 'pi_test_' + orderId + '_secret',
        breakdown: {
          total: order.totalAmount,
          commission: order.totalAmount * commission / 100,
          vendorGets: order.totalAmount * (100 - commission) / 100
        },
        testMode: true,
        message: 'Test mode: Use "I\'ve Paid" button to complete'
      });
    }
    console.log('checkout: PRODUCTION MODE - using Stripe');

    // PRODUCTION: Real Stripe flow
    const vendorId = order.items[0].product.vendor;
    const vendor = await Vendor.findOne({ user: vendorId });
    if (!vendor?.stripeAccountId) {
      return res.status(400).json({ message: 'Vendor has not completed Stripe setup' });
    }

    const amountPaise = Math.round(order.totalAmount * 100);
    const platformFee = Math.round(amountPaise * commission / 100);
    const vendorAmount = amountPaise - platformFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPaise,
      currency: 'inr',
      payment_method_types: ['card', 'upi'],
      transfer_data: {
        destination: vendor.stripeAccountId,
        amount: vendorAmount
      },
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

// Manual payment confirmation (for test mode / UPI without webhook)
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Order ID required' });

    // In test mode, just mark as paid
    if (process.env.NODE_ENV === 'development' || process.env.STRIPE_TEST_MODE === 'true') {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        status: 'processing'
      });
      return res.json({ success: true, message: 'Payment confirmed (test mode)' });
    }

    // In production, verify with Stripe first
    const order = await Order.findById(orderId);
    if (!order || !order.stripePaymentId) {
      return res.status(404).json({ message: 'Order or payment not found' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);
    if (paymentIntent.status === 'succeeded') {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        status: 'processing'
      });
      return res.json({ success: true, message: 'Payment confirmed' });
    }

    res.json({ success: false, message: 'Payment not yet completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { onboardVendor, getConnectStatus, checkout, stripeWebhook, confirmPayment };