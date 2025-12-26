import { forwardRef } from 'react';

interface PdfDocumentProps {
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
    businessWebsite?: string;
  };
  customer: {
    name: string;
    phone?: string;
    email?: string;
    eventType?: string;
    eventLocation?: string;
    notes?: string;
  };
  signature: string;
  signedAt: Date;
}

const PdfDocument = forwardRef<HTMLDivElement, PdfDocumentProps>(
  ({ event, customer, signature, signedAt }, ref) => {
    const themeColor = event.themeColor || '#7C3AED';
    const signDate = signedAt.toLocaleDateString('he-IL');

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: 'white',
          fontFamily: 'Arial, sans-serif',
          direction: 'rtl',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: themeColor,
            color: 'white',
            padding: '25px 30px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            {event.businessName || 'הסכם דיגיטלי'}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
            {event.title}
          </p>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '25px 30px' }}>
          {/* Customer Details Section */}
          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                margin: '0 0 15px 0',
                fontSize: '18px',
                color: '#333',
                borderBottom: `2px solid ${themeColor}`,
                paddingBottom: '10px',
              }}
            >
              פרטי ההזמנה
            </h2>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666', fontWeight: 500 }}>שם הלקוח:</span>
                <span style={{ color: '#333', fontWeight: 600 }}>{customer.name}</span>
              </div>

              {customer.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>טלפון:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{customer.phone}</span>
                </div>
              )}

              {customer.email && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>אימייל:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{customer.email}</span>
                </div>
              )}

              {customer.eventType && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>סוג האירוע:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{customer.eventType}</span>
                </div>
              )}

              {customer.eventLocation && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>מיקום האירוע:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{customer.eventLocation}</span>
                </div>
              )}

              {event.eventDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>תאריך האירוע:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>{new Date(event.eventDate).toLocaleDateString('he-IL')}</span>
                </div>
              )}

              {event.price && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666', fontWeight: 500 }}>מחיר:</span>
                  <span style={{ color: '#333', fontWeight: 600 }}>₪{event.price.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms Section */}
          {event.defaultText && (
            <div style={{ marginBottom: '20px' }}>
              <h2
                style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  color: '#333',
                  borderBottom: `2px solid ${themeColor}`,
                  paddingBottom: '10px',
                }}
              >
                תנאים והתחייבויות
              </h2>
              <div
                style={{
                  backgroundColor: '#fafafa',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '15px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  color: '#555',
                }}
              >
                {event.defaultText}
              </div>
            </div>
          )}

          {/* Signature Section */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '25px',
              paddingTop: '20px',
              borderTop: '2px solid #eee',
            }}
          >
            {/* Customer Name Box (Right side for RTL) */}
            <div
              style={{
                flex: 1,
                border: `2px solid ${themeColor}`,
                borderRadius: '12px',
                padding: '15px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: themeColor,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '10px',
                }}
              >
                שם הלקוח
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                {customer.name}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#888',
                  marginTop: '8px',
                }}
              >
                נחתם בתאריך: {signDate}
              </div>
            </div>

            {/* Signature Box (Left side for RTL) */}
            <div
              style={{
                flex: 1,
                border: `2px solid ${themeColor}`,
                borderRadius: '12px',
                padding: '15px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: themeColor,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '10px',
                }}
              >
                חתימה
              </div>
              <div
                style={{
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {signature ? (
                  <img
                    src={signature}
                    alt="חתימה"
                    style={{ maxWidth: '150px', maxHeight: '60px' }}
                  />
                ) : (
                  <span style={{ color: '#999' }}>ללא חתימה</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: themeColor,
            color: 'white',
            padding: '15px 30px',
            textAlign: 'center',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>תאריך: {signDate}</span>
          <span>
            {event.businessPhone || ''} {event.businessWebsite ? `| ${event.businessWebsite}` : ''}
          </span>
          <span>הסכם דיגיטלי</span>
        </div>
      </div>
    );
  }
);

PdfDocument.displayName = 'PdfDocument';

export default PdfDocument;
