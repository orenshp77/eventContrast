# הזמנה דיגיטלית - Digital Invitation System

מערכת הזמנות וחתימות דיגיטליות מלאה עם תמיכה ב-RTL, מותאמת למובייל.

## תכונות

### צד משתמש (Dashboard)
- התחברות והרשמה עם JWT
- יצירת ועריכת אירועים
- ניהול הזמנות לכל אירוע
- שליחת הזמנות בוואטסאפ ובמייל
- צפייה בסטטוס הזמנות (נוצר/נשלח/נצפה/נחתם/הוחזר)
- הורדת PDF חתום

### צד לקוח (Public)
- עמוד מובייל מותאם לחתימה
- צפייה בפרטי המסמך
- מילוי שדות מותאמים אישית
- חתימה דיגיטלית על Canvas
- שליחה בוואטסאפ או במייל

## טכנולוגיה

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | TailwindCSS + SweetAlert2 |
| Signature | react-signature-canvas |
| Backend | Node.js + Express + TypeScript |
| Auth | JWT |
| Database | MySQL 8 |
| PDF | pdf-lib |
| Email | Nodemailer |
| Container | Docker Compose |

## התקנה והרצה

### דרישות מקדימות
- Node.js 18+
- Docker & Docker Compose
- npm או yarn

### 1. שכפל את הפרויקט
```bash
cd "d:\fiesta\הזמנת ארוע"
```

### 2. הגדרת משתני סביבה

צור קובץ `.env` בתיקייה הראשית:
```bash
cp .env.example .env
```

ערוך את הקובץ עם הערכים שלך:
```env
# Database
DB_ROOT_PASSWORD=your-root-password
DB_NAME=event_invite
DB_USER=eventuser
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key

# SMTP (אופציונלי - לשליחת מיילים)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# URLs
CLIENT_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### 3. הרצה עם Docker (מומלץ)

```bash
# הפעל את כל השירותים
docker-compose up -d

# צפה בלוגים
docker-compose logs -f
```

השירותים שיפעלו:
- MySQL: `localhost:3306`
- Adminer (DB UI): `http://localhost:8080`
- Server: `http://localhost:3001`

### 4. הרצה מקומית (פיתוח)

#### התקנת התלויות
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

#### הרצת ה-Server
```bash
cd server
npm run dev
```

#### הרצת ה-Client
```bash
cd client
npm run dev
```

פתח: `http://localhost:5173`

## מבנה הפרויקט

```
הזמנת ארוע/
├── docker-compose.yml      # הגדרות Docker
├── .env.example           # דוגמה למשתני סביבה
├── README.md              # תיעוד
├── uploads/               # קבצי PDF חתומים
│
├── server/                # Backend
│   ├── src/
│   │   ├── index.ts       # Entry point
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   └── init.sql
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── events.ts
│   │   │   ├── invites.ts
│   │   │   └── public.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   └── utils/
│   │       ├── validation.ts
│   │       ├── token.ts
│   │       ├── pdf.ts
│   │       └── email.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── client/                # Frontend
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── EventInvites.tsx
│   │   │   └── PublicInvite.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── SignatureCanvas.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.tsx
│   │   └── utils/
│   │       ├── api.ts
│   │       └── swal.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
│
└── shared/                # Shared Types
    └── types/
        └── index.ts
```

## API Endpoints

### Authentication
| Method | Endpoint | תיאור |
|--------|----------|--------|
| POST | `/api/auth/register` | הרשמה |
| POST | `/api/auth/login` | התחברות |
| GET | `/api/auth/me` | פרטי משתמש נוכחי |
| PUT | `/api/auth/profile` | עדכון פרופיל |

### Events (דורש התחברות)
| Method | Endpoint | תיאור |
|--------|----------|--------|
| GET | `/api/events` | כל האירועים |
| GET | `/api/events/:id` | אירוע בודד |
| POST | `/api/events` | יצירת אירוע |
| PUT | `/api/events/:id` | עדכון אירוע |
| DELETE | `/api/events/:id` | מחיקת אירוע |

### Invites (דורש התחברות)
| Method | Endpoint | תיאור |
|--------|----------|--------|
| GET | `/api/invites/event/:eventId` | הזמנות לאירוע |
| GET | `/api/invites/:id` | הזמנה בודדת |
| POST | `/api/invites/event/:eventId` | יצירת הזמנה |
| PUT | `/api/invites/:id` | עדכון הזמנה |
| PUT | `/api/invites/:id/status` | עדכון סטטוס |
| DELETE | `/api/invites/:id` | מחיקת הזמנה |

### Public (ללא התחברות)
| Method | Endpoint | תיאור |
|--------|----------|--------|
| GET | `/api/public/invite/:token` | פרטי הזמנה |
| POST | `/api/public/invite/:token/submit` | שליחת טופס חתום |
| POST | `/api/public/invite/:token/send-email` | שליחת מייל |

## הודעות לדוגמה

### הודעת וואטסאפ להזמנה
```
שלום [שם הלקוח],

הוזמנת לחתום על מסמך: [שם האירוע]

לחץ על הקישור:
https://your-domain.com/invite/[token]

תודה!
```

### הודעת וואטסאפ למסמך חתום
```
שלום,

מצורף טופס חתום:
📄 [שם האירוע]
👤 [שם הלקוח]
📅 [תאריך]

תודה!
```

## Build לפרודקשן

### Frontend
```bash
cd client
npm run build
```

הקבצים יווצרו בתיקיית `dist/`

### Backend
```bash
cd server
npm run build
```

### Docker Production
```bash
docker-compose -f docker-compose.yml up -d --build
```

## פתרון בעיות

### MySQL לא מתחבר
```bash
# בדוק שה-container רץ
docker-compose ps

# ראה לוגים
docker-compose logs mysql
```

### שגיאות CORS
ודא שה-`CLIENT_URL` בקובץ `.env` מוגדר נכון.

### בעיות בחתימה
ודא שהדפדפן תומך ב-Canvas ושאין חסימת JavaScript.

## רישיון

MIT

---

נבנה עם ❤️ לעסקים בישראל
