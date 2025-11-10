const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const postsRouter = require('./routes/posts');

// Initialize Prisma Client
// Uncomment the log option below to see SQL queries in console (useful for demo)
const prisma = new PrismaClient({
  // log: ['query', 'info', 'warn', 'error'],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Make Prisma client available to routes
app.locals.prisma = prisma;

// Routes
app.use('/api/posts', postsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/posts`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
