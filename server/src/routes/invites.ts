import { Router } from 'express';
import pool from '../db/connection';
import { inviteSchema } from '../utils/validation';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateInviteToken } from '../utils/token';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/events/:eventId/invites - Get all invites for an event
router.get('/event/:eventId', async (req: AuthRequest, res, next) => {
  try {
    // Check event ownership
    const events = await pool.query(
      'SELECT id FROM events WHERE id = $1 AND user_id = $2',
      [req.params.eventId, req.userId]
    );

    if (events.rows.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    const invites = await pool.query(
      `SELECT i.*,
        s.id as submission_id, s.payload, s.signature_png, s.signed_pdf_path, s.submitted_at
       FROM invites i
       LEFT JOIN invite_submissions s ON s.invite_id = i.id
       WHERE i.event_id = $1
       ORDER BY i.created_at DESC`,
      [req.params.eventId]
    );

    res.json(invites.rows.map(invite => ({
      id: invite.id,
      eventId: invite.event_id,
      token: invite.token,
      customerName: invite.customer_name,
      customerPhone: invite.customer_phone,
      customerEmail: invite.customer_email,
      eventType: invite.event_type,
      eventLocation: invite.event_location,
      notes: invite.notes,
      price: invite.price,
      eventDate: invite.event_date,
      status: invite.status,
      createdAt: invite.created_at,
      updatedAt: invite.updated_at,
      submission: invite.submission_id ? {
        id: invite.submission_id,
        payload: invite.payload || {},
        signaturePng: invite.signature_png,
        signedPdfPath: invite.signed_pdf_path,
        submittedAt: invite.submitted_at,
      } : null,
    })));
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:eventId/invites - Create invite
router.post('/event/:eventId', async (req: AuthRequest, res, next) => {
  try {
    // Check event ownership
    const events = await pool.query(
      'SELECT id FROM events WHERE id = $1 AND user_id = $2',
      [req.params.eventId, req.userId]
    );

    if (events.rows.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    const data = inviteSchema.parse(req.body);
    const token = generateInviteToken();

    const result = await pool.query(
      `INSERT INTO invites (event_id, token, customer_name, customer_phone, customer_email, event_type, event_location, notes, price, event_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        req.params.eventId,
        token,
        data.customerName,
        data.customerPhone || null,
        data.customerEmail || null,
        data.eventType || null,
        data.eventLocation || null,
        data.notes || null,
        data.price || null,
        data.eventDate || null,
      ]
    );

    const inviteId = result.rows[0].id;

    const invites = await pool.query(
      'SELECT * FROM invites WHERE id = $1',
      [inviteId]
    );

    const invite = invites.rows[0];

    res.status(201).json({
      id: invite.id,
      eventId: invite.event_id,
      token: invite.token,
      customerName: invite.customer_name,
      customerPhone: invite.customer_phone,
      customerEmail: invite.customer_email,
      eventType: invite.event_type,
      eventLocation: invite.event_location,
      notes: invite.notes,
      price: invite.price,
      eventDate: invite.event_date,
      status: invite.status,
      createdAt: invite.created_at,
      updatedAt: invite.updated_at,
      inviteUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${invite.token}`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invites/:id - Get single invite
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const invites = await pool.query(
      `SELECT i.*, e.user_id
       FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = $1 AND e.user_id = $2`,
      [req.params.id, req.userId]
    );

    if (invites.rows.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const invite = invites.rows[0];

    // Get submission if exists
    const submissions = await pool.query(
      'SELECT * FROM invite_submissions WHERE invite_id = $1',
      [invite.id]
    );

    const submission = submissions.rows[0];

    res.json({
      id: invite.id,
      eventId: invite.event_id,
      token: invite.token,
      customerName: invite.customer_name,
      customerPhone: invite.customer_phone,
      customerEmail: invite.customer_email,
      eventType: invite.event_type,
      eventLocation: invite.event_location,
      notes: invite.notes,
      status: invite.status,
      createdAt: invite.created_at,
      updatedAt: invite.updated_at,
      submission: submission ? {
        id: submission.id,
        payload: submission.payload || {},
        signaturePng: submission.signature_png,
        signedPdfPath: submission.signed_pdf_path,
        submittedAt: submission.submitted_at,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/invites/:id - Update invite
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    // Check ownership
    const existing = await pool.query(
      `SELECT i.id FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = $1 AND e.user_id = $2`,
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const data = inviteSchema.parse(req.body);

    await pool.query(
      `UPDATE invites SET
        customer_name = $1, customer_phone = $2, customer_email = $3, event_type = $4, event_location = $5, notes = $6, price = $7, event_date = $8
       WHERE id = $9`,
      [
        data.customerName,
        data.customerPhone || null,
        data.customerEmail || null,
        data.eventType || null,
        data.eventLocation || null,
        data.notes || null,
        data.price || null,
        data.eventDate || null,
        req.params.id,
      ]
    );

    const invites = await pool.query(
      'SELECT * FROM invites WHERE id = $1',
      [req.params.id]
    );

    const invite = invites.rows[0];

    res.json({
      id: invite.id,
      eventId: invite.event_id,
      token: invite.token,
      customerName: invite.customer_name,
      customerPhone: invite.customer_phone,
      customerEmail: invite.customer_email,
      eventType: invite.event_type,
      eventLocation: invite.event_location,
      notes: invite.notes,
      price: invite.price,
      eventDate: invite.event_date,
      status: invite.status,
      createdAt: invite.created_at,
      updatedAt: invite.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/invites/:id/status - Update status
router.put('/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;

    if (!['CREATED', 'SENT', 'VIEWED', 'SIGNED', 'RETURNED'].includes(status)) {
      return res.status(400).json({ message: 'סטטוס לא תקין' });
    }

    // Check ownership
    const existing = await pool.query(
      `SELECT i.id FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = $1 AND e.user_id = $2`,
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    await pool.query(
      'UPDATE invites SET status = $1 WHERE id = $2',
      [status, req.params.id]
    );

    res.json({ message: 'סטטוס עודכן בהצלחה' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/invites/:id - Delete invite
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    // Check ownership
    const existing = await pool.query(
      `SELECT i.id FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = $1 AND e.user_id = $2`,
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    await pool.query('DELETE FROM invites WHERE id = $1', [req.params.id]);

    res.json({ message: 'הזמנה נמחקה בהצלחה' });
  } catch (error) {
    next(error);
  }
});

export default router;
