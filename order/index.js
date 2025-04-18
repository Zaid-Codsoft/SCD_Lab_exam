const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cafe-orders', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  items: [{
    itemId: String,
    quantity: Number,
    price: Number
  }],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Helper function to generate order ID
const generateOrderId = () => {
  return 'ORD-' + Date.now().toString(36).toUpperCase();
};

// Routes
app.post('/orders', async (req, res) => {
  try {
    const { customerId, items } = req.body;

    // Validate items with Menu Service
    const menuResponse = await axios.get('http://localhost:3001/menu');
    const menuItems = menuResponse.data;
    const menuMap = new Map(menuItems.map(item => [item.itemId, item]));

    // Calculate total and validate items
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = menuMap.get(item.itemId);
      if (!menuItem) {
        return res.status(400).json({ error: `Item ${item.itemId} not found in menu` });
      }
      if (menuItem.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${menuItem.name}` });
      }
      total += menuItem.price * item.quantity;
      validatedItems.push({
        itemId: item.itemId,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Create order
    const order = new Order({
      orderId: generateOrderId(),
      customerId,
      items: validatedItems,
      total
    });

    await order.save();

    // Update inventory
    await axios.post('http://localhost:3003/inventory/update', {
      items: validatedItems
    });

    // Update customer points
    await axios.post('http://localhost:3004/customers/update-points', {
      customerId,
      points: Math.floor(total)
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
}); 