import { Router } from 'express';
import pool from '../db/connection';
import { submitInviteSchema } from '../utils/validation';
import { generatePdf } from '../utils/pdf';
import { sendEmail } from '../utils/email';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/public/invite/:token - Get public invite data
router.get('/invite/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const [invites] = await pool.execute<RowDataPacket[]>(
      `SELECT i.*, e.*, u.business_name, u.business_phone, u.business_logo,
              i.event_date as invite_event_date, i.price as invite_price,
              e.event_date as event_event_date, e.price as event_price
       FROM invites i
       JOIN events e ON e.id = i.event_id
       JOIN users u ON u.id = e.user_id
       WHERE i.token = ?`,
      [token]
    );

    if (invites.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const data = invites[0];

    // Update status to VIEWED if it's new
    if (data.status === 'CREATED' || data.status === 'SENT') {
      await pool.execute(
        "UPDATE invites SET status = 'VIEWED' WHERE token = ?",
        [token]
      );
    }

    // Check if already submitted
    const [submissions] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM invite_submissions WHERE invite_id = ?',
      [data.id]
    );

    res.json({
      event: {
        title: data.title,
        description: data.description,
        location: data.location,
        eventDate: data.invite_event_date || data.event_event_date,
        price: data.invite_price || data.event_price,
        defaultText: data.default_text,
        themeColor: data.theme_color,
        fieldsSchema: data.fields_schema ? (typeof data.fields_schema === 'string' ? JSON.parse(data.fields_schema) : data.fields_schema) : [],
        businessName: data.business_name,
        businessPhone: data.business_phone,
        businessLogo: data.business_logo,
      },
      invite: {
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        eventType: data.event_type,
        eventLocation: data.event_location,
        notes: data.notes,
        status: submissions.length > 0 ? 'SIGNED' : data.status,
      },
      alreadySubmitted: submissions.length > 0,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/public/invite/:token/submit - Submit signed invite
router.post('/invite/:token/submit', async (req, res, next) => {
  try {
    const { token } = req.params;
    const data = submitInviteSchema.parse(req.body);

    // Get invite
    const [invites] = await pool.execute<RowDataPacket[]>(
      `SELECT i.id as invite_id, i.token, i.customer_name, i.customer_email, i.customer_phone, i.status,
              i.event_date as invite_event_date, i.price as invite_price,
              i.event_type, i.event_location,
              e.*, u.business_name, u.business_phone, u.business_logo, u.business_website, u.email as user_email
       FROM invites i
       JOIN events e ON e.id = i.event_id
       JOIN users u ON u.id = e.user_id
       WHERE i.token = ?`,
      [token]
    );

    if (invites.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const invite = invites[0];

    // Generate PDF
    let pdfPath = null;
    try {
      pdfPath = await generatePdf({
        event: {
          title: invite.title,
          description: invite.description,
          location: invite.location,
          eventDate: invite.invite_event_date || invite.event_date,
          price: invite.invite_price || invite.price,
          defaultText: invite.default_text,
          businessName: invite.business_name,
          businessPhone: invite.business_phone,
          businessLogo: invite.business_logo,
          businessWebsite: invite.business_website,
        },
        customer: {
          name: invite.customer_name,
          phone: invite.customer_phone || '',
          email: invite.customer_email || '',
          eventType: invite.event_type || '',
          eventLocation: invite.event_location || '',
          ...data.payload,
        },
        signature: data.signature,
        submittedAt: new Date(),
      });
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      // Continue without PDF
    }

    // Save submission (update if already exists)
    await pool.execute(
      `INSERT INTO invite_submissions (invite_id, payload, signature_png, signed_pdf_path)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         payload = VALUES(payload),
         signature_png = VALUES(signature_png),
         signed_pdf_path = VALUES(signed_pdf_path),
         submitted_at = CURRENT_TIMESTAMP`,
      [
        invite.invite_id,
        JSON.stringify(data.payload),
        data.signature,
        pdfPath,
      ]
    );

    // Update invite status
    await pool.execute(
      "UPDATE invites SET status = 'SIGNED' WHERE id = ?",
      [invite.invite_id]
    );

    // Prepare WhatsApp message
    const whatsappMessage = encodeURIComponent(
      `שלום,\nמצורף טופס חתום עבור: ${invite.title}\nשם: ${invite.customer_name}\nתאריך חתימה: ${new Date().toLocaleDateString('he-IL')}`
    );

    res.json({
      message: 'הטופס נשלח בהצלחה!',
      pdfUrl: pdfPath ? `/uploads/${pdfPath}` : null,
      whatsappUrl: invite.business_phone
        ? `https://wa.me/${invite.business_phone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
        : null,
      ownerEmail: invite.user_email,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/public/invite/:token/send-email - Send signed document via email
router.post('/invite/:token/send-email', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ message: 'נדרשת כתובת מייל' });
    }

    // Get invite and submission
    const [invites] = await pool.execute<RowDataPacket[]>(
      `SELECT i.*, e.title, s.signed_pdf_path, u.email as user_email
       FROM invites i
       JOIN events e ON e.id = i.event_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN invite_submissions s ON s.invite_id = i.id
       WHERE i.token = ?`,
      [token]
    );

    if (invites.length === 0) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה' });
    }

    const invite = invites[0];

    if (!invite.signed_pdf_path) {
      return res.status(400).json({ message: 'לא נמצא מסמך חתום' });
    }

    // Send email
    await sendEmail({
      to: recipientEmail,
      subject: `מסמך חתום - ${invite.title}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>מסמך חתום</h2>
          <p>שלום,</p>
          <p>מצורף המסמך החתום עבור: <strong>${invite.title}</strong></p>
          <p>שם הלקוח: ${invite.customer_name}</p>
          <p>תאריך חתימה: ${new Date().toLocaleDateString('he-IL')}</p>
          <br>
          <p>בברכה</p>
        </div>
      `,
      attachments: invite.signed_pdf_path ? [
        {
          filename: `signed_document_${invite.customer_name}.pdf`,
          path: `./uploads/${invite.signed_pdf_path}`,
        }
      ] : [],
    });

    // Update status to RETURNED
    await pool.execute(
      "UPDATE invites SET status = 'RETURNED' WHERE id = ?",
      [invite.id]
    );

    res.json({ message: 'המייל נשלח בהצלחה!' });
  } catch (error) {
    next(error);
  }
});

export default router;
