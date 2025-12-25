import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateFileName } from './token';

interface PdfData {
  event: {
    title: string;
    description?: string;
    location?: string;
    eventDate?: string;
    price?: number;
    defaultText?: string;
    businessName?: string;
    businessPhone?: string;
    businessLogo?: string;
    businessWebsite?: string;
  };
  customer: Record<string, string>;
  signature: string;
  submittedAt: Date;
}

// Format date in Hebrew format
function formatDateHebrew(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  } catch {
    return dateStr;
  }
}

// Format price in Hebrew format
function formatPrice(price: number): string {
  return `${price.toLocaleString('he-IL')} ש"ח`;
}

// Field labels mapping
const fieldLabels: Record<string, string> = {
  name: 'שם המזמין',
  contactPhone: 'טלפון',
  phone: 'טלפון',
  companyId: 'ת.ז / ח.פ',
  accountingContact: 'איש קשר להנה"ח',
  invoiceEmail: 'מייל לחשבונית',
  email: 'אימייל',
  address: 'כתובת',
  notes: 'הערות',
  date: 'תאריך',
  eventType: 'סוג הארוע',
  eventLocation: 'מיקום/כתובת הארוע',
};

// Reverse Hebrew text for RTL support in PDFKit
function reverseHebrew(text: string): string {
  if (!text) return '';
  return text.split('').reverse().join('');
}

