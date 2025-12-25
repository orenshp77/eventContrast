import { Router } from 'express';
import pool from '../db/connection';
import { inviteSchema } from '../utils/validation';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateInviteToken } from '../utils/token';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/events/:eventId/invites - Get all invites for an event
router.get('/event/:eventId', async (req: AuthRequest, res, next) => {
  try {
    // Check event ownership
    const [events] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM events WHERE id = ? AND user_id = ?',
      [req.params.eventId, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    const [invites] = await pool.execute<RowDataPacket[]>(
      `SELECT i.*,
        s.id as submission_id, s.payload, s.signature_png, s.signed_pdf_path, s.submitted_at
       FROM invites i
       LEFT JOIN invite_submissions s ON s.invite_id = i.id
       WHERE i.event_id = ?
       ORDER BY i.created_at DESC`,
      [req.params.eventId]
    );

    res.json(invites.map(invite => ({
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
        payload: invite.payload ? (typeof invite.payload === 'string' ? JSON.parse(invite.payload) : invite.payload) : {},
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
    const [events] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM events WHERE id = ? AND user_id = ?',
      [req.params.eventId, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    const data = inviteSchema.parse(req.body);
    const token = generateInviteToken();

    const [result] = await pool.execute(
      `INSERT INTO invites (event_id, token, customer_name, customer_phone, customer_email, event_type, event_location, notes, price, event_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    const inviteId = (result as any).insertId;

    const [invites] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM invites WHERE id = ?',
      [inviteId]
    );

    const invite = invites[0];

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
    const [invites] = await pool.execute<RowDataPacket[]>(
      `SELECT i.*, e.user_id
       FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = ? AND e.user_id = ?`,
      [req.params.id, req.userId]
    );

    if (invites.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const invite = invites[0];

    // Get submission if exists
    const [submissions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM invite_submissions WHERE invite_id = ?',
      [invite.id]
    );

    const submission = submissions[0];

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
        payload: submission.payload ? (typeof submission.payload === 'string' ? JSON.parse(submission.payload) : submission.payload) : {},
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
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT i.id FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = ? AND e.user_id = ?`,
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const data = inviteSchema.parse(req.body);

    await pool.execute(
      `UPDATE invites SET
        customer_name = ?, customer_phone = ?, customer_email = ?, event_type = ?, event_location = ?, notes = ?, price = ?, event_date = ?
       WHERE id = ?`,
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

    const [invites] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM invites WHERE id = ?',
      [req.params.id]
    );

    const invite = invites[0];

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
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT i.id FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = ? AND e.user_id = ?`,
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    await pool.execute(
      'UPDATE invites SET status = ? WHERE id = ?',
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
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT i.id FROM invites i
       JOIN events e ON e.id = i.event_id
       WHERE i.id = ? AND e.user_id = ?`,
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    await pool.execute('DELETE FROM invites WHERE id = ?', [req.params.id]);

    res.json({ message: 'הזמנה נמחקה בהצלחה' });
  } catch (error) {
    next(error);
  }
});

export default router;
