import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import { registerSchema, loginSchema } from '../utils/validation';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    console.log('Register request received:', { ...req.body, password: '***' });
    const data = registerSchema.parse(req.body);
    console.log('Validation passed');

    // Check if email exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    console.log('Checked existing users:', existing.rows.length);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'כתובת המייל כבר רשומה במערכת' });
    }

    // Hash password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(data.password, 12);
    console.log('Password hashed');

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, business_name, business_phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.name, data.email, passwordHash, data.businessName || null, data.businessPhone || null]
    );

    const userId = result.rows[0].id;
    console.log('User inserted with ID:', userId);

    // Generate token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Get user data
    const users = await pool.query(
      'SELECT id, name, email, business_name, business_phone, created_at FROM users WHERE id = $1',
      [userId]
    );

    const user = users.rows[0];

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessName: user.business_name,
        businessPhone: user.business_phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const users = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [data.email]
    );

    if (users.rows.length === 0) {
      return res.status(401).json({ message: 'מייל או סיסמה שגויים' });
    }

    const user = users.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'מייל או סיסמה שגויים' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessName: user.business_name,
        businessPhone: user.business_phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const users = await pool.query(
      'SELECT id, name, email, business_name, business_phone, business_logo, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (users.rows.length === 0) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    const user = users.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      businessName: user.business_name,
      businessPhone: user.business_phone,
      businessLogo: user.business_logo,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { name, businessName, businessPhone, businessLogo } = req.body;

    await pool.query(
      `UPDATE users SET name = $1, business_name = $2, business_phone = $3, business_logo = $4 WHERE id = $5`,
      [name, businessName || null, businessPhone || null, businessLogo || null, req.userId]
    );

    const users = await pool.query(
      'SELECT id, name, email, business_name, business_phone, business_logo, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    const user = users.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      businessName: user.business_name,
      businessPhone: user.business_phone,
      businessLogo: user.business_logo,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
