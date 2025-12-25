import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../utils/api';
import { showToast } from '../utils/swal';

// תקנונים מוכנים לבחירה
const TERMS_TEMPLATES = [
  {
    id: 'dj',
    name: 'תקנון DJ / מוזיקה',
    content: `תנאי התקשרות - שירותי DJ ומוזיקה

1. מקדמה: תשלום מקדמה בסך 30% מערך העסקה נדרש לאישור ההזמנה. יתרת התשלום תשולם עד 7 ימים לפני מועד האירוע.

2. ביטולים: ביטול עד 30 יום לפני האירוע - החזר מלא של המקדמה. ביטול בין 30 ל-14 ימים - החזר 50%. ביטול פחות מ-14 ימים - ללא החזר.

3. ציוד: כל הציוד המקצועי (מערכת הגברה, תאורה, מיקרופונים) יסופק על ידי נותן השירות ומותאם לגודל האירוע.

4. שעות עבודה: השירות כולל עד 6 שעות רצופות. כל שעה נוספת תחויב בתוספת של 300 ש"ח.

5. הפסקות: נותן השירות זכאי להפסקה של 15 דקות לכל 3 שעות עבודה.

6. בקשות מיוחדות: רשימת שירים ובקשות מיוחדות יש להעביר עד 48 שעות לפני האירוע.

7. אחריות: נותן השירות אינו אחראי לנזקים הנגרמים על ידי צד שלישי או תקלות חשמל שאינן בשליטתו.`
  },
  {
    id: 'photo',
    name: 'תקנון צילום / וידאו',
    content: `תנאי התקשרות - שירותי צילום ווידאו

1. מקדמה: תשלום מקדמה בסך 40% מערך העסקה לשריון התאריך. יתרת התשלום במועד האירוע.

2. זכויות יוצרים: כל התמונות והסרטונים שייכים לצלם עד לתשלום מלא. לאחר התשלום, הלקוח מקבל זכות שימוש מלאה.

3. זמני אספקה: אלבום דיגיטלי תוך 30 יום. סרטון מעובד תוך 60 יום. תמונות ערוכות תוך 21 יום.

4. גיבוי: הצלם ישמור גיבוי של החומרים למשך שנה מיום האירוע.

5. ביטולים: ביטול עד 60 יום - החזר מלא. ביטול 30-60 יום - החזר 70%. ביטול פחות מ-30 יום - ללא החזר.

6. שימוש לתיק עבודות: הצלם רשאי להשתמש בתמונות נבחרות לצורך פרסום ותיק עבודות, אלא אם נאמר אחרת.

7. כוח עליון: במקרה של מחלה או אירוע בלתי צפוי, הצלם יספק צלם חלופי באותה רמה מקצועית.`
  },
  {
    id: 'venue',
    name: 'תקנון אולם / מקום אירוע',
    content: `תנאי שימוש - אולם אירועים

1. תשלום: מקדמה של 25% לשריון התאריך. 50% נוספים חודש לפני האירוע. יתרה ביום האירוע.

2. שעות שימוש: האולם זמין 4 שעות לפני האירוע להכנות ועד שעתיים לאחר סיום.

3. מספר אורחים: המחיר מבוסס על מספר האורחים המוזמנים. חריגה של מעל 10% תחויב בתוספת.

4. קייטרינג: השימוש באולם מותנה בהזמנת קייטרינג מרשימת הספקים המאושרים.

5. נזקים: המזמין אחראי לכל נזק שייגרם לאולם או לציוד במהלך האירוע.

6. רעש: יש לסיים את המוזיקה עד השעה 00:00 בהתאם לתקנות העירייה.

7. ביטולים: ביטול עד 90 יום - החזר מלא פחות 500 ש"ח דמי טיפול. ביטול 60-90 יום - החזר 75%. ביטול 30-60 יום - החזר 50%. פחות מ-30 יום - ללא החזר.

8. ביטוח: המזמין נדרש להצהיר על ביטוח צד ג' לאירוע.`
  },
  {
    id: 'catering',
    name: 'תקנון קייטרינג / מזון',
    content: `תנאי התקשרות - שירותי קייטרינג

1. הזמנה מינימלית: הזמנה מינימלית של 50 מנות. מספר המנות הסופי יימסר 10 ימים לפני האירוע.

2. מקדמה: 30% מקדמה בעת ההזמנה. יתרת התשלום 7 ימים לפני האירוע.

3. תפריט: התפריט הסופי ייקבע עד 14 יום לפני האירוע. שינויים לאחר מכן עלולים להיות כרוכים בתוספת תשלום.

4. אלרגיות: יש לדווח על אלרגיות ודרישות תזונתיות מיוחדות עד 7 ימים לפני האירוע.

5. ציוד: מחיר הקייטרינג כולל כלים חד-פעמיים איכותיים. כלים אמיתיים בתוספת תשלום.

6. שאריות: שאריות המזון שייכות ללקוח. ניתן לארוז לקחת.

7. ביטולים: ביטול עד 14 יום - החזר מלא פחות 10% דמי ביטול. ביטול 7-14 יום - החזר 50%. פחות מ-7 ימים - ללא החזר.

8. כשרות: המזון מוכן תחת השגחת הרבנות המקומית (יש לציין אם נדרש).`
  },
  {
    id: 'general',
    name: 'תקנון כללי לאירועים',
    content: `תנאים כלליים להתקשרות

1. אישור הזמנה: ההזמנה תיחשב מאושרת רק לאחר תשלום המקדמה וחתימה על הסכם זה.

2. תשלום:
   - מקדמה: 30% בעת ההזמנה
   - תשלום שני: 40% שבועיים לפני האירוע
   - יתרה: 30% ביום האירוע

3. ביטולים והחזרים:
   - עד 30 יום לפני האירוע: החזר מלא פחות 10% דמי טיפול
   - 14-30 יום: החזר 50%
   - פחות מ-14 יום: ללא החזר

4. שינויים: שינויים בהזמנה אפשריים עד 7 ימים לפני האירוע, בכפוף לזמינות.

5. איחורים: נותן השירות יגיע לפחות 30 דקות לפני תחילת האירוע המתוכננת.

6. כוח עליון: במקרים של כוח עליון (מלחמה, מגיפה, אסון טבע), שני הצדדים יתאמו מועד חלופי או החזר כספי.

7. אחריות: כל צד אחראי לנזקים שגרם במישרין. אין אחריות לנזקים עקיפים.

8. סודיות: פרטי ההתקשרות יישמרו בסודיות ולא יועברו לצד שלישי.

9. שיפוט: כל מחלוקת תידון בבית המשפט המוסמך באזור מגורי נותן השירות.`
  },
  {
    id: 'entertainer',
    name: 'תקנון קוסמים / מפעילי ילדים',
    content: `תנאי התקשרות - שירותי הפעלה וקוסמות

1. מקדמה: תשלום מקדמה בסך 30% מערך העסקה לשריון התאריך. יתרת התשלום במועד האירוע.

2. משך ההפעלה: ההפעלה כוללת עד 3 שעות פעילות. כל שעה נוספת תחויב בתוספת של 250 ש"ח.

3. גיל המשתתפים: ההפעלה מותאמת לגילאים שסוכמו מראש. שינוי משמעותי בגילאים יש לדווח עד 48 שעות לפני האירוע.

4. כמות ילדים: המחיר מבוסס על עד 25 ילדים. מעבר לכך תיתכן תוספת תשלום.

5. ציוד: כל הציוד והאביזרים יסופקו על ידי המפעיל (בלונים, אביזרי קוסמות, משחקים וכו').

6. מקום הפעלה: נדרש מקום מוצל/מקורה עם חשמל זמין. המזמין אחראי להכנת המקום.

7. ביטולים: ביטול עד 14 יום - החזר מלא. ביטול 7-14 יום - החזר 50%. פחות מ-7 ימים - ללא החזר.

8. מזג אוויר: באירוע חיצוני, במקרה של מזג אוויר קיצוני, יתואם מועד חלופי ללא עלות נוספת.

9. צילום: המפעיל רשאי לצלם את ההפעלה לצורך תיק עבודות, אלא אם נאמר אחרת.

10. אחריות: המזמין אחראי לבטיחות הילדים במהלך האירוע. המפעיל אינו אחראי לפציעות שנגרמו שלא במהלך הפעילות המודרכת.`
  }
];

