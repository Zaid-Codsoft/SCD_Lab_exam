const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Define service URLs
const services = {
  menu: 'http://localhost:3001',
  order: 'http://localhost:3002',
  inventory: 'http://localhost:3003',
  customer: 'http://localhost:3004',
  payment: 'http://localhost:3005'
};

// Proxy middleware for each service
app.use('/menu', createProxyMiddleware({ target: services.menu, changeOrigin: true }));
app.use('/orders', createProxyMiddleware({ target: services.order, changeOrigin: true }));
app.use('/inventory', createProxyMiddleware({ target: services.inventory, changeOrigin: true }));
app.use('/customers', createProxyMiddleware({ target: services.customer, changeOrigin: true }));
app.use('/payments', createProxyMiddleware({ target: services.payment, changeOrigin: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway service is running' });
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
}); 