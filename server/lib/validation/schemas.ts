import { z } from 'zod';

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'throwaway.email',
  'fakeinbox.com',
  'temp-mail.org',
  'discard.email',
];

export const phoneSchema = z.string()
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long')
  .refine(val => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }, 'Must be a valid phone number')
  .transform(val => {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return val;
  });

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(254, 'Email too long')
  .refine(email => {
    const domain = email.split('@')[1]?.toLowerCase();
    return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
  }, 'Disposable email addresses not allowed')
  .transform(email => email.toLowerCase().trim());

export const addressSchema = z.object({
  street: z.string()
    .min(5, 'Street address too short')
    .max(200, 'Street address too long'),
  city: z.string()
    .min(2, 'City name too short')
    .max(100, 'City name too long'),
  state: z.string()
    .min(2, 'State required')
    .max(50, 'State name too long'),
  zip: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
});

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters');

export const uuidSchema = z.string()
  .uuid('Invalid ID format');

export const dateSchema = z.string()
  .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
  .transform(val => new Date(val));

export const positiveNumberSchema = z.number()
  .min(0, 'Value cannot be negative');

export const priceSchema = z.union([
  z.number().min(0, 'Price cannot be negative').max(1000000, 'Price exceeds maximum'),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').transform(val => parseFloat(val))
]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const maintenanceItemSchema = z.object({
  title: z.string()
    .min(3, 'Title too short')
    .max(100, 'Title too long'),
  description: z.string()
    .min(10, 'Description too short')
    .max(1000, 'Description too long')
    .optional(),
  category: z.enum([
    'hvac',
    'plumbing',
    'electrical',
    'appliances',
    'exterior',
    'interior',
    'landscaping',
    'safety',
  ]).optional(),
  frequency: z.enum(['monthly', 'quarterly', 'biannual', 'annual']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedCost: priceSchema.optional(),
});

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeForSql(input: string): string {
  return input.replace(/['";\\]/g, '');
}
