import { Router } from 'express';
import pool from '../db/connection';
import { eventSchema } from '../utils/validation';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/events - Get all events for user
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const events = await pool.query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM invites WHERE event_id = e.id) as invite_count
       FROM events e
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [req.userId]
    );

    res.json(events.rows.map(event => ({
      id: event.id,
      userId: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.event_date,
      price: event.price,
      defaultText: event.default_text,
      themeColor: event.theme_color,
      fieldsSchema: event.fields_schema || [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: parseInt(event.invite_count),
    })));
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const events = await pool.query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM invites WHERE event_id = e.id) as invite_count
       FROM events e
       WHERE e.id = $1 AND e.user_id = $2`,
      [req.params.id, req.userId]
    );

    if (events.rows.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    const event = events.rows[0];

    res.json({
      id: event.id,
      userId: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.event_date,
      price: event.price,
      defaultText: event.default_text,
      themeColor: event.theme_color,
      fieldsSchema: event.fields_schema || [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: parseInt(event.invite_count),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events - Create event
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = eventSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO events (user_id, title, description, location, event_date, price, default_text, theme_color, fields_schema)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        req.userId,
        data.title,
        data.description || null,
        data.location || null,
        data.eventDate || null,
        data.price || null,
        data.defaultText || null,
        data.themeColor || '#7C3AED',
        data.fieldsSchema ? JSON.stringify(data.fieldsSchema) : null,
      ]
    );

    const eventId = result.rows[0].id;

    const events = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    const event = events.rows[0];

    res.status(201).json({
      id: event.id,
      userId: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.event_date,
      price: event.price,
      defaultText: event.default_text,
      themeColor: event.theme_color,
      fieldsSchema: event.fields_schema || [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: 0,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = eventSchema.parse(req.body);

    // Check ownership
    const existing = await pool.query(
      'SELECT id FROM events WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    await pool.query(
      `UPDATE events SET
        title = $1, description = $2, location = $3, event_date = $4,
        price = $5, default_text = $6, theme_color = $7, fields_schema = $8
       WHERE id = $9 AND user_id = $10`,
      [
        data.title,
        data.description || null,
        data.location || null,
        data.eventDate || null,
        data.price || null,
        data.defaultText || null,
        data.themeColor || '#7C3AED',
        data.fieldsSchema ? JSON.stringify(data.fieldsSchema) : null,
        req.params.id,
        req.userId,
      ]
    );

    const events = await pool.query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM invites WHERE event_id = e.id) as invite_count
       FROM events e
       WHERE e.id = $1`,
      [req.params.id]
    );

    const event = events.rows[0];

    res.json({
      id: event.id,
      userId: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.event_date,
      price: event.price,
      defaultText: event.default_text,
      themeColor: event.theme_color,
      fieldsSchema: event.fields_schema || [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: parseInt(event.invite_count),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    res.json({ message: 'אירוע נמחק בהצלחה' });
  } catch (error) {
    next(error);
  }
});

export default router;
