import { Request, Response } from 'express';
import { storage } from '../../storage.js';

// Audit logging helper
export async function createAuditLog(req: Request, action: string) {
  try {
    const actor = req.ip || 'unknown';
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };
    await storage.createAuditLog({ actor, action: `${req.method} ${action}`, meta });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// Generic error handler
export function handleError(error: any, action: string, res: Response) {
  console.error(`Error in ${action}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  });

  if (error?.name === 'ZodError') {
    return res.status(400).json({ 
      error: "Invalid input data",
      fields: error.errors?.map((e: any) => e.path[0]).filter(Boolean) || []
    });
  }

  return res.status(500).json({ 
    error: "An error occurred processing your request" 
  });
}
