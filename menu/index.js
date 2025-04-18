const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cafe-menu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Routes
app.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find({ stock: { $gt: 0 } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.get('/menu/:itemId', async (req, res) => {
  try {
    const item = await MenuItem.findOne({ itemId: req.params.itemId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Initialize some sample menu items
const initializeMenu = async () => {
  const items = [
    { itemId: 'LATTE', name: 'Latte', price: 4.0, stock: 100 },
    { itemId: 'MUFFIN', name: 'Blueberry Muffin', price: 3.0, stock: 50 }
  ];

  for (const item of items) {
    await MenuItem.findOneAndUpdate(
      { itemId: item.itemId },
      item,
      { upsert: true, new: true }
    );
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Menu service running on port ${PORT}`);
  await initializeMenu();
  console.log('Menu items initialized');
}); 