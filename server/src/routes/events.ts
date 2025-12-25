import { Router } from 'express';
import pool from '../db/connection';
import { eventSchema } from '../utils/validation';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/events - Get all events for user
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const [events] = await pool.execute<RowDataPacket[]>(
      `SELECT e.*,
        (SELECT COUNT(*) FROM invites WHERE event_id = e.id) as invite_count
       FROM events e
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC`,
      [req.userId]
    );

    res.json(events.map(event => ({
      id: event.id,
      userId: event.user_id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.event_date,
      price: event.price,
      defaultText: event.default_text,
      themeColor: event.theme_color,
      fieldsSchema: event.fields_schema ? (typeof event.fields_schema === 'string' ? JSON.parse(event.fields_schema) : event.fields_schema) : [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: event.invite_count,
    })));
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [events] = await pool.execute<RowDataPacket[]>(
      `SELECT e.*,
        (SELECT COUNT(*) FROM invites WHERE event_id = e.id) as invite_count
       FROM events e
       WHERE e.id = ? AND e.user_id = ?`,
      [req.params.id, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    const event = events[0];

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
      fieldsSchema: event.fields_schema ? (typeof event.fields_schema === 'string' ? JSON.parse(event.fields_schema) : event.fields_schema) : [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: event.invite_count,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events - Create event
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = eventSchema.parse(req.body);

    const [result] = await pool.execute(
      `INSERT INTO events (user_id, title, description, location, event_date, price, default_text, theme_color, fields_schema)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    const eventId = (result as any).insertId;

    const [events] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    const event = events[0];

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
      fieldsSchema: event.fields_schema ? (typeof event.fields_schema === 'string' ? JSON.parse(event.fields_schema) : event.fields_schema) : [],
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
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM events WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    await pool.execute(
      `UPDATE events SET
        title = ?, description = ?, location = ?, event_date = ?,
        price = ?, default_text = ?, theme_color = ?, fields_schema = ?
       WHERE id = ? AND user_id = ?`,
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

    const [events] = await pool.execute<RowDataPacket[]>(
      `SELECT e.*,
        (SELECT COUNT(*) FROM invites WHERE event_id = e.id) as invite_count
       FROM events e
       WHERE e.id = ?`,
      [req.params.id]
    );

    const event = events[0];

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
      fieldsSchema: event.fields_schema ? (typeof event.fields_schema === 'string' ? JSON.parse(event.fields_schema) : event.fields_schema) : [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      inviteCount: event.invite_count,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM events WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    res.json({ message: 'אירוע נמחק בהצלחה' });
  } catch (error) {
    next(error);
  }
});

export default router;
