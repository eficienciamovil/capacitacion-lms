require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure required directories exist
['data', 'uploads/videos', 'uploads/presentations', 'certificates'].forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Initialize database and seed admin
initializeDatabase();

// Middleware
app.use(cors({
  origin: isProd ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/users',        require('./src/routes/users'));
app.use('/api/courses',      require('./src/routes/courses'));
app.use('/api/questions',    require('./src/routes/questions'));
app.use('/api/reports',      require('./src/routes/reports'));
app.use('/api/certificates', require('./src/routes/certificates'));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve React frontend in production
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // React Router catch-all (must be last)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🚀 LMS Server running on http://localhost:${PORT}`);
  if (!isProd) {
    console.log(`   Admin: ${process.env.ADMIN_EMAIL || 'admin@lms.com'}`);
    console.log(`   Pass:  ${process.env.ADMIN_PASSWORD || 'admin123'}\n`);
  }
});