export async function generatePdf(data: PdfData): Promise<string> {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = generateFileName('signed', 'pdf');
  const filePath = path.join(uploadsDir, fileName);

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: data.event.title || 'Signed Document',
          Author: data.event.businessName || 'Event System',
        }
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Use built-in font that supports basic characters
      const fontPath = path.join(__dirname, '../fonts/Rubik-Regular.ttf');
      const fontBoldPath = path.join(__dirname, '../fonts/Rubik-Bold.ttf');

      // Check if Hebrew fonts exist, otherwise use Helvetica
      const hasHebrewFont = fs.existsSync(fontPath);

      if (hasHebrewFont) {
        doc.registerFont('Hebrew', fontPath);
        doc.registerFont('HebrewBold', fontBoldPath);
      }

      const useFont = hasHebrewFont ? 'Hebrew' : 'Helvetica';
      const useBoldFont = hasHebrewFont ? 'HebrewBold' : 'Helvetica-Bold';

      // Header
      doc.font(useBoldFont)
         .fontSize(24)
         .text(data.event.businessName || '', { align: 'right' });

      doc.font(useFont)
         .fontSize(14)
         .fillColor('#666666')
         .text(data.event.title || '', { align: 'right' });

      doc.moveDown(0.5);

      // Divider
      doc.strokeColor('#dddddd')
         .lineWidth(2)
         .moveTo(40, doc.y)
         .lineTo(555, doc.y)
         .stroke();

      doc.moveDown(1);

      // Customer details
      const customerPhone = data.customer.contactPhone || data.customer.phone || '';

      doc.fillColor('#333333')
         .font(useBoldFont)
         .fontSize(11);

      const startY = doc.y;
      const leftCol = 300;
      const rightCol = 40;

      // Right column
      doc.text('תאריך האירוע:', rightCol, startY, { continued: true, align: 'right', width: 100 })
         .font(useFont)
         .text(' ' + (data.event.eventDate ? formatDateHebrew(data.event.eventDate) : '-'), { align: 'right' });

      doc.font(useBoldFont)
         .text('נייד:', rightCol, startY + 20, { continued: true, align: 'right', width: 100 })
         .font(useFont)
         .text(' ' + (customerPhone || '-'), { align: 'right' });

      doc.font(useBoldFont)
         .text('מיקום:', rightCol, startY + 40, { continued: true, align: 'right', width: 100 })
         .font(useFont)
         .text(' ' + (data.customer.eventLocation || '-'), { align: 'right' });

      // Left column
      doc.font(useBoldFont)
         .text('המזמינים:', leftCol, startY, { continued: true, align: 'right', width: 100 })
         .font(useFont)
         .text(' ' + (data.customer.name || '-'), { align: 'right' });

      doc.font(useBoldFont)
         .text('סוג האירוע:', leftCol, startY + 20, { continued: true, align: 'right', width: 100 })
         .font(useFont)
         .text(' ' + (data.customer.eventType || '-'), { align: 'right' });

      doc.font(useBoldFont)
         .text('מחיר:', leftCol, startY + 40, { continued: true, align: 'right', width: 100 })
         .font(useFont)
         .text(' ' + (data.event.price ? formatPrice(data.event.price) : '-'), { align: 'right' });

      doc.y = startY + 80;

      // Additional fields
      const knownFields = ['name', 'contactPhone', 'phone', 'date', 'eventType', 'eventLocation'];
      const additionalFields = Object.entries(data.customer)
        .filter(([key, value]) => !knownFields.includes(key) && value);

      if (additionalFields.length > 0) {
        doc.moveDown(0.5);
        for (const [key, value] of additionalFields) {
          const label = fieldLabels[key] || key;
          doc.font(useBoldFont)
             .fontSize(10)
             .text(label + ':', { continued: true, align: 'right' })
             .font(useFont)
             .text(' ' + value, { align: 'right' });
        }
      }

      // Divider
      doc.moveDown(1);
      doc.strokeColor('#dddddd')
         .lineWidth(1)
         .moveTo(40, doc.y)
         .lineTo(555, doc.y)
         .stroke();

      doc.moveDown(1);

      // Terms section
      if (data.event.defaultText) {
        doc.font(useBoldFont)
           .fontSize(14)
           .fillColor('#333333')
           .text('תנאים כלליים', { align: 'right' });

        doc.moveDown(0.5);

        // Terms box
        const termsStartY = doc.y;
        const lines = data.event.defaultText.split('\n');

        doc.font(useFont)
           .fontSize(9)
           .fillColor('#333333');

        for (const line of lines) {
          if (line.trim()) {
            doc.text(line.trim(), 50, doc.y, {
              align: 'right',
              width: 495
            });
          } else {
            doc.moveDown(0.3);
          }
        }

        // Draw box around terms
        const termsEndY = doc.y + 10;
        doc.strokeColor('#cccccc')
           .lineWidth(1)
           .roundedRect(45, termsStartY - 10, 505, termsEndY - termsStartY + 10, 5)
           .stroke();

        doc.y = termsEndY + 20;
      }

      // Signature section
      doc.moveDown(2);

      const sigY = doc.y;
      const boxWidth = 200;
      const boxHeight = 100;

      // Customer name box
      doc.strokeColor('#dddddd')
         .lineWidth(1)
         .roundedRect(320, sigY, boxWidth, boxHeight, 8)
         .stroke();

      doc.font(useBoldFont)
         .fontSize(11)
         .fillColor('#333333')
         .text('שם המזמין', 320, sigY + 10, { width: boxWidth, align: 'center' });

      doc.font(useFont)
         .fontSize(14)
         .text(data.customer.name || '', 320, sigY + 40, { width: boxWidth, align: 'center' });

      // Signature box
      doc.strokeColor('#dddddd')
         .roundedRect(80, sigY, boxWidth, boxHeight, 8)
         .stroke();

      doc.font(useBoldFont)
         .fontSize(11)
         .text('חתימת המזמין', 80, sigY + 10, { width: boxWidth, align: 'center' });

      // Add signature image if exists
      if (data.signature && data.signature.startsWith('data:image')) {
        try {
          const base64Data = data.signature.replace(/^data:image\/\w+;base64,/, '');
          const sigBuffer = Buffer.from(base64Data, 'base64');
          doc.image(sigBuffer, 110, sigY + 35, { width: 140, height: 55 });
        } catch (err) {
          console.error('Failed to add signature image:', err);
        }
      }

      // Signature date
      doc.moveDown(6);
      doc.font(useFont)
         .fontSize(10)
         .fillColor('#666666')
         .text('נחתם ביום ' + data.submittedAt.toLocaleDateString('he-IL'), { align: 'center' });

      // Footer
      const footerText = [data.event.businessWebsite, data.event.businessPhone].filter(Boolean).join('  |  ');
      if (footerText) {
        doc.fontSize(9)
           .fillColor('#666666')
           .text(footerText, 40, 780, { align: 'center', width: 515 });
      }

      // Finalize
      doc.end();

      writeStream.on('finish', () => {
        resolve(fileName);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}
