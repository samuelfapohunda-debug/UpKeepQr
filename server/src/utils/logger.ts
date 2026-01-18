export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error);
  },
  
  security: (message: string, meta?: any) => {
    console.warn(`[SECURITY] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
  }
};