interface FieldSchema {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
}

const DEFAULT_FIELDS: FieldSchema[] = [
  { id: 'date', label: 'תאריך מועד החתימה', type: 'date', required: true },
  { id: 'idNumber', label: 'ת.ז', type: 'text', required: false, placeholder: 'הזן מספר תעודת זהות' },
  { id: 'companyId', label: 'מספר ח.פ / ע.מ', type: 'text', required: false, placeholder: 'הזן מספר חברה' },
  { id: 'accountingContact', label: 'איש קשר', type: 'text', required: false },
  { id: 'invoiceEmail', label: 'מייל לשליחת חשבונית', type: 'email', required: true, placeholder: 'example@company.com' },
  { id: 'contactPhone', label: 'טלפון איש קשר', type: 'tel', required: true, placeholder: '050-0000000' },
];

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    eventDate: '',
    price: '',
    defaultText: '',
    themeColor: '#7C3AED',
    fieldsSchema: DEFAULT_FIELDS,
  });

  useEffect(() => {
    if (isEdit) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await eventsApi.getOne(Number(id));
      const event = response.data;
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
        price: event.price?.toString() || '',
        defaultText: event.defaultText || '',
        themeColor: event.themeColor || '#7C3AED',
        fieldsSchema: event.fieldsSchema?.length ? event.fieldsSchema : DEFAULT_FIELDS,
      });
    } catch (error) {
      showToast.error('שגיאה בטעינת האירוע');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFieldChange = (index: number, field: Partial<FieldSchema>) => {
    const newFields = [...formData.fieldsSchema];
    newFields[index] = { ...newFields[index], ...field };
    setFormData({ ...formData, fieldsSchema: newFields });
  };

  const addField = () => {
    const newField: FieldSchema = {
      id: `field_${Date.now()}`,
      label: 'שדה חדש',
      type: 'text',
      required: false,
    };
    setFormData({ ...formData, fieldsSchema: [...formData.fieldsSchema, newField] });
  };

  const removeField = (index: number) => {
    const newFields = formData.fieldsSchema.filter((_, i) => i !== index);
    setFormData({ ...formData, fieldsSchema: newFields });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
        eventDate: formData.eventDate || undefined,
      };

      if (isEdit) {
        await eventsApi.update(Number(id), payload);
        showToast.success('האירוע עודכן בהצלחה');
      } else {
        await eventsApi.create(payload);
        showToast.success('האירוע נוצר בהצלחה');
      }
      navigate('/events');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'שגיאה בשמירת האירוע');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title={isEdit ? 'עריכת אירוע' : 'אירוע חדש'} showBack>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? 'עריכת אירוע' : 'חזרה לעמוד הראשי'} showBack>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card border-2 border-green-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">יצירת הסכם קבוע לסוג הארוע הרצוי</h2>

          <div className="space-y-5">
            <div>
              <label className="input-label text-base">שם סוג ההסכם *</label>
              <input
                type="text"
                name="title"
                className="input"
                placeholder="לדוגמה: מסיבת השנה | בר מצווה | חתונה"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="input-label text-base">תיאור</label>
              <textarea
                name="description"
                className="input min-h-[100px]"
                placeholder="ההסכם נועד לארועי החתונה שאני עושה"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label text-base">מחיר (אופציונלי)</label>
                <input
                  type="number"
                  name="price"
                  className="input"
                  placeholder="0"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="input-label text-base">צבע ערכת נושא</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="themeColor"
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                    value={formData.themeColor}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={formData.themeColor}
                    onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Default Text Card */}
        <div className="card border-2 border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">תקנון / הערות קבועות</h2>

          {/* Template Selection */}
          <div className="mb-4">
            <label className="input-label text-base mb-2">בחר תקנון מוכן (ניתן לערוך אחרי בחירה)</label>
            <select
              className="input"
              onChange={(e) => {
                const template = TERMS_TEMPLATES.find(t => t.id === e.target.value);
                if (template) {
                  setFormData({ ...formData, defaultText: template.content });
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>בחר דוגמת תקנון...</option>
              {TERMS_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              * תקנון ו/או הסכמים אילו הינם דוגמא בלבד שמאפשרת לתת כיוון להסכם, מומלץ להתייעץ עם עו"ד וכל פעולה באחריות המשתמש בלבד
            </p>
          </div>

          <textarea
            name="defaultText"
            className="input min-h-[500px] text-sm leading-relaxed"
            placeholder="טקסט קבוע שיופיע בכל ההזמנות (תקנון, תנאים, הערות...)&#10;&#10;בחר תקנון מוכן מלמעלה או כתוב תקנון משלך"
            value={formData.defaultText}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-400 mt-2">
            * ניתן לבחור תקנון מוכן ולערוך אותו לפי הצרכים שלך
          </p>
        </div>

        {/* Fields Schema Card */}
        <div className="card border-2 border-primary-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">שדות שניתן להוסיף לטופס ההסכם</h2>
            <button
              type="button"
              onClick={addField}
              className="btn btn-primary text-base py-2 px-4"
            >
              + הוסף שדה
            </button>
          </div>

          <div className="space-y-4">
            {formData.fieldsSchema.map((field, index) => (
              <div key={field.id} className="p-5 bg-gradient-to-r from-gray-50 to-primary-50 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Field name - full width */}
                  <div>
                    <label className="input-label text-base font-semibold text-primary-700">שם השדה</label>
                    <input
                      type="text"
                      className="input text-base py-3"
                      value={field.label}
                      onChange={(e) => handleFieldChange(index, { label: e.target.value })}
                    />
                  </div>

                  {/* Type and controls row */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="input-label text-base font-semibold text-primary-700">סוג שדה</label>
                      <select
                        className="input text-base py-3"
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, { type: e.target.value as FieldSchema['type'] })}
                      >
                        <option value="text">טקסט</option>
                        <option value="email">אימייל</option>
                        <option value="tel">טלפון</option>
                        <option value="date">תאריך</option>
                        <option value="number">מספר</option>
                        <option value="textarea">טקסט ארוך</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-8">
                      <label className="flex items-center gap-2 text-base font-medium bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(index, { required: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        חובה
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-100 bg-white rounded-lg transition-colors border border-red-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              שומר...
            </span>
          ) : isEdit ? (
            'עדכן אירוע'
          ) : (
            'צרו הסכם לסוג הארוע'
          )}
        </button>
      </form>
    </Layout>
  );
}
