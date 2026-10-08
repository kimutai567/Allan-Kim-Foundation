const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 4000;
const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
};

const JWT_SECRET = requireEnv('JWT_SECRET');
const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

const DB_PATH = process.env.DB_FILE || require('path').join(__dirname, 'foundation.db');
const db = new DatabaseSync(DB_PATH);
console.log(`Database: ${DB_PATH}`);
db.exec(`
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, email TEXT UNIQUE, hash TEXT);
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY, title TEXT, summary TEXT, description TEXT,
  icon TEXT DEFAULT '❤️', goal INTEGER DEFAULT 0, raised INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT, amount REAL, currency TEXT DEFAULT 'KES',
  method TEXT, reference TEXT, program_id INTEGER, anonymous INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY, organization TEXT, type TEXT, contact_name TEXT, email TEXT, phone TEXT,
  message TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
`);

if (!db.prepare('SELECT 1 FROM admins LIMIT 1').get()) {
  db.prepare('INSERT INTO admins (email, hash) VALUES (?, ?)').run(ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10));
  console.log(`Seeded admin ${ADMIN_EMAIL}`);
}
if (!db.prepare('SELECT 1 FROM programs LIMIT 1').get()) {
  const ins = db.prepare('INSERT INTO programs (title, summary, description, icon, goal) VALUES (?,?,?,?,?)');
  ins.run('Dignity Packs', 'Sanitary pads for vulnerable girls',
    'Many girls miss school every month because they cannot afford sanitary pads. We provide pads, reusable kits and menstrual health education so no girl falls behind.', '🌸', 500000);
  ins.run('Steps to School', 'Shoes for students without',
    'A pair of shoes protects children on long walks to school and keeps them in class. We supply durable school shoes to students in need.', '👟', 400000);
  ins.run('Abilities Support', 'Support for people living with disabilities',
    'We provide assistive devices, school support and advocacy so people with disabilities can learn, work and live with dignity.', '♿', 800000);
}
const defaultSettings = {
  mpesa_paybill: '0702346235', mpesa_account: 'Allan Kimutai', airtel_number: '0102204825', airtel_name: 'Allan Kimutai',
  bank_name: 'I&M', bank_account_name: 'Allan Kimutai Kemboi', bank_account_number: '0170 96829461 50', bank_branch: '',
  crypto_btc: '1DyF9a4bpAzAhvFetteAU5aTy4PFAQEkiq',
  crypto_eth: '0xe8d0c8741b27aba4c7bc9b78cec6e270d916ff56',
  crypto_eth_network: 'ERC-20',
  crypto_usdt: 'TJqxzvzjJbFJYktYtNY48dXmHxcXAqcktY',
  crypto_usdt_network: 'TRC20',
  usd_kes_rate: '129',
};
const insSet = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(defaultSettings)) insSet.run(k, v);

const previousDefaultSettings = {
  mpesa_paybill: '000000', mpesa_account: 'ALLANKIM', airtel_number: '0700000000', airtel_name: 'Allan Kim Foundation',
  bank_name: 'Your Bank', bank_account_name: 'Allan Kim Foundation', bank_account_number: '0000000000', bank_branch: 'Nairobi',
  crypto_btc: '', crypto_eth: '', crypto_usdt: '', crypto_usdt_network: 'TRC20',
};
const updateDefault = db.prepare('UPDATE settings SET value = ? WHERE key = ? AND value = ?');
for (const [key, previousValue] of Object.entries(previousDefaultSettings)) {
  if (defaultSettings[key] !== previousValue) updateDefault.run(defaultSettings[key], key, previousValue);
}

const getSettings = () => Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map(r => [r.key, r.value]));

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const rateBuckets = new Map();
const limit = (max, windowMs) => (req, res, next) => {
  const key = req.ip + req.path, now = Date.now();
  const hits = (rateBuckets.get(key) || []).filter(t => now - t < windowMs);
  if (hits.length >= max) return res.status(429).json({ error: 'Too many requests, please try later.' });
  hits.push(now); rateBuckets.set(key, hits); next();
};
const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const validEmail = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

