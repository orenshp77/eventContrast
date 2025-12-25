import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  business_name?: string;
  business_phone?: string;
  business_logo?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  location?: string;
  event_date?: Date;
  price?: number;
  default_text?: string;
  theme_color: string;
  fields_schema?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Invite {
  id: number;
  event_id: number;
  token: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  status: 'CREATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'RETURNED';
  created_at: Date;
  updated_at: Date;
}

export interface InviteSubmission {
  id: number;
  invite_id: number;
  payload: string;
  signature_png?: string;
  signed_pdf_path?: string;
  submitted_at: Date;
  created_at: Date;
}
