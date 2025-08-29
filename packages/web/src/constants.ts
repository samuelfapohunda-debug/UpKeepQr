// API base URL for making requests to the server
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // In production, assume same origin
  : 'http://localhost:3001'; // Development server URL

// Application constants
export const APP_NAME = 'AgentHub';
export const APP_DESCRIPTION = 'Agent Management Platform';

// Route constants
export const ROUTES = {
  HOME: '/',
  ONBOARDING: '/setup/:token',
  DASHBOARD: '/agent',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  QR: {
    GENERATE: '/api/qr/generate',
    TOKEN: '/api/qr/token',
  },
  CALENDAR: {
    EVENT: '/api/calendar/event',
    EVENTS: '/api/calendar/events',
  },
} as const;
