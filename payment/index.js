const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cafe-payments', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  customerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Helper function to generate payment ID
const generatePaymentId = () => {
  return 'PAY-' + Date.now().toString(36).toUpperCase();
};

// Routes
app.post('/payments', async (req, res) => {
  try {
    const { orderId, customerId } = req.body;

    // Verify order exists and get amount
    const orderResponse = await axios.get(`http://localhost:3002/orders/${orderId}`);
    const order = orderResponse.data;

    if (order.customerId !== customerId) {
      return res.status(400).json({ error: 'Order does not belong to this customer' });
    }

    // Create payment
    const payment = new Payment({
      paymentId: generatePaymentId(),
      orderId,
      customerId,
      amount: order.total,
      status: 'completed' // Simulating successful payment
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment successful',
      payment: {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.get('/payments/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
}); 