const auth = (req, res, next) => {
  try {
    req.admin = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// ---------- Public ----------
app.get('/api/programs', (req, res) =>
  res.json(db.prepare('SELECT * FROM programs WHERE active = 1 ORDER BY id').all()));

app.get('/api/payment-info', (req, res) => res.json(getSettings()));

app.get('/api/stats', (req, res) => {
  const r = db.prepare("SELECT COUNT(*) c, COALESCE(SUM(amount),0) s FROM donations WHERE status='confirmed' AND currency='KES'").get();
  res.json({ donations: r.c, raised: r.s, partners: db.prepare("SELECT COUNT(*) c FROM partners WHERE status='active'").get().c });
});

app.post('/api/donations', limit(10, 60000), (req, res) => {
  const b = req.body || {};
  const amount = Number(b.amount), method = str(b.method, 20);
  if (!(amount > 0) || amount > 1e9) return res.status(400).json({ error: 'Enter a valid amount.' });
  if (!['mpesa', 'airtel', 'bank', 'crypto'].includes(method)) return res.status(400).json({ error: 'Invalid payment method.' });
  const email = str(b.email, 200);
  if (email && !validEmail(email)) return res.status(400).json({ error: 'Invalid email.' });
  const pid = Number(b.program_id) || null;
  const r = db.prepare(`INSERT INTO donations (name, email, phone, amount, currency, method, reference, program_id, anonymous)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(str(b.name, 120), email, str(b.phone, 30), amount,
    method === 'crypto' ? str(b.currency, 10) || 'USDT' : 'KES', method, str(b.reference, 120), pid, b.anonymous ? 1 : 0);
  res.status(201).json({ id: Number(r.lastInsertRowid), message: 'Thank you! We will confirm your donation shortly.' });
});

app.post('/api/partners', limit(5, 60000), (req, res) => {
  const b = req.body || {};
  const org = str(b.organization, 200), email = str(b.email, 200), message = str(b.message, 3000);
  if (!org || !validEmail(email) || !message) return res.status(400).json({ error: 'Organization, valid email and message are required.' });
  db.prepare('INSERT INTO partners (organization, type, contact_name, email, phone, message) VALUES (?,?,?,?,?,?)')
    .run(org, str(b.type, 40), str(b.contact_name, 120), email, str(b.phone, 30), message);
  res.status(201).json({ message: 'Thank you for reaching out. Our partnerships team will contact you.' });
});

app.post('/api/contact', limit(5, 60000), (req, res) => {
  const b = req.body || {};
  if (!str(b.name) || !validEmail(str(b.email)) || !str(b.message, 3000)) return res.status(400).json({ error: 'All fields are required.' });
  db.prepare('INSERT INTO messages (name, email, message) VALUES (?,?,?)').run(str(b.name, 120), str(b.email, 200), str(b.message, 3000));
  res.status(201).json({ message: 'Message sent. Thank you!' });
});

// ---------- Admin ----------
app.post('/api/admin/login', limit(10, 60000), (req, res) => {
  const { email, password } = req.body || {};
  const a = db.prepare('SELECT * FROM admins WHERE email = ?').get(str(email, 200));
  if (!a || !bcrypt.compareSync(String(password || ''), a.hash)) return res.status(401).json({ error: 'Invalid credentials.' });
  res.json({ token: jwt.sign({ id: a.id, email: a.email }, JWT_SECRET, { expiresIn: '8h' }) });
});

app.get('/api/admin/summary', auth, (req, res) => {
  const q = s => db.prepare(s).get();
  res.json({
    confirmed: q("SELECT COUNT(*) c, COALESCE(SUM(amount),0) s FROM donations WHERE status='confirmed' AND currency='KES'"),
    pending: q("SELECT COUNT(*) c FROM donations WHERE status='pending'").c,
    newPartners: q("SELECT COUNT(*) c FROM partners WHERE status='new'").c,
    messages: q('SELECT COUNT(*) c FROM messages').c,
    byMethod: db.prepare("SELECT method, COUNT(*) c, SUM(amount) s FROM donations WHERE status='confirmed' GROUP BY method").all(),
  });
});

app.get('/api/admin/donations', auth, (req, res) =>
  res.json(db.prepare(`SELECT d.*, p.title program FROM donations d LEFT JOIN programs p ON p.id = d.program_id ORDER BY d.id DESC`).all()));

app.patch('/api/admin/donations/:id', auth, (req, res) => {
  const status = str(req.body.status, 20);
  if (!['pending', 'confirmed', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const d = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  db.exec('BEGIN');
  db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(status, d.id);
  if (d.program_id && d.currency === 'KES') {
    const delta = (status === 'confirmed' ? d.amount : 0) - (d.status === 'confirmed' ? d.amount : 0);
    if (delta) db.prepare('UPDATE programs SET raised = MAX(0, raised + ?) WHERE id = ?').run(delta, d.program_id);
  }
  db.exec('COMMIT');
  res.json({ ok: true });
});

app.get('/api/admin/partners', auth, (req, res) => res.json(db.prepare('SELECT * FROM partners ORDER BY id DESC').all()));
app.patch('/api/admin/partners/:id', auth, (req, res) => {
  const status = str(req.body.status, 20);
  if (!['new', 'contacted', 'active', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE partners SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/messages', auth, (req, res) => res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all()));

app.get('/api/admin/programs', auth, (req, res) => res.json(db.prepare('SELECT * FROM programs ORDER BY id').all()));
app.post('/api/admin/programs', auth, (req, res) => {
  const b = req.body || {};
  if (!str(b.title)) return res.status(400).json({ error: 'Title required' });
  const r = db.prepare('INSERT INTO programs (title, summary, description, icon, goal) VALUES (?,?,?,?,?)')
    .run(str(b.title, 120), str(b.summary, 200), str(b.description, 3000), str(b.icon, 8) || '❤️', Number(b.goal) || 0);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});
app.put('/api/admin/programs/:id', auth, (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE programs SET title=?, summary=?, description=?, icon=?, goal=?, active=? WHERE id=?')
    .run(str(b.title, 120), str(b.summary, 200), str(b.description, 3000), str(b.icon, 8) || '❤️', Number(b.goal) || 0, b.active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/programs/:id', auth, (req, res) => {
  db.prepare('UPDATE programs SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.put('/api/admin/settings', auth, (req, res) => {
  const up = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const k of Object.keys(defaultSettings)) if (k in (req.body || {})) up.run(k, str(req.body[k], 200));
  res.json(getSettings());
});

app.post('/api/admin/password', auth, (req, res) => {
  const { current, next } = req.body || {};
  const a = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(String(current || ''), a.hash) || String(next || '').length < 8)
    return res.status(400).json({ error: 'Wrong current password or new password under 8 characters.' });
  db.prepare('UPDATE admins SET hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), a.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
