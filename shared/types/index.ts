// Shared types between client and server

export interface User {
  id: number;
  name: string;
  email: string;
  businessName?: string;
  businessPhone?: string;
  businessLogo?: string;
  createdAt: string;
}

export interface Event {
  id: number;
  userId: number;
  title: string;
  description?: string;
  location?: string;
  eventDate?: string;
  price?: number;
  defaultText?: string;
  themeColor: string;
  fieldsSchema: FieldSchema[];
  createdAt: string;
  updatedAt: string;
  inviteCount?: number;
}

export interface FieldSchema {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
}

export type InviteStatus = 'CREATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'RETURNED';

export interface Invite {
  id: number;
  eventId: number;
  token: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  status: InviteStatus;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  submission?: InviteSubmission;
}

export interface InviteSubmission {
  id: number;
  inviteId: number;
  payload: Record<string, string>;
  signaturePng?: string;
  signedPdfPath?: string;
  submittedAt: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  businessPhone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  eventDate?: string;
  price?: number;
  defaultText?: string;
  themeColor?: string;
  fieldsSchema?: FieldSchema[];
}

export interface CreateInviteRequest {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

export interface SubmitInviteRequest {
  payload: Record<string, string>;
  signature: string; // Base64 PNG
}

export interface PublicInviteData {
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
    status: InviteStatus;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Status labels in Hebrew
export const STATUS_LABELS: Record<InviteStatus, string> = {
  CREATED: 'נוצר',
  SENT: 'נשלח',
  VIEWED: 'נצפה',
  SIGNED: 'נחתם',
  RETURNED: 'הוחזר',
};

export const STATUS_COLORS: Record<InviteStatus, string> = {
  CREATED: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-yellow-100 text-yellow-800',
  SIGNED: 'bg-green-100 text-green-800',
  RETURNED: 'bg-purple-100 text-purple-800',
};

// Default fields for invite form
export const DEFAULT_FIELDS: FieldSchema[] = [
  { id: 'date', label: 'תאריך', type: 'date', required: true },
  { id: 'companyId', label: 'מספר ח.פ / ע.מ', type: 'text', required: false, placeholder: 'הזן מספר חברה' },
  { id: 'accountingContact', label: 'איש קשר להנהלת חשבונות', type: 'text', required: false },
  { id: 'invoiceEmail', label: 'מייל לשליחת חשבונית', type: 'email', required: true, placeholder: 'example@company.com' },
  { id: 'contactPhone', label: 'טלפון איש קשר', type: 'tel', required: true, placeholder: '050-0000000' },
];
