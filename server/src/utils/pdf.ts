import puppeteer from 'puppeteer';
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

// Escape HTML special characters
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  const uploadsDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = generateFileName('signed', 'pdf');
  const filePath = path.join(uploadsDir, fileName);

  // Build customer details rows
  const customerPhone = data.customer.contactPhone || data.customer.phone || '';

  // Known fields to exclude from additional fields
  const knownFields = ['name', 'contactPhone', 'phone', 'date', 'eventType', 'eventLocation'];
  const additionalFields = Object.entries(data.customer)
    .filter(([key, value]) => !knownFields.includes(key) && value);

  // Build additional fields HTML
  let additionalFieldsHtml = '';
  for (let i = 0; i < additionalFields.length; i += 2) {
    const [key1, value1] = additionalFields[i];
    const label1 = fieldLabels[key1] || key1;

    let row = `
      <tr>
        <td class="label">${escapeHtml(label1)}:</td>
        <td class="value">${escapeHtml(value1)}</td>`;

    if (i + 1 < additionalFields.length) {
      const [key2, value2] = additionalFields[i + 1];
      const label2 = fieldLabels[key2] || key2;
      row += `
        <td class="label">${escapeHtml(label2)}:</td>
        <td class="value">${escapeHtml(value2)}</td>`;
    } else {
      row += `<td></td><td></td>`;
    }

    row += `</tr>`;
    additionalFieldsHtml += row;
  }

  // Build terms HTML
  let termsHtml = '';
  if (data.event.defaultText) {
    const lines = data.event.defaultText.split('\n');
    termsHtml = lines.map(line =>
      line.trim() ? `<p>${escapeHtml(line)}</p>` : '<br>'
    ).join('');
  }

  // Create HTML template
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Heebo', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 40px;
      direction: rtl;
    }

    .header {
      text-align: right;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ddd;
    }

    .business-name {
      font-size: 28px;
      font-weight: 700;
      color: #000;
      margin-bottom: 5px;
    }

    .event-title {
      font-size: 16px;
      color: #666;
    }

    .details-table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }

    .details-table td {
      padding: 8px 5px;
      vertical-align: top;
    }

    .details-table .label {
      font-weight: 700;
      color: #333;
      width: 15%;
      text-align: right;
    }

    .details-table .value {
      color: #000;
      width: 35%;
      text-align: right;
    }

    .divider {
      border-top: 1px solid #ddd;
      margin: 20px 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
      text-align: right;
    }

    .terms-box {
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 15px;
      background: #fafafa;
      margin-bottom: 30px;
    }

    .terms-box p {
      margin: 5px 0;
      font-size: 11px;
      color: #333;
      line-height: 1.6;
      text-align: right;
    }

    .signature-section {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 20px;
    }

    .signature-box {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }

    .signature-label {
      font-size: 13px;
      font-weight: 700;
      color: #333;
      margin-bottom: 10px;
    }

    .signature-name {
      font-size: 16px;
      color: #000;
      font-weight: 500;
    }

    .signature-image {
      max-width: 200px;
      max-height: 80px;
      margin: 0 auto;
    }

    .signature-date {
      font-size: 11px;
      color: #666;
      margin-top: 20px;
      text-align: center;
    }

    .footer {
      position: fixed;
      bottom: 30px;
      left: 40px;
      right: 40px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">${escapeHtml(data.event.businessName || '')}</div>
    <div class="event-title">${escapeHtml(data.event.title || '')}</div>
  </div>

  <table class="details-table">
    <tr>
      <td class="label">תאריך האירוע:</td>
      <td class="value">${data.event.eventDate ? formatDateHebrew(data.event.eventDate) : '-'}</td>
      <td class="label">המזמינים:</td>
      <td class="value">${escapeHtml(data.customer.name || '-')}</td>
    </tr>
    <tr>
      <td class="label">נייד:</td>
      <td class="value">${escapeHtml(customerPhone || '-')}</td>
      <td class="label">סוג האירוע:</td>
      <td class="value">${escapeHtml(data.customer.eventType || '-')}</td>
    </tr>
    <tr>
      <td class="label">מיקום/כתובת הארוע:</td>
      <td class="value">${escapeHtml(data.customer.eventLocation || '-')}</td>
      <td class="label">מחיר:</td>
      <td class="value">${data.event.price ? formatPrice(data.event.price) : '-'}</td>
    </tr>
    ${additionalFieldsHtml}
  </table>

  <div class="divider"></div>

  ${data.event.defaultText ? `
    <div class="section-title">תנאים כלליים</div>
    <div class="terms-box">
      ${termsHtml}
    </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">שם המזמין</div>
      <div class="signature-name">${escapeHtml(data.customer.name || '')}</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">חתימת המזמין</div>
      ${data.signature ? `<img class="signature-image" src="${data.signature}" />` : ''}
    </div>
  </div>

  <div class="signature-date">נחתם ביום ${data.submittedAt.toLocaleDateString('he-IL')}</div>

  <div class="footer">
    ${[data.event.businessWebsite, data.event.businessPhone].filter(Boolean).join('  |  ')}
  </div>
</body>
</html>
`;

  // Launch browser and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '60px',
        left: '20px'
      },
      printBackground: true
    });
  } finally {
    await browser.close();
  }

  return fileName;
}
