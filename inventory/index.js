const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cafe-inventory', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Inventory Item Schema
const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 }
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

// Routes
app.post('/inventory/update', async (req, res) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      const inventoryItem = await InventoryItem.findOne({ itemId: item.itemId });
      if (!inventoryItem) {
        return res.status(404).json({ error: `Item ${item.itemId} not found in inventory` });
      }

      const newStock = inventoryItem.stock - item.quantity;
      if (newStock < 0) {
        return res.status(400).json({ error: `Insufficient stock for ${inventoryItem.name}` });
      }

      inventoryItem.stock = newStock;
      await inventoryItem.save();
    }

    res.json({ message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

app.get('/inventory', async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Initialize inventory
const initializeInventory = async () => {
  const items = [
    { itemId: 'LATTE', name: 'Latte', stock: 100 },
    { itemId: 'MUFFIN', name: 'Blueberry Muffin', stock: 50 }
  ];

  for (const item of items) {
    await InventoryItem.findOneAndUpdate(
      { itemId: item.itemId },
      item,
      { upsert: true, new: true }
    );
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Inventory service running on port ${PORT}`);
  await initializeInventory();
  console.log('Inventory initialized');
}); 