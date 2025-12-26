import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794; // A4 at 96 DPI
const A4_HEIGHT_PX = 1123;

export interface PdfData {
  event: {
    title: string;
    description?: string;
    location?: string;
    eventDate?: string;
    price?: number;
    defaultText?: string;
    themeColor: string;
    businessName?: string;
    businessPhone?: string;
    businessLogo?: string;
    businessWebsite?: string;
  };
  customer: {
    name: string;
    phone?: string;
    email?: string;
    eventType?: string;
    eventLocation?: string;
    notes?: string;
    [key: string]: string | undefined;
  };
  signature: string;
  submittedAt: Date;
}

// Capture an element and convert to PDF
export async function captureElementToPdf(element: HTMLElement): Promise<Blob> {
  // Wait for images to load
  await new Promise(resolve => setTimeout(resolve, 200));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: A4_WIDTH_PX,
    windowWidth: A4_WIDTH_PX,
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Calculate if we need multiple pages
  const imgHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, A4_WIDTH_MM, imgHeight);
  heightLeft -= A4_HEIGHT_MM;

  // Add more pages if needed
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, A4_WIDTH_MM, imgHeight);
    heightLeft -= A4_HEIGHT_MM;
  }

  return pdf.output('blob');
}

// Generate PDF from data using a hidden element
export async function generatePdfFromHtml(data: PdfData): Promise<Blob> {
  const themeColor = data.event.themeColor || '#7C3AED';
  const signDate = data.submittedAt.toLocaleDateString('he-IL');

  // Create hidden container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    z-index: -1;
  `;

  // Build the PDF page HTML
  container.innerHTML = `
    <div id="pdf-page" style="
      width: ${A4_WIDTH_PX}px;
      min-height: ${A4_HEIGHT_PX}px;
      background: white;
      font-family: Arial, sans-serif;
      direction: rtl;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    ">
      <!-- Header -->
      <div style="
        background: ${themeColor};
        color: white;
        padding: 25px 30px;
        text-align: center;
      ">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
          ${data.event.businessName || 'הסכם דיגיטלי'}
        </h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
          ${data.event.title}
        </p>
      </div>

      <!-- Content -->
      <div style="flex: 1; padding: 25px 30px;">
        <!-- Customer Details -->
        <div style="
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        ">
          <h2 style="
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #333;
            border-bottom: 2px solid ${themeColor};
            padding-bottom: 10px;
          ">פרטי ההזמנה</h2>

          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">שם הלקוח:</span>
              <span style="color: #333; font-weight: 600;">${data.customer.name}</span>
            </div>
            ${data.customer.phone ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">טלפון:</span>
              <span style="color: #333; font-weight: 600;">${data.customer.phone}</span>
            </div>` : ''}
            ${data.customer.email ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">אימייל:</span>
              <span style="color: #333; font-weight: 600;">${data.customer.email}</span>
            </div>` : ''}
            ${data.customer.eventType ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">סוג האירוע:</span>
              <span style="color: #333; font-weight: 600;">${data.customer.eventType}</span>
            </div>` : ''}
            ${data.customer.eventLocation ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">מיקום האירוע:</span>
              <span style="color: #333; font-weight: 600;">${data.customer.eventLocation}</span>
            </div>` : ''}
            ${data.event.eventDate ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">תאריך האירוע:</span>
              <span style="color: #333; font-weight: 600;">${new Date(data.event.eventDate).toLocaleDateString('he-IL')}</span>
            </div>` : ''}
            ${data.event.price ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666; font-weight: 500;">מחיר:</span>
              <span style="color: #333; font-weight: 600;">₪${data.event.price.toLocaleString()}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Terms -->
        ${data.event.defaultText ? `
        <div style="margin-bottom: 20px;">
          <h2 style="
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #333;
            border-bottom: 2px solid ${themeColor};
            padding-bottom: 10px;
          ">תנאים והתחייבויות</h2>
          <div style="
            background: #fafafa;
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 15px;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            color: #555;
          ">${data.event.defaultText}</div>
        </div>` : ''}

        <!-- Signature Section -->
        <div style="
          display: flex;
          gap: 20px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 2px solid #eee;
        ">
          <!-- Customer Name Box -->
          <div style="
            flex: 1;
            border: 2px solid ${themeColor};
            border-radius: 12px;
            padding: 15px;
            text-align: center;
          ">
            <div style="
              color: ${themeColor};
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
            ">שם הלקוח</div>
            <div style="
              font-size: 18px;
              font-weight: 600;
              color: #333;
            ">${data.customer.name}</div>
            <div style="
              font-size: 12px;
              color: #888;
              margin-top: 8px;
            ">נחתם בתאריך: ${signDate}</div>
          </div>

          <!-- Signature Box -->
          <div style="
            flex: 1;
            border: 2px solid ${themeColor};
            border-radius: 12px;
            padding: 15px;
            text-align: center;
          ">
            <div style="
              color: ${themeColor};
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
            ">חתימה</div>
            <div style="
              min-height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${data.signature ? `<img src="${data.signature}" style="max-width: 150px; max-height: 60px;" />` : '<span style="color: #999;">ללא חתימה</span>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        background: ${themeColor};
        color: white;
        padding: 15px 30px;
        text-align: center;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span>תאריך: ${signDate}</span>
        <span>${data.event.businessPhone || ''} ${data.event.businessWebsite ? '| ' + data.event.businessWebsite : ''}</span>
        <span>הסכם דיגיטלי</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const pdfElement = container.querySelector('#pdf-page') as HTMLElement;

    // Wait for signature image to load
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(pdfElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= A4_HEIGHT_MM;

    // Add more pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= A4_HEIGHT_MM;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

// Download PDF helper
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Open PDF in new tab
export function openPdfInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
