import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
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

// Reverse Hebrew text for RTL display in PDF
function reverseHebrew(text: string): string {
  // Check if text contains Hebrew characters
  const hebrewRegex = /[\u0590-\u05FF]/;
  if (!hebrewRegex.test(text)) {
    return text;
  }

  // Split text into segments (Hebrew vs non-Hebrew)
  const segments: string[] = [];
  let currentSegment = '';
  let isCurrentHebrew = false;

  for (const char of text) {
    const isHebrew = hebrewRegex.test(char);
    if (currentSegment === '') {
      currentSegment = char;
      isCurrentHebrew = isHebrew;
    } else if (isHebrew === isCurrentHebrew || char === ' ') {
      currentSegment += char;
    } else {
      segments.push(currentSegment);
      currentSegment = char;
      isCurrentHebrew = isHebrew;
    }
  }
  if (currentSegment) {
    segments.push(currentSegment);
  }

  // Reverse Hebrew segments and the order of segments
  const reversedSegments = segments.map(seg => {
    if (hebrewRegex.test(seg)) {
      return seg.split('').reverse().join('');
    }
    return seg;
  });

  return reversedSegments.reverse().join('');
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

export async function generatePdf(data: PdfData): Promise<string> {
  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = generateFileName('signed', 'pdf');
  const filePath = path.join(uploadsDir, fileName);

  // Find font path - check multiple locations
  const fontLocations = [
    path.join(__dirname, '../fonts'),
    path.join(__dirname, '../../src/fonts'),
    path.join(process.cwd(), 'src/fonts'),
    path.join(process.cwd(), 'dist/fonts'),
  ];

  let fontDir = '';
  for (const loc of fontLocations) {
    if (fs.existsSync(path.join(loc, 'Rubik-Regular.ttf'))) {
      fontDir = loc;
      break;
    }
  }

  const hasHebrewFont = fontDir !== '';
  console.log('Font directory:', fontDir || 'NOT FOUND - using Helvetica');

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: data.event.title || 'Signed Document',
          Author: data.event.businessName || 'Event System',
        }
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Register Hebrew font if available
      let useFont = 'Helvetica';
      let useBoldFont = 'Helvetica-Bold';

      if (hasHebrewFont) {
        doc.registerFont('Rubik', path.join(fontDir, 'Rubik-Regular.ttf'));
        doc.registerFont('Rubik-Bold', path.join(fontDir, 'Rubik-Bold.ttf'));
        useFont = 'Rubik';
        useBoldFont = 'Rubik-Bold';
      }

      const pageWidth = 595.28; // A4 width in points
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function for RTL text
      const rtlText = (text: string) => hasHebrewFont ? reverseHebrew(text) : text;

      // Header - Business name centered
      doc.font(useBoldFont)
         .fontSize(28)
         .fillColor('#7C3AED')
         .text(rtlText(data.event.businessName || ''), margin, 50, {
           align: 'center',
           width: contentWidth
         });

      // Event title
      doc.font(useFont)
         .fontSize(16)
         .fillColor('#666666')
         .text(rtlText(data.event.title || ''), margin, doc.y + 5, {
           align: 'center',
           width: contentWidth
         });

      doc.moveDown(1);

      // Divider
      doc.strokeColor('#7C3AED')
         .lineWidth(2)
         .moveTo(margin, doc.y)
         .lineTo(pageWidth - margin, doc.y)
         .stroke();

      doc.moveDown(1.5);

      // Customer info section - two columns
      const col1X = pageWidth - margin - 200; // Right column (for RTL)
      const col2X = margin + 50; // Left column

      const startY = doc.y;

      // Right column - Event details
      doc.font(useBoldFont)
         .fontSize(11)
         .fillColor('#333333')
         .text(rtlText('תאריך האירוע:'), col1X, startY, { width: 200, align: 'right' });
      doc.font(useFont)
         .text(data.event.eventDate ? formatDateHebrew(data.event.eventDate) : '-', col1X, doc.y, { width: 200, align: 'right' });

      doc.moveDown(0.5);
      doc.font(useBoldFont)
         .text(rtlText('טלפון:'), col1X, doc.y, { width: 200, align: 'right' });
      doc.font(useFont)
         .text(data.customer.contactPhone || data.customer.phone || '-', col1X, doc.y, { width: 200, align: 'right' });

      doc.moveDown(0.5);
      doc.font(useBoldFont)
         .text(rtlText('מיקום:'), col1X, doc.y, { width: 200, align: 'right' });
      doc.font(useFont)
         .text(rtlText(data.customer.eventLocation || '-'), col1X, doc.y, { width: 200, align: 'right' });

      // Left column - Customer details
      doc.font(useBoldFont)
         .text(rtlText('שם הלקוח:'), col2X, startY, { width: 200, align: 'right' });
      doc.font(useFont)
         .text(rtlText(data.customer.name || '-'), col2X, doc.y, { width: 200, align: 'right' });

      doc.moveDown(0.5);
      doc.font(useBoldFont)
         .text(rtlText('סוג האירוע:'), col2X, doc.y, { width: 200, align: 'right' });
      doc.font(useFont)
         .text(rtlText(data.customer.eventType || '-'), col2X, doc.y, { width: 200, align: 'right' });

      doc.moveDown(0.5);
      doc.font(useBoldFont)
         .text(rtlText('מחיר:'), col2X, doc.y, { width: 200, align: 'right' });
      doc.font(useFont)
         .text(data.event.price ? formatPrice(data.event.price) : '-', col2X, doc.y, { width: 200, align: 'right' });

      // Move to after both columns
      doc.y = Math.max(doc.y, startY + 100);

      // Additional customer fields
      const knownFields = ['name', 'contactPhone', 'phone', 'date', 'eventType', 'eventLocation'];
      const additionalFields = Object.entries(data.customer)
        .filter(([key, value]) => !knownFields.includes(key) && value);

      if (additionalFields.length > 0) {
        doc.moveDown(1);
        for (const [key, value] of additionalFields) {
          const label = fieldLabels[key] || key;
          doc.font(useBoldFont)
             .fontSize(10)
             .text(rtlText(label + ':'), margin, doc.y, { width: contentWidth, align: 'right' });
          doc.font(useFont)
             .text(rtlText(value), margin, doc.y, { width: contentWidth, align: 'right' });
          doc.moveDown(0.3);
        }
      }

      // Divider before terms
      doc.moveDown(1);
      doc.strokeColor('#dddddd')
         .lineWidth(1)
         .moveTo(margin, doc.y)
         .lineTo(pageWidth - margin, doc.y)
         .stroke();

      doc.moveDown(1);

      // Terms section
      if (data.event.defaultText) {
        doc.font(useBoldFont)
           .fontSize(14)
           .fillColor('#7C3AED')
           .text(rtlText('תנאים והתחייבויות'), margin, doc.y, {
             align: 'center',
             width: contentWidth
           });

        doc.moveDown(0.5);

        // Terms box
        const termsStartY = doc.y;
        const lines = data.event.defaultText.split('\n');

        doc.font(useFont)
           .fontSize(9)
           .fillColor('#333333');

        for (const line of lines) {
          if (line.trim()) {
            doc.text(rtlText(line.trim()), margin + 10, doc.y, {
              align: 'right',
              width: contentWidth - 20
            });
          } else {
            doc.moveDown(0.3);
          }
        }

        // Draw box around terms
        const termsEndY = doc.y + 10;
        doc.strokeColor('#e5e5e5')
           .lineWidth(1)
           .roundedRect(margin, termsStartY - 10, contentWidth, termsEndY - termsStartY + 10, 8)
           .stroke();

        doc.y = termsEndY + 20;
      }

      // Signature section
      doc.moveDown(2);

      const sigY = doc.y;
      const boxWidth = 180;
      const boxHeight = 90;
      const boxGap = 40;

      // Calculate positions to center both boxes
      const totalBoxWidth = (boxWidth * 2) + boxGap;
      const startX = (pageWidth - totalBoxWidth) / 2;

      // Customer name box (right side for RTL)
      const nameBoxX = startX + boxWidth + boxGap;
      doc.strokeColor('#7C3AED')
         .lineWidth(2)
         .roundedRect(nameBoxX, sigY, boxWidth, boxHeight, 8)
         .stroke();

      doc.font(useBoldFont)
         .fontSize(12)
         .fillColor('#7C3AED')
         .text(rtlText('שם הלקוח'), nameBoxX, sigY + 10, { width: boxWidth, align: 'center' });

      doc.font(useFont)
         .fontSize(14)
         .fillColor('#333333')
         .text(rtlText(data.customer.name || ''), nameBoxX, sigY + 40, { width: boxWidth, align: 'center' });

      // Signature box (left side for RTL)
      const sigBoxX = startX;
      doc.strokeColor('#7C3AED')
         .lineWidth(2)
         .roundedRect(sigBoxX, sigY, boxWidth, boxHeight, 8)
         .stroke();

      doc.font(useBoldFont)
         .fontSize(12)
         .fillColor('#7C3AED')
         .text(rtlText('חתימה'), sigBoxX, sigY + 10, { width: boxWidth, align: 'center' });

      // Add signature image if exists
      if (data.signature && data.signature.startsWith('data:image')) {
        try {
          const base64Data = data.signature.replace(/^data:image\/\w+;base64,/, '');
          const sigBuffer = Buffer.from(base64Data, 'base64');
          doc.image(sigBuffer, sigBoxX + 20, sigY + 30, { width: 140, height: 50 });
        } catch (error: unknown) {
          console.error('Failed to add signature image:', error);
        }
      }

      // Signature date
      doc.y = sigY + boxHeight + 15;
      doc.font(useFont)
         .fontSize(10)
         .fillColor('#666666')
         .text(rtlText('נחתם בתאריך: ') + data.submittedAt.toLocaleDateString('he-IL'), margin, doc.y, {
           align: 'center',
           width: contentWidth
         });

      // Footer
      const footerText = [data.event.businessWebsite, data.event.businessPhone].filter(Boolean).join('  |  ');
      if (footerText) {
        doc.fontSize(9)
           .fillColor('#999999')
           .text(footerText, margin, 780, { align: 'center', width: contentWidth });
      }

      // Finalize
      doc.end();

      writeStream.on('finish', () => {
        resolve(fileName);
      });

      writeStream.on('error', (error: Error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}
