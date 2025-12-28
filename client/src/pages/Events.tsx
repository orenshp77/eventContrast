import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi, invitesApi } from '../utils/api';
import { showConfirm, showToast } from '../utils/swal';
import Swal from 'sweetalert2';

interface Event {
  id: number;
  title: string;
  description?: string;
  location?: string;
  eventDate?: string;
  price?: number;
  inviteCount: number;
  themeColor: string;
  createdAt: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (error) {
      showToast.error('שגיאה בטעינת האירועים');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    const confirmed = await showConfirm(
      'מחיקת אירוע',
      `האם אתה בטוח שברצונך למחוק את "${title}"? פעולה זו תמחק גם את כל ההסכמים.`
    );

    if (confirmed) {
      try {
        await eventsApi.delete(id);
        setEvents(events.filter(e => e.id !== id));
        showToast.success('האירוע נמחק בהצלחה');
      } catch (error) {
        showToast.error('שגיאה במחיקת האירוע');
      }
    }
  };

  const handleCreateInvite = async () => {
    if (events.length === 0) {
      showToast.error('יש ליצור אירוע לפני יצירת הסכם');
      return;
    }

    // Build event options for selection with data attributes for price and date
    const eventOptions = events.map(e => `<option value="${e.id}" data-price="${e.price || 0}" data-date="${e.eventDate ? e.eventDate.split('T')[0] : ''}">${e.title}</option>`).join('');
    const firstEvent = events[0];
    const firstEventPrice = firstEvent?.price || 0;
    const firstEventDate = firstEvent?.eventDate ? firstEvent.eventDate.split('T')[0] : '';

    const { value: formValues } = await Swal.fire({
      title: 'הסכם חדש ללקוח',
      html: `
        <div class="space-y-4 text-right" dir="rtl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">סוג ההסכם *</label>
            <select id="swal-event" class="w-full px-4 py-2 border rounded-lg">
              ${eventOptions}
            </select>
          </div>
          <div id="price-section" class="${firstEventPrice > 0 ? '' : 'hidden'}">
            <div class="bg-blue-50 rounded-lg p-3 mb-2">
              <p class="text-sm text-blue-700 mb-2">ראינו שהמחיר שרשמתם הינו: <strong id="event-price-display">${firstEventPrice}</strong> ש"ח</p>
              <label class="block text-sm font-medium text-gray-700 mb-1">האם לשנות את המחיר?</label>
              <input id="swal-price" type="number" class="w-full px-4 py-2 border rounded-lg" value="${firstEventPrice}" min="0" step="0.01">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">תאריך האירוע</label>
            <input id="swal-event-date" type="date" class="w-full px-4 py-2 border rounded-lg" value="${firstEventDate}" dir="ltr">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">שם מזמיני הארוע *</label>
            <input id="swal-name" class="w-full px-4 py-2 border rounded-lg" placeholder="שם מלא">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">טלפון (לוואטסאפ)</label>
            <input id="swal-phone" class="w-full px-4 py-2 border rounded-lg" placeholder="050-0000000" dir="ltr">
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
            <textarea id="swal-notes" class="w-full px-4 py-2 border rounded-lg" rows="2" placeholder="הערות נוספות..."></textarea>
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
      didOpen: () => {
        // Update price and date when event selection changes
        const eventSelect = document.getElementById('swal-event') as HTMLSelectElement;
        const priceSection = document.getElementById('price-section');
        const priceDisplay = document.getElementById('event-price-display');
        const priceInput = document.getElementById('swal-price') as HTMLInputElement;
        const eventDateInput = document.getElementById('swal-event-date') as HTMLInputElement;

        eventSelect?.addEventListener('change', () => {
          const selectedOption = eventSelect.options[eventSelect.selectedIndex];
          const price = parseFloat(selectedOption.getAttribute('data-price') || '0');
          const date = selectedOption.getAttribute('data-date') || '';

          if (price > 0) {
            priceSection?.classList.remove('hidden');
            if (priceDisplay) priceDisplay.textContent = price.toString();
            if (priceInput) priceInput.value = price.toString();
          } else {
            priceSection?.classList.add('hidden');
          }

          if (eventDateInput) eventDateInput.value = date;
        });
      },
      preConfirm: () => {
        const eventId = (document.getElementById('swal-event') as HTMLSelectElement).value;
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        const eventType = (document.getElementById('swal-event-type') as HTMLInputElement).value;
        const eventLocation = (document.getElementById('swal-location') as HTMLInputElement).value;
        const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement).value;
        const priceInput = document.getElementById('swal-price') as HTMLInputElement;
        const price = priceInput?.value ? parseFloat(priceInput.value) : undefined;
        const eventDate = (document.getElementById('swal-event-date') as HTMLInputElement).value;

        if (!name) {
          Swal.showValidationMessage('שם מזמיני הארוע הוא שדה חובה');
          return false;
        }
        return { eventId: Number(eventId), name, phone, eventType, eventLocation, notes, price, eventDate };
      },
    });

    if (formValues) {
      try {
        const response = await invitesApi.create(formValues.eventId, {
          customerName: formValues.name,
          customerPhone: formValues.phone,
          eventType: formValues.eventType || undefined,
          eventLocation: formValues.eventLocation || undefined,
          notes: formValues.notes,
          price: formValues.price,
          eventDate: formValues.eventDate || undefined,
        });
        const newInvite = response.data;
        const inviteUrl = `${window.location.origin}/invite/${newInvite.token}`;
        const selectedEvent = events.find(e => e.id === formValues.eventId);

        const whatsappMessage = encodeURIComponent(
          `שלום ${newInvite.customerName},\n\nהוזמנת לחתום על מסמך: ${selectedEvent?.title}\n\nלחץ על הקישור:\n${inviteUrl}`
        );
        const whatsappUrl = newInvite.customerPhone
          ? `https://wa.me/${newInvite.customerPhone.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
          : null;

        await Swal.fire({
          title: 'ההסכם נוצר!',
          html: `
            <div class="space-y-3" dir="rtl">
              <button id="swal-whatsapp" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #25D366;">
                שלח בוואטסאפ
              </button>
              <button id="swal-email" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #3B82F6;">
                שלח במייל
              </button>
              <button id="swal-copy" class="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2" style="background-color: #DC2626;">
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
            document.getElementById('swal-whatsapp')?.addEventListener('click', () => {
              if (whatsappUrl) {
                window.open(whatsappUrl, '_blank');
              } else {
                navigator.clipboard.writeText(inviteUrl);
                showToast.success('הקישור הועתק! (לא הוזן טלפון)');
              }
              Swal.close();
            });
            document.getElementById('swal-email')?.addEventListener('click', async () => {
              Swal.close();
              const { value: email } = await Swal.fire({
                title: 'שלח קישור במייל',
                input: 'email',
                inputPlaceholder: 'הזן כתובת מייל',
                showCancelButton: true,
                confirmButtonText: 'שלח',
                cancelButtonText: 'ביטול',
                confirmButtonColor: '#7C3AED',
                customClass: {
                  popup: 'swal2-rtl',
                  input: 'text-left',
                },
                inputValidator: (value) => {
                  if (!value) return 'נא להזין כתובת מייל';
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'כתובת מייל לא תקינה';
                  return null;
                },
              });
              if (email) {
                const subject = encodeURIComponent('הזמנה לחתום על הסכם - ' + (selectedEvent?.title || ''));
                const body = encodeURIComponent('שלום,\n\nמוזמן/ת לחתום על ההסכם בקישור הבא:\n' + inviteUrl + '\n\nתודה!');
                const mailtoUrl = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
                window.open(mailtoUrl, '_blank');
                showToast.success('נפתח חלון שליחת מייל');
              }
            });
            document.getElementById('swal-copy')?.addEventListener('click', () => {
              navigator.clipboard.writeText(inviteUrl);
              showToast.success('הקישור הועתק!');
              Swal.close();
            });
          },
        });

        fetchEvents(); // Refresh to update invite counts
      } catch (error) {
        showToast.error('שגיאה ביצירת ההסכם');
      }
    }
  };

  return (
    <Layout title="חזרה" showBack>
      {/* Header with Add Buttons */}
      <div className="flex flex-col items-center text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">הסכמים שיצרתי ללקוחות</h1>
        <div className="flex gap-2 w-full">
          <button onClick={handleCreateInvite} className="btn btn-primary flex-1">
            הסכם חדש ללקוח
          </button>
          <Link to="/events/new" className="btn btn-secondary flex-1">
            יצירת סוג הסכם נוסף
          </Link>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Event Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0"
                  style={{ backgroundColor: event.themeColor || '#7C3AED' }}
                >
                  📅
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-500 truncate">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {event.eventDate && (
                      <span className="flex items-center gap-1">
                        📆 {new Date(event.eventDate).toLocaleDateString('he-IL')}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        📍 {event.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Invite Count */}
                <div className="text-center flex-shrink-0">
                  <div className="text-2xl font-bold text-primary-600">{event.inviteCount}</div>
                  <div className="text-xs text-gray-500">הסכמים</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Link
                    to={`/events/${event.id}/invites`}
                    className="btn btn-primary flex-1"
                  >
                    הסכמים שיצרתי ללקוחות
                  </Link>
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="btn btn-secondary flex-1"
                  >
                    שינוי פרטי סוג ההסכם
                  </Link>
                </div>
                <button
                  onClick={() => handleDelete(event.id, event.title)}
                  className="btn btn-danger w-full"
                >
                  מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">אין אירועים עדיין</h3>
          <p className="text-gray-500 mb-6">צור את האירוע הראשון שלך כדי להתחיל לשלוח הסכמים</p>
          <Link to="/events/new" className="btn btn-primary">
            צור אירוע חדש
          </Link>
        </div>
      )}
    </Layout>
  );
}
