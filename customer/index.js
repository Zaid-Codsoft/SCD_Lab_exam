const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cafe-customers', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Customer Schema
const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 }
});

const Customer = mongoose.model('Customer', customerSchema);

// Routes
app.post('/customers', async (req, res) => {
  try {
    const { customerId, name, email } = req.body;
    const customer = new Customer({ customerId, name, email });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.get('/customers/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.customerId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

app.post('/customers/update-points', async (req, res) => {
  try {
    const { customerId, points } = req.body;
    const customer = await Customer.findOne({ customerId });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.points += points;
    await customer.save();

    res.json({ 
      message: 'Points updated successfully',
      customer: {
        customerId: customer.customerId,
        name: customer.name,
        points: customer.points
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update points' });
  }
});

// Initialize sample customer
const initializeCustomer = async () => {
  const customer = {
    customerId: 'CUST001',
    name: 'Emma',
    email: 'emma@example.com',
    points: 10
  };

  await Customer.findOneAndUpdate(
    { customerId: customer.customerId },
    customer,
    { upsert: true, new: true }
  );
};

// Start server
app.listen(PORT, async () => {
  console.log(`Customer service running on port ${PORT}`);
  await initializeCustomer();
  console.log('Sample customer initialized');
}); 