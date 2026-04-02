require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const tokenRoutes = require('./routes/tokens');
const adminRoutes = require('./routes/admin');
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ──────────────────────────────────────────
app.use('/api/tokens', tokenRoutes);
app.use('/api/admin', adminRoutes);

// ─── Page Routes ─────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html'));
});

// ─── Start Server ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏦  PrimeBank Token System running at http://localhost:${PORT}`);
  console.log(`🔐  Admin panel at http://localhost:${PORT}/admin`);
  console.log(`📧  Sending emails from: ${process.env.SENDER_EMAIL}\n`);
});