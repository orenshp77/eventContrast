import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured, skipping send');
    console.log('Would send email to:', options.to);
    console.log('Subject:', options.subject);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });

  console.log('Email sent to:', options.to);
}

// Generate WhatsApp URL
export function generateWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number (remove non-digits except +)
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  // If starts with 0, assume Israel number
  let formattedPhone = cleanPhone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '972' + formattedPhone.substring(1);
  }

  // Remove leading +
  formattedPhone = formattedPhone.replace(/^\+/, '');

  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Generate invite message template
export function generateInviteMessage(eventTitle: string, inviteUrl: string, customerName: string): string {
  return `שלום ${customerName},

הוזמנת לחתום על מסמך: ${eventTitle}

לחץ על הקישור הבא לצפייה וחתימה:
${inviteUrl}

תודה!`;
}

// Generate signed document message
export function generateSignedMessage(eventTitle: string, customerName: string): string {
  return `שלום,

מצורף טופס חתום:
📄 ${eventTitle}
👤 ${customerName}
📅 ${new Date().toLocaleDateString('he-IL')}

תודה!`;
}
