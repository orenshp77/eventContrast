import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignatureCanvas, { SignatureCanvasRef } from '../components/SignatureCanvas';
import { publicApi } from '../utils/api';
import { showToast, showLoading, hideLoading } from '../utils/swal';
import Swal from 'sweetalert2';

interface FieldSchema {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
}

interface InviteData {
  event: {
    title: string;
    description?: string;
    location?: string;
    eventDate?: string;
    price?: number;
    defaultText?: string;
    themeColor: string;
    fieldsSchema: FieldSchema[];
    businessName?: string;
    businessPhone?: string;
    businessLogo?: string;
  };
  invite: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    eventType?: string;
    eventLocation?: string;
    notes?: string;
    status: string;
  };
  alreadySubmitted: boolean;
}

export default function PublicInvite() {
  const { token } = useParams();
  const sigRef = useRef<SignatureCanvasRef>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<InviteData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [wantEmailCopy, setWantEmailCopy] = useState(false);
  const [emailForCopy, setEmailForCopy] = useState('');

  useEffect(() => {
    fetchInviteData();
  }, [token]);

  const fetchInviteData = async () => {
    try {
      const response = await publicApi.getInvite(token!);
      setData(response.data);

      // Initialize form values
      const initialValues: Record<string, string> = {};
      response.data.event.fieldsSchema.forEach((field: FieldSchema) => {
        initialValues[field.id] = '';
      });
      setFormValues(initialValues);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues({ ...formValues, [fieldId]: value });
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    data?.event.fieldsSchema.forEach((field) => {
      if (field.required && !formValues[field.id]?.trim()) {
        newErrors[field.id] = 'שדה חובה';
      }
      if (field.type === 'email' && formValues[field.id]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues[field.id])) {
          newErrors[field.id] = 'כתובת מייל לא תקינה';
        }
      }
    });

    if (sigRef.current?.isEmpty()) {
      newErrors.signature = 'נדרשת חתימה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast.error('נא למלא את כל שדות החובה ולחתום');
      return;
    }

    // Validate email if checkbox is checked
    if (wantEmailCopy && emailForCopy) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForCopy)) {
        showToast.error('כתובת מייל לא תקינה');
        return;
      }
    }

    setSubmitting(true);
    showLoading('שולח את הטופס...');

    try {
      const signature = sigRef.current?.toDataURL() || '';

      const response = await publicApi.submitInvite(token!, {
        payload: formValues,
        signature,
      });

      hideLoading();

      // Send email copy if requested
      if (wantEmailCopy && emailForCopy) {
        showLoading('שולח העתק למייל...');
        try {
          await publicApi.sendEmail(token!, emailForCopy);
          hideLoading();
        } catch (error) {
          hideLoading();
          // Continue anyway
        }
      }

      // Mark as submitted
      setData(prev => prev ? { ...prev, alreadySubmitted: true } : null);

      // Show success popup with options
      const pdfUrl = response.data.pdfUrl;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10001';
      const fullPdfUrl = pdfUrl ? apiUrl + pdfUrl : null;
      const businessPhone = data?.event.businessPhone;
      const ownerEmail = response.data.ownerEmail;
      const shareUrl = fullPdfUrl || window.location.href;
      const whatsappMessage = encodeURIComponent(
        'שלום,\nמצורף טופס חתום עבור: ' + data?.event.title + '\nשם: ' + data?.invite.customerName + '\nתאריך חתימה: ' + new Date().toLocaleDateString('he-IL') + (fullPdfUrl ? '\n\nקישור ל-PDF:\n' + fullPdfUrl : '')
      );
      const whatsappUrl = businessPhone
        ? 'https://wa.me/' + businessPhone.replace(/[^0-9]/g, '') + '?text=' + whatsappMessage
        : null;

      await Swal.fire({
        title: 'הטופס נשלח בהצלחה!',
        html: `
          <div class="space-y-3" dir="rtl">
            ${pdfUrl ? `<button id="swal-pdf" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #7C3AED;">
              📄 פתח PDF
            </button>` : ''}
            <button id="swal-whatsapp" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #25D366;">
              שלח בוואטסאפ
            </button>
            <button id="swal-email" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #3B82F6;">
              שלח במייל
            </button>
            <button id="swal-copy" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #EF4444;">
              📋 העתק קישור
            </button>
            <button id="swal-close" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #6B7280;">
              סגור
            </button>
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        customClass: {
          popup: 'swal2-rtl',
        },
        didOpen: () => {
          document.getElementById('swal-pdf')?.addEventListener('click', () => {
            if (fullPdfUrl) window.open(fullPdfUrl, '_blank');
          });
          document.getElementById('swal-whatsapp')?.addEventListener('click', () => {
            if (whatsappUrl) {
              window.open(whatsappUrl, '_blank');
            } else {
              navigator.clipboard.writeText(shareUrl);
              showToast.success('הקישור הועתק! (לא הוגדר טלפון עסק)');
            }
          });
          document.getElementById('swal-email')?.addEventListener('click', async () => {
            const subject = encodeURIComponent('טופס חתום - ' + data?.event.title);
            const body = encodeURIComponent('שלום,\n\nמצורף קישור לטופס החתום:\n' + shareUrl + '\n\nשם: ' + data?.invite.customerName + '\nתאריך חתימה: ' + new Date().toLocaleDateString('he-IL') + '\n\nתודה!');
            const mailtoUrl = 'mailto:' + (ownerEmail || '') + '?subject=' + subject + '&body=' + body;
            window.open(mailtoUrl, '_blank');
          });
          document.getElementById('swal-copy')?.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl);
            showToast.success('הקישור ל-PDF הועתק!');
          });
          document.getElementById('swal-close')?.addEventListener('click', () => {
            Swal.close();
          });
        },
      });

    } catch (error: any) {
      hideLoading();
      showToast.error(error.response?.data?.message || 'שגיאה בשליחת הטופס');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">טוען הסכם...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הסכם לא נמצא</h1>
          <p className="text-gray-600">הקישור אינו תקין או שפג תוקפו</p>
        </div>
      </div>
    );
  }

  // Allow re-submission - removed alreadySubmitted check

  const themeColor = data.event.themeColor || '#7C3AED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-40 text-white py-4 px-4 shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-center">{data.event.title}</h1>
          {data.event.businessName && (
            <p className="text-center text-white/80 text-sm mt-1">{data.event.businessName}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Welcome Message */}
        <div className="card text-center">
          <p className="text-gray-600">
            שלום <span className="font-semibold text-gray-900">{data.invite.customerName}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">נא למלא את הפרטים ולחתום</p>
        </div>

        {/* View Document Button */}
        <button
          onClick={handleViewDocument}
          className="card w-full flex items-center justify-center gap-3 hover:border-primary-300 transition-colors"
          style={{ borderColor: themeColor + '40' }}
        >
          <span className="text-2xl">📄</span>
          <span className="font-medium" style={{ color: themeColor }}>צפייה בהסכם האירוע</span>
        </button>

        {/* Form Fields - Only show fields with required=true */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">פרטי הלקוח</h2>
          <div className="space-y-4">
            {data.event.fieldsSchema.filter(field => field.required).map((field) => (
              <div key={field.id}>
                <label className="input-label">
                  {field.label}
                  <span className="text-red-500 mr-1">*</span>
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className={`input min-h-[100px] ${errors[field.id] ? 'border-red-500' : ''}`}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                ) : (
                  <input
                    type={field.type}
                    className={`input ${errors[field.id] ? 'border-red-500' : ''}`}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    dir={field.type === 'email' || field.type === 'tel' ? 'ltr' : 'rtl'}
                  />
                )}
                {errors[field.id] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Signature Section */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            חתימה
            <span className="text-red-500 mr-1">*</span>
          </h2>
          <SignatureCanvas ref={sigRef} />
          {errors.signature && (
            <p className="text-red-500 text-sm mt-2">{errors.signature}</p>
          )}
        </div>

        {/* Email Copy Option */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantEmailCopy}
              onChange={(e) => setWantEmailCopy(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">לשלוח העתק למייל שלך?</span>
          </label>
          {wantEmailCopy && (
            <div className="mt-3">
              <input
                type="email"
                placeholder="הזן כתובת מייל"
                value={emailForCopy}
                onChange={(e) => setEmailForCopy(e.target.value)}
                className="input"
                dir="ltr"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn w-full text-white text-lg py-4 rounded-2xl shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              שולח...
            </span>
          ) : (
            '📤 שלחו את הטופס החתום'
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          מופעל על ידי הסכם דיגיטלי
        </p>
      </main>

      {/* Document Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto animate-scale-in">
            {/* Modal Header */}
            <div
              className="sticky top-0 px-6 py-4 border-b flex items-center justify-between"
              style={{ backgroundColor: themeColor, color: 'white' }}
            >
              <h2 className="font-semibold">פרטי ההסכם</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {data.event.businessName && (
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">{data.event.businessName}</h3>
                  {data.event.businessPhone && (
                    <p className="text-gray-500">{data.event.businessPhone}</p>
                  )}
                </div>
              )}

              <div className="text-right">
                <h4 className="font-semibold text-gray-700">שם מזמיני הארוע</h4>
                <p className="text-gray-900">{data.invite.customerName}</p>
              </div>

              {data.invite.customerPhone && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">טלפון (לוואטסאפ)</h4>
                  <p className="text-gray-900">{data.invite.customerPhone}</p>
                </div>
              )}

              {data.invite.customerEmail && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">אימייל</h4>
                  <p className="text-gray-900">{data.invite.customerEmail}</p>
                </div>
              )}

              {data.invite.eventType && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">סוג הארוע</h4>
                  <p className="text-gray-900">{data.invite.eventType}</p>
                </div>
              )}

              {data.invite.eventLocation && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">מיקום/כתובת הארוע</h4>
                  <p className="text-gray-900">{data.invite.eventLocation}</p>
                </div>
              )}

              {data.invite.notes && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">הערות</h4>
                  <p className="text-gray-900">{data.invite.notes}</p>
                </div>
              )}

              {data.event.location && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">מיקום</h4>
                  <p className="text-gray-900">{data.event.location}</p>
                </div>
              )}

              {data.event.eventDate && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">תאריך</h4>
                  <p className="text-gray-900">{new Date(data.event.eventDate).toLocaleDateString('he-IL')}</p>
                </div>
              )}

              {data.event.price && (
                <div className="text-right">
                  <h4 className="font-semibold text-gray-700">מחיר</h4>
                  <p className="text-gray-900 text-lg font-bold">₪{data.event.price.toLocaleString()}</p>
                </div>
              )}

              {data.event.defaultText && (
                <div className="bg-gray-50 rounded-xl p-4 mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">תקנון / תנאים</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{data.event.defaultText}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-primary w-full"
                style={{ backgroundColor: themeColor }}
              >
                סגור וחזור לטופס
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
