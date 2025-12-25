import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת מייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  businessName: z.string().optional(),
  businessPhone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('כתובת מייל לא תקינה'),
  password: z.string().min(1, 'סיסמה נדרשת'),
});

export const eventSchema = z.object({
  title: z.string().min(2, 'כותרת חייבת להכיל לפחות 2 תווים'),
  description: z.string().optional(),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  price: z.number().min(0).optional(),
  defaultText: z.string().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'צבע לא תקין').optional(),
  fieldsSchema: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['text', 'email', 'tel', 'date', 'number', 'textarea']),
    required: z.boolean(),
    placeholder: z.string().optional(),
  })).optional(),
});

export const inviteSchema = z.object({
  customerName: z.string().min(2, 'שם לקוח חייב להכיל לפחות 2 תווים'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email('כתובת מייל לא תקינה').optional().or(z.literal('')),
  eventType: z.string().optional(),
  eventLocation: z.string().optional(),
  notes: z.string().optional(),
  price: z.union([
    z.number().min(0),
    z.string().transform(val => val ? parseFloat(val) : undefined)
  ]).optional(),
  eventDate: z.string().optional(),
});

export const submitInviteSchema = z.object({
  payload: z.record(z.string()),
  signature: z.string().min(100, 'חתימה נדרשת'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type SubmitInviteInput = z.infer<typeof submitInviteSchema>;
