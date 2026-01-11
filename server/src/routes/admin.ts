import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';

const router = Router();

// Admin credentials
const ADMIN_USER = 'oren';
const ADMIN_PASS = 'oren715599';

// Admin auth middleware
interface AdminRequest extends Request {
  isAdmin?: boolean;
}

const adminAuthMiddleware = (req: AdminRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Admin ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const credentials = authHeader.slice(6); // Remove 'Admin '
  const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':');

  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  req.isAdmin = true;
  next();
};

// POST /api/admin/login - Admin login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success: true, token: credentials });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', adminAuthMiddleware, async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.business_name,
        u.business_phone,
        u.created_at,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT i.id) as invite_count
      FROM users u
      LEFT JOIN events e ON e.user_id = u.id
      LEFT JOIN invites i ON i.event_id = e.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      businessName: user.business_name,
      businessPhone: user.business_phone,
      createdAt: user.created_at,
      eventCount: parseInt(user.event_count) || 0,
      inviteCount: parseInt(user.invite_count) || 0,
    })));
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/login-as/:userId - Login as a specific user
router.post('/login-as/:userId', adminAuthMiddleware, async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const users = await pool.query(
      'SELECT id, name, email, business_name, business_phone, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (users.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users.rows[0];

    // Generate token for this user
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

// DELETE /api/admin/users/:userId - Delete a user
router.delete('/users/:userId', adminAuthMiddleware, async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Delete user (cascade will delete events and invites)
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
