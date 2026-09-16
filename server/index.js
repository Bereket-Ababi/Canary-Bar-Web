import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const INFO_FILE = path.join(DATA_DIR, 'restaurant.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');

const PORT = Number(process.env.PORT || 3001);
const SESSION_COOKIE = 'canary_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/** @type {Map<string, { email: string, expires: number }>} */
const sessions = new Map();

const DEFAULT_ADMIN = {
  email: 'admin@canary.local',
  // Default password: CanaryAdmin2026!
  password: 'CanaryAdmin2026!',
};

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function ensureAdmin() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const hash = bcrypt.hashSync(DEFAULT_ADMIN.password, 10);
    writeJson(ADMIN_FILE, { email: DEFAULT_ADMIN.email, passwordHash: hash });
    console.log('\n========================================');
    console.log('  ADMIN LOGIN CREDENTIALS');
    console.log(`  Email:    ${DEFAULT_ADMIN.email}`);
    console.log(`  Password: ${DEFAULT_ADMIN.password}`);
    console.log('========================================\n');
  }
}

function cleanSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expires < now) sessions.delete(token);
  }
}

function requireAuth(req, res, next) {
  cleanSessions();
  const token = req.cookies?.[SESSION_COOKIE];
  const session = token ? sessions.get(token) : null;
  if (!session || session.expires < Date.now()) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }
  req.admin = session;
  next();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `menu-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

ensureDirs();
ensureAdmin();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/menu', (_req, res) => {
  const items = readJson(MENU_FILE, []);
  res.json(items.sort((a, b) => a.sort_order - b.sort_order));
});

app.get('/api/restaurant', (_req, res) => {
  res.json(readJson(INFO_FILE, {}));
});

app.get('/api/auth/me', (req, res) => {
  cleanSessions();
  const token = req.cookies?.[SESSION_COOKIE];
  const session = token ? sessions.get(token) : null;
  if (!session || session.expires < Date.now()) {
    return res.json({ user: null });
  }
  res.json({ user: { id: 'admin', email: session.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const admin = readJson(ADMIN_FILE, null);

  if (!admin || email !== String(admin.email).toLowerCase()) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { email: admin.email, expires: Date.now() + SESSION_TTL_MS });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: SESSION_TTL_MS,
  });
  res.json({ user: { id: 'admin', email: admin.email } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

app.post('/api/menu', requireAuth, (req, res) => {
  const items = readJson(MENU_FILE, []);
  const body = req.body || {};
  const item = {
    id: crypto.randomUUID(),
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    category: String(body.category || 'From the kitchen').trim(),
    price: Number(body.price) || 0,
    image_url: body.image_url || null,
    show_hover_image: Boolean(body.show_hover_image),
    is_available: body.is_available !== false,
    sort_order: Number(body.sort_order) || items.length + 1,
  };

  if (!item.name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  items.push(item);
  writeJson(MENU_FILE, items);
  res.status(201).json(item);
});

app.put('/api/menu/:id', requireAuth, (req, res) => {
  const items = readJson(MENU_FILE, []);
  const index = items.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  const body = req.body || {};
  const updated = {
    ...items[index],
    name: body.name !== undefined ? String(body.name).trim() : items[index].name,
    description: body.description !== undefined ? String(body.description).trim() : items[index].description,
    category: body.category !== undefined ? String(body.category).trim() : items[index].category,
    price: body.price !== undefined ? Number(body.price) || 0 : items[index].price,
    image_url: body.image_url !== undefined ? body.image_url || null : items[index].image_url,
    show_hover_image: body.show_hover_image !== undefined ? Boolean(body.show_hover_image) : items[index].show_hover_image,
    is_available: body.is_available !== undefined ? Boolean(body.is_available) : items[index].is_available,
    sort_order: body.sort_order !== undefined ? Number(body.sort_order) || 0 : items[index].sort_order,
  };

  if (!updated.name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  items[index] = updated;
  writeJson(MENU_FILE, items);
  res.json(updated);
});

app.delete('/api/menu/:id', requireAuth, (req, res) => {
  const items = readJson(MENU_FILE, []);
  const next = items.filter((item) => item.id !== req.params.id);
  if (next.length === items.length) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }
  writeJson(MENU_FILE, next);
  res.json({ ok: true });
});

app.put('/api/restaurant', requireAuth, (req, res) => {
  const current = readJson(INFO_FILE, {});
  const body = req.body || {};
  const updated = {
    id: 1,
    address: body.address !== undefined ? String(body.address) : current.address,
    address_detail: body.address_detail !== undefined ? String(body.address_detail) : current.address_detail,
    hours: body.hours !== undefined ? String(body.hours) : current.hours,
    hours_label: body.hours_label !== undefined ? String(body.hours_label) : current.hours_label,
    phone: body.phone !== undefined ? String(body.phone) : current.phone,
    phone_label: body.phone_label !== undefined ? String(body.phone_label) : current.phone_label,
  };
  writeJson(INFO_FILE, updated);
  res.json(updated);
});

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`Canary admin API running on http://localhost:${PORT}`);
});
