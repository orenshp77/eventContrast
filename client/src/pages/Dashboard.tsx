import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { eventsApi, invitesApi } from '../utils/api';
import { showConfirm, showToast } from '../utils/swal';

interface Event {
  id: number;
  title: string;
  eventDate?: string;
  inviteCount: number;
  themeColor: string;
  price?: number;
}

interface InviteFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventType: string;
  eventLocation: string;
  notes: string;
  price: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEvents: 0, totalInvites: 0, signedInvites: 0 });

  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventType: '',
    eventLocation: '',
    notes: '',
    price: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      const eventsData = response.data;
      setAllEvents(eventsData);
      setEvents(eventsData.slice(0, 3)); // Show only last 3

      // Calculate stats
      const totalInvites = eventsData.reduce((sum: number, e: Event) => sum + (e.inviteCount || 0), 0);
      setStats({
        totalEvents: eventsData.length,
        totalInvites,
        signedInvites: 0, // Would need separate API call
      });

      // Auto-select first event if only one exists
      if (eventsData.length === 1) {
        setSelectedEventId(eventsData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInviteModal = () => {
    if (allEvents.length === 0) {
      // No events, redirect to create one
      navigate('/events/new');
      return;
    }
    setShowInviteModal(true);
    setInviteLink(null);
    setInviteForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      eventType: '',
      eventLocation: '',
      notes: '',
      price: '',
    });
    if (allEvents.length === 1) {
      setSelectedEventId(allEvents[0].id);
      // Set default price from the event
      const defaultPrice = allEvents[0].price;
      if (defaultPrice) {
        setInviteForm(prev => ({ ...prev, price: defaultPrice.toString() }));
      }
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !inviteForm.customerName.trim()) return;

    setSubmitting(true);
    try {
      const response = await invitesApi.create(selectedEventId, inviteForm);
      const inviteUrl = `${window.location.origin}/invite/${response.data.token}`;
      setInviteLink(inviteUrl);
      fetchEvents(); // Refresh stats
    } catch (error) {
      console.error('Failed to create invite:', error);
      alert('שגיאה ביצירת ההסכם');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      alert('הקישור הועתק!');
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await showConfirm(
      'מחיקת אירוע',
      `האם למחוק את "${title}"? פעולה זו תמחק גם את כל ההסכמים.`
    );

    if (confirmed) {
      try {
        await eventsApi.delete(eventId);
        fetchEvents();
        showToast.success('האירוע נמחק בהצלחה');
      } catch (error) {
        showToast.error('שגיאה במחיקת האירוע');
      }
    }
  };

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          שלום, {user?.name} 👋
        </h1>
        <p className="text-gray-600">
          ברוך הבא למערכת ההסכמים הדיגיטליים
        </p>
      </div>

      {/* Info Notice */}
      <div className="bg-red-500 text-white rounded-xl p-4 mb-4">
        <p className="text-center text-sm" style={{ fontWeight: 400 }}>
          ניתן ליצור מספר סוגי הסכמים לכל מיני סוגי ארועים ואיתם לעבוד באופן קבוע
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.totalEvents}</div>
          <div className="text-sm text-gray-500">אירועים</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.totalInvites}</div>
          <div className="text-sm text-gray-500">הסכמים</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.signedInvites}</div>
          <div className="text-sm text-gray-500">נחתמו</div>
        </div>
      </div>

      {/* Big Create Invite Button */}
      <button
        onClick={handleOpenInviteModal}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="bg-white/20 rounded-full p-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">הסכם חדש</div>
            <div className="text-white/80 text-sm">צור הסכם ושלח ללקוח</div>
          </div>
        </div>
      </button>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/events/new"
          className="card flex flex-col items-center justify-center py-8 hover:border-primary-300 transition-colors"
        >
          <div className="text-4xl mb-2">➕</div>
          <span className="font-medium text-gray-700">יצירת סוג הסכם</span>
        </Link>
        <Link
          to="/events"
          className="card flex flex-col items-center justify-center py-8 hover:border-primary-300 transition-colors"
        >
          <div className="text-4xl mb-2">📅</div>
          <span className="font-medium text-gray-700">כל האירועים</span>
        </Link>
      </div>

      {/* Recent Events */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">אירועים אחרונים</h2>
          <Link to="/events" className="text-primary-600 text-sm font-medium">
            הצג הכל
          </Link>
        </div>

        {loading ? (
          <div className="card animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="card hover:border-primary-300 transition-colors"
              >
                <Link
                  to={`/events/${event.id}/invites`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: event.themeColor || '#7C3AED' }}
                    >
                      📅
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">סוג ההסכם: {event.title}</h3>
                      {event.eventDate && (
                        <p className="text-sm text-gray-500">
                          {new Date(event.eventDate).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-900">{event.inviteCount}</div>
                    <div className="text-xs text-gray-500">הסכמים</div>
                  </div>
                </Link>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Link
                    to={`/events/${event.id}/invites`}
                    className="btn btn-primary flex-1 text-sm py-2"
                  >
                    ניהול הסכמי לקוחות
                  </Link>
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="btn btn-secondary text-sm py-2"
                  >
                    ערוך
                  </Link>
                  <button
                    onClick={(e) => handleDeleteEvent(e, event.id, event.title)}
                    className="btn btn-danger text-sm py-2"
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500 mb-4">עדיין אין לך אירועים</p>
            <Link to="/events/new" className="btn btn-primary">
              צור הסכם ראשון
            </Link>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold">הסכם חדש</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {inviteLink ? (
                /* Success State */
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ההסכם נוצר בהצלחה!</h3>
                  <p className="text-gray-500 text-sm mb-4">שלח את הקישור ללקוח</p>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 break-all" dir="ltr">{inviteLink}</p>
                  </div>

                  <div className="space-y-3">
                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`שלום,\nמצורף קישור להסכם:\n${inviteLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 py-3"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      שלח בוואטסאפ
                    </a>

                    {/* Email Button */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent('קישור להסכם')}&body=${encodeURIComponent(`שלום,\n\nמצורף קישור להסכם:\n${inviteLink}\n\nתודה!`)}`}
                      className="w-full btn bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 py-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      שלח במייל
                    </a>

                    {/* Copy Link Button */}
                    <button
                      onClick={copyInviteLink}
                      className="w-full btn bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 py-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      העתק קישור
                    </button>

                    {/* Close Button */}
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="w-full btn bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center gap-2 py-3"
                    >
                      סגור
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setInviteLink(null);
                      const selectedEvent = allEvents.find(e => e.id === selectedEventId);
                      setInviteForm({
                        customerName: '',
                        customerPhone: '',
                        customerEmail: '',
                        eventType: '',
                        eventLocation: '',
                        notes: '',
                        price: selectedEvent?.price?.toString() || '',
                      });
                    }}
                    className="mt-4 text-primary-600 font-medium"
                  >
                    צור הסכם נוסף
                  </button>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleCreateInvite}>
                  {/* Event Selection */}
                  {allEvents.length > 1 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        סוג ההסכם
                      </label>
                      <select
                        value={selectedEventId || ''}
                        onChange={(e) => {
                          const eventId = Number(e.target.value);
                          setSelectedEventId(eventId);
                          const selectedEvent = allEvents.find(ev => ev.id === eventId);
                          if (selectedEvent?.price) {
                            setInviteForm(prev => ({ ...prev, price: selectedEvent.price!.toString() }));
                          } else {
                            setInviteForm(prev => ({ ...prev, price: '' }));
                          }
                        }}
                        className="input"
                        required
                      >
                        <option value="">בחר סוג הסכם...</option>
                        {allEvents.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {allEvents.length === 1 && (
                    <div className="mb-4 bg-primary-50 rounded-lg p-3">
                      <p className="text-sm text-primary-700">
                        סוג ההסכם: <strong>{allEvents[0].title}</strong>
                      </p>
                    </div>
                  )}

                  {/* Price Section */}
                  {selectedEventId && (() => {
                    const selectedEvent = allEvents.find(e => e.id === selectedEventId);
                    return selectedEvent?.price ? (
                      <div className="mb-4 bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-700 mb-3">
                          ראינו שהמחיר שרשמתם הינו: <strong>{selectedEvent.price} ש"ח</strong>
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            האם לשנות את המחיר?
                          </label>
                          <input
                            type="number"
                            value={inviteForm.price}
                            onChange={(e) => setInviteForm({ ...inviteForm, price: e.target.value })}
                            className="input"
                            placeholder={selectedEvent.price.toString()}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Customer Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם מזמיני הארוע *
                    </label>
                    <input
                      type="text"
                      value={inviteForm.customerName}
                      onChange={(e) => setInviteForm({ ...inviteForm, customerName: e.target.value })}
                      className="input"
                      placeholder="שם מלא"
                      required
                    />
                  </div>

                  {/* Customer Phone */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      טלפון
                    </label>
                    <input
                      type="tel"
                      value={inviteForm.customerPhone}
                      onChange={(e) => setInviteForm({ ...inviteForm, customerPhone: e.target.value })}
                      className="input"
                      placeholder="050-0000000"
                      dir="ltr"
                    />
                  </div>

                  {/* Customer Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      אימייל
                    </label>
                    <input
                      type="email"
                      value={inviteForm.customerEmail}
                      onChange={(e) => setInviteForm({ ...inviteForm, customerEmail: e.target.value })}
                      className="input"
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>

                  {/* Event Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סוג הארוע
                    </label>
                    <input
                      type="text"
                      value={inviteForm.eventType}
                      onChange={(e) => setInviteForm({ ...inviteForm, eventType: e.target.value })}
                      className="input"
                      placeholder="חתונה, בר מצווה, ימי הולדת..."
                    />
                  </div>

                  {/* Event Location */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      מיקום/כתובת הארוע
                    </label>
                    <input
                      type="text"
                      value={inviteForm.eventLocation}
                      onChange={(e) => setInviteForm({ ...inviteForm, eventLocation: e.target.value })}
                      className="input"
                      placeholder="כתובת האירוע"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      הערות
                    </label>
                    <textarea
                      value={inviteForm.notes}
                      onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="הערות נוספות..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !selectedEventId}
                    className="w-full btn btn-primary py-3 text-lg disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        יוצר הסכם...
                      </span>
                    ) : (
                      'צור הסכם'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
