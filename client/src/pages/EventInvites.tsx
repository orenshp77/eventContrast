import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi, invitesApi } from '../utils/api';
import { showConfirm, showToast, showLoading, hideLoading } from '../utils/swal';
import Swal from 'sweetalert2';
import { generatePdfFromHtml, openPdfInNewTab } from '../utils/pdfGenerator';

interface Invite {
  id: number;
  token: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  eventType?: string;
  eventLocation?: string;
  notes?: string;
  price?: number;
  eventDate?: string;
  status: 'CREATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'RETURNED';
  createdAt: string;
  submission?: {
    signedPdfPath?: string;
    signaturePng?: string;
    payload?: Record<string, any>;
    submittedAt: string;
  };
}

interface Event {
  id: number;
  title: string;
  description?: string;
  themeColor: string;
  price?: number;
  eventDate?: string;
  defaultText?: string;
  businessName?: string;
  businessPhone?: string;
}

export default function EventInvites() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling function to refresh invites silently
  const refreshInvites = useCallback(async () => {
    if (!id) return;
    try {
      const invitesRes = await invitesApi.getByEvent(Number(id));
      setInvites(invitesRes.data);
    } catch (error) {
      // Silent fail for polling
    }
  }, [id]);

  // Start polling when component mounts
  useEffect(() => {
    fetchData();

    // Start polling every 5 seconds
    pollingRef.current = setInterval(refreshInvites, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id, refreshInvites]);

  const fetchData = async () => {
    try {
      const [eventRes, invitesRes] = await Promise.all([
        eventsApi.getOne(Number(id)),
        invitesApi.getByEvent(Number(id)),
      ]);
      setEvent(eventRes.data);
      setInvites(invitesRes.data);
    } catch (error) {
      showToast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    const defaultPrice = event?.price || 0;
    const priceSection = defaultPrice > 0 ? `
          <div class="bg-blue-50 rounded-lg p-3 mb-2">
            <p class="text-sm text-blue-700 mb-2">ראינו שהמחיר שרשמתם הינו: <strong>${defaultPrice} ש"ח</strong></p>
            <label class="block text-sm font-medium text-gray-700 mb-1">האם לשנות את המחיר?</label>
            <input id="swal-price" type="number" class="w-full px-4 py-2 border rounded-lg" value="${defaultPrice}" min="0" step="0.01">
          </div>
    ` : '';

    const { value: formValues } = await Swal.fire({
      title: 'הסכם חדש',
      html: `
        <div class="space-y-4 text-right" dir="rtl">
          ${priceSection}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">שם מלא של מזמיני הארוע *</label>
            <input id="swal-name" class="w-full px-4 py-2 border rounded-lg" placeholder="שם מלא">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">טלפון (לוואטסאפ)</label>
            <input id="swal-phone" class="w-full px-4 py-2 border rounded-lg" placeholder="050-0000000" dir="ltr">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input id="swal-email" class="w-full px-4 py-2 border rounded-lg" placeholder="email@example.com" dir="ltr">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">תאריך הארוע</label>
            <input id="swal-date" type="date" class="w-full px-4 py-2 border rounded-lg" value="${event?.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ''}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">סוג הארוע</label>
            <input id="swal-event-type" class="w-full px-4 py-2 border rounded-lg" placeholder="חתונה, בר מצווה, ימי הולדת...">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">מיקום/כתובת הארוע</label>
            <input id="swal-location" class="w-full px-4 py-2 border rounded-lg" placeholder="כתובת האירוע">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea id="swal-notes" class="w-full px-4 py-2 border rounded-lg" rows="2"></textarea>
          </div>
        </div>
      `,
      customClass: {
        popup: 'swal2-rtl',
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'צור הסכם',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#7C3AED',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name) {
          Swal.showValidationMessage('שם מזמיני הארוע הוא שדה חובה');
          return false;
        }
        const priceInput = document.getElementById('swal-price') as HTMLInputElement;
        const dateInput = document.getElementById('swal-date') as HTMLInputElement;
        return {
          customerName: name,
          customerPhone: (document.getElementById('swal-phone') as HTMLInputElement).value,
          customerEmail: (document.getElementById('swal-email') as HTMLInputElement).value,
          eventDate: dateInput ? dateInput.value : undefined,
          eventType: (document.getElementById('swal-event-type') as HTMLInputElement).value,
          eventLocation: (document.getElementById('swal-location') as HTMLInputElement).value,
          notes: (document.getElementById('swal-notes') as HTMLTextAreaElement).value,
          price: priceInput ? priceInput.value : undefined,
        };
      },
    });

    if (formValues) {
      try {
        const response = await invitesApi.create(Number(id), formValues);
        const newInvite = response.data;
        setInvites([newInvite, ...invites]);

        // Show success with share options
        const inviteUrl = `${window.location.origin}/invite/${newInvite.token}`;
        const whatsappMessage = encodeURIComponent(
          `שלום ${newInvite.customerName},\n\nהוזמנת לחתום על מסמך: ${event?.title}\n\nלחץ על הקישור:\n${inviteUrl}`
        );
        const whatsappUrl = newInvite.customerPhone
          ? `https://wa.me/${newInvite.customerPhone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
          : null;

        await Swal.fire({
          title: 'ההסכם נוצר!',
          html: `
            <div class="space-y-4 text-right" dir="rtl">
              <p class="text-gray-600">קישור להסכם:</p>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value="${inviteUrl}"
                  readonly
                  class="flex-1 px-3 py-2 bg-gray-100 border rounded-lg text-sm"
                  dir="ltr"
                >
                <button
                  onclick="navigator.clipboard.writeText('${inviteUrl}'); this.textContent='הועתק!'"
                  class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                >
                  העתק
                </button>
              </div>
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          showDenyButton: whatsappUrl ? true : false,
          confirmButtonText: whatsappUrl ? '📱 שלח בוואטסאפ' : 'סגור',
          denyButtonText: '📧 שלח במייל',
          cancelButtonText: 'סגור',
          confirmButtonColor: whatsappUrl ? '#25D366' : '#7C3AED',
          denyButtonColor: '#3B82F6',
          customClass: {
            popup: 'swal2-rtl',
          },
        }).then((result) => {
          if (result.isConfirmed && whatsappUrl) {
            window.open(whatsappUrl, '_blank');
          }
        });

      } catch (error) {
        showToast.error('שגיאה ביצירת ההסכם');
      }
    }
  };

  const handleDelete = async (invite: Invite) => {
    const confirmed = await showConfirm(
      'מחיקת הסכם',
      `האם למחוק את ההסכם של ${invite.customerName}?`
    );

    if (confirmed) {
      try {
        await invitesApi.delete(invite.id);
        setInvites(invites.filter(i => i.id !== invite.id));
        showToast.success('ההסכם נמחק');
      } catch (error) {
        showToast.error('שגיאה במחיקת ההסכם');
      }
    }
  };

  const handleViewSignedPdf = async (invite: Invite) => {
    if (!invite.submission || !event) {
      showToast.error('לא נמצאו נתוני ההסכם');
      return;
    }

    showLoading('מייצר PDF...');

    try {
      const pdfBlob = await generatePdfFromHtml({
        event: {
          title: event.title,
          description: event.description,
          themeColor: event.themeColor,
          price: invite.price || event.price,
          eventDate: invite.eventDate || event.eventDate,
          defaultText: event.defaultText,
          businessName: event.businessName,
          businessPhone: event.businessPhone,
        },
        customer: {
          name: invite.customerName,
          phone: invite.customerPhone,
          email: invite.customerEmail,
          eventType: invite.eventType,
          eventLocation: invite.eventLocation,
          notes: invite.notes,
          ...(invite.submission.payload || {}),
        },
        signature: invite.submission.signaturePng || '',
        submittedAt: new Date(invite.submission.submittedAt),
      });

      hideLoading();
      openPdfInNewTab(pdfBlob);
    } catch (error) {
      hideLoading();
      console.error('PDF generation error:', error);
      showToast.error('שגיאה ביצירת PDF');
    }
  };

  const handleResend = async (invite: Invite) => {
    const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
    const whatsappMessage = encodeURIComponent(
      `שלום ${invite.customerName},\n\nתזכורת: הוזמנת לחתום על מסמך: ${event?.title}\n\nלחץ על הקישור:\n${inviteUrl}`
    );
    const whatsappUrl = invite.customerPhone
      ? `https://wa.me/${invite.customerPhone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
      : null;

    const hasSubmission = !!invite.submission;

    await Swal.fire({
      title: 'בחר פעולה',
      html: `
        <div class="space-y-3" dir="rtl">
          ${hasSubmission ? `
            <button id="action-pdf" class="w-full px-4 py-3 rounded-lg text-white font-medium" style="background-color: #8B5CF6;">
              📄 פתח PDF
            </button>
          ` : ''}
          <button id="action-whatsapp" class="w-full px-4 py-3 rounded-lg text-white font-medium" style="background-color: #25D366;">
            שלח בוואטסאפ
          </button>
          <button id="action-email" class="w-full px-4 py-3 rounded-lg text-white font-medium" style="background-color: #3B82F6;">
            שלח במייל
          </button>
          <button id="action-copy" class="w-full px-4 py-3 rounded-lg text-white font-medium" style="background-color: #EF4444;">
            📋 העתק קישור
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: 'swal2-rtl',
      },
      didOpen: () => {
        const pdfBtn = document.getElementById('action-pdf');
        const whatsappBtn = document.getElementById('action-whatsapp');
        const emailBtn = document.getElementById('action-email');
        const copyBtn = document.getElementById('action-copy');

        if (pdfBtn) {
          pdfBtn.addEventListener('click', () => {
            Swal.close();
            handleViewSignedPdf(invite);
          });
        }

        whatsappBtn?.addEventListener('click', () => {
          Swal.close();
          if (whatsappUrl) {
            window.open(whatsappUrl, '_blank');
          } else {
            showToast.error('לא הוזן מספר טלפון');
          }
        });

        emailBtn?.addEventListener('click', async () => {
          Swal.close();
          const { value: email } = await Swal.fire({
            title: 'שלח במייל',
            input: 'email',
            inputLabel: 'הזן כתובת מייל',
            inputValue: invite.customerEmail || '',
            inputPlaceholder: 'email@example.com',
            showCancelButton: true,
            confirmButtonText: 'שלח',
            cancelButtonText: 'ביטול',
            confirmButtonColor: '#7C3AED',
            customClass: {
              popup: 'swal2-rtl',
            },
          });
          if (email) {
            showToast.success(`נשלח אל ${email}`);
            // TODO: Implement actual email sending
          }
        });

        copyBtn?.addEventListener('click', () => {
          Swal.close();
          navigator.clipboard.writeText(inviteUrl);
          showToast.success('הקישור הועתק!');
        });
      },
    });
  };

  const handleView = (invite: Invite) => {
    const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
    window.open(inviteUrl, '_blank');
  };

  const handleEdit = async (invite: Invite) => {
    // Use invite price if exists, otherwise use event default price
    const displayPrice = invite.price ?? event?.price ?? '';
    // Use invite date if exists, otherwise use event default date
    // Handle different date formats from API
    const formatDate = (dateStr: string | undefined): string => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };
    const inviteDate = formatDate(invite.eventDate);
    const eventDefaultDate = formatDate(event?.eventDate);
    const displayDate = inviteDate || eventDefaultDate;

    const { value: formValues } = await Swal.fire({
      title: 'עריכת הסכם',
      html: `
        <div class="space-y-4 text-right" dir="rtl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">תאריך האירוע</label>
            <input id="swal-event-date" type="date" class="w-full px-4 py-2 border rounded-lg" value="${displayDate}" dir="ltr">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">שם מזמיני הארוע *</label>
            <input id="swal-name" class="w-full px-4 py-2 border rounded-lg" value="${invite.customerName || ''}" placeholder="שם מלא">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">טלפון (לוואטסאפ)</label>
            <input id="swal-phone" class="w-full px-4 py-2 border rounded-lg" value="${invite.customerPhone || ''}" placeholder="050-0000000" dir="ltr">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input id="swal-email" class="w-full px-4 py-2 border rounded-lg" value="${invite.customerEmail || ''}" placeholder="email@example.com" dir="ltr">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">סוג הארוע</label>
            <input id="swal-event-type" class="w-full px-4 py-2 border rounded-lg" value="${invite.eventType || ''}" placeholder="חתונה, בר מצווה, ימי הולדת...">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">מיקום/כתובת הארוע</label>
            <input id="swal-location" class="w-full px-4 py-2 border rounded-lg" value="${invite.eventLocation || ''}" placeholder="כתובת האירוע">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">מחיר</label>
            <input id="swal-price" type="number" class="w-full px-4 py-2 border rounded-lg" value="${displayPrice}" min="0" step="0.01">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea id="swal-notes" class="w-full px-4 py-2 border rounded-lg" rows="2">${invite.notes || ''}</textarea>
          </div>
        </div>
      `,
      customClass: {
        popup: 'swal2-rtl',
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'שמור שינויים',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#7C3AED',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!name) {
          Swal.showValidationMessage('שם מזמיני הארוע הוא שדה חובה');
          return false;
        }
        const priceInput = document.getElementById('swal-price') as HTMLInputElement;
        const eventDateInput = document.getElementById('swal-event-date') as HTMLInputElement;
        return {
          customerName: name,
          customerPhone: (document.getElementById('swal-phone') as HTMLInputElement).value,
          customerEmail: (document.getElementById('swal-email') as HTMLInputElement).value,
          eventType: (document.getElementById('swal-event-type') as HTMLInputElement).value,
          eventLocation: (document.getElementById('swal-location') as HTMLInputElement).value,
          notes: (document.getElementById('swal-notes') as HTMLTextAreaElement).value,
          price: priceInput.value ? parseFloat(priceInput.value) : undefined,
          eventDate: eventDateInput.value || undefined,
        };
      },
    });

    if (formValues) {
      try {
        await invitesApi.update(invite.id, formValues);
        setInvites(invites.map(i =>
          i.id === invite.id
            ? { ...i, ...formValues }
            : i
        ));
        showToast.success('ההסכם עודכן בהצלחה');
      } catch (error) {
        showToast.error('שגיאה בעדכון ההסכם');
      }
    }
  };

  if (loading) {
    return (
      <Layout title="חזרה" showBack>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="חזרה" showBack>
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">{event?.title}</h1>
          <p className="text-base text-gray-500">{invites.length} הסכמים</p>
        </div>
        <button onClick={handleCreateInvite} className="btn btn-primary text-lg px-8">
          + הסכם חדש ללקוח
        </button>
      </div>

      {/* Invites List */}
      {invites.length > 0 ? (
        <div className="space-y-4">
          {invites.map((invite, index) => (
            <div
              key={invite.id}
              className="card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    <span className="text-gray-500 font-normal">שם מזמיני הארוע: </span>
                    {invite.customerName}
                  </h3>
                  <div className="flex flex-col gap-1 mt-1 text-sm text-gray-500">
                    {invite.customerPhone && (
                      <span className="flex items-center gap-1">
                        טלפון הלקוח: {invite.customerPhone}
                      </span>
                    )}
                    {(invite.eventDate || event?.eventDate) && (
                      <span className="flex items-center gap-1">
                        תאריך האירוע: {new Date(invite.eventDate || event?.eventDate || '').toLocaleDateString('he-IL')}
                      </span>
                    )}
                    {/* Status Row */}
                    <div className="flex items-center gap-2 mt-1 py-1.5 px-2 rounded bg-gray-100">
                      <span className="text-gray-600">סטטוס:</span>
                      {(invite.status === 'SIGNED' || invite.status === 'RETURNED') ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500 text-white">
                          הלקוח חתם על ההסכם
                        </span>
                      ) : invite.status === 'VIEWED' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-white">
                          הלקוח פתח קישור
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                          לא נחתם
                        </span>
                      )}
                    </div>
                    {invite.customerEmail && (
                      <span className="flex items-center gap-1">
                        📧 {invite.customerEmail}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-4">
                נוצר: {new Date(invite.createdAt).toLocaleDateString('he-IL')}
                {invite.submission && (
                  <span className="mr-3">
                    | נחתם: {new Date(invite.submission.submittedAt).toLocaleDateString('he-IL')}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleView(invite)}
                  className="btn btn-secondary text-sm py-2"
                >
                  👁️ צפייה בעמוד לקוח
                </button>
                {invite.submission && (
                  <button
                    onClick={() => handleViewSignedPdf(invite)}
                    className="btn text-sm py-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    📄 צפייה בהסכם חתום
                  </button>
                )}
                <button
                  onClick={() => handleEdit(invite)}
                  className="btn btn-secondary text-sm py-2"
                >
                  ✏️ שינוי פרטי ההסכם
                </button>
                <button
                  onClick={() => handleResend(invite)}
                  className="btn btn-whatsapp text-sm py-2"
                >
                  📱 שלחו את ההסכם
                </button>
                <button
                  onClick={() => handleDelete(invite)}
                  className="btn btn-danger text-sm py-2"
                >
                  🗑️ מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">אין הסכמים עדיין</h3>
          <p className="text-gray-500 mb-6">צור הסכם ראשון ושלח אותו ללקוח</p>
          <button onClick={handleCreateInvite} className="btn btn-primary">
            צור הסכם חדש ללקוח
          </button>
        </div>
      )}
    </Layout>
  );
}
