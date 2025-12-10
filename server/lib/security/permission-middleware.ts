import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission, hasAnyPermission } from './rbac';
import { getUserFromAuth } from '../../middleware/auth';
import { securityEvent } from '../logging/structured-logger';

export interface PermissionRequest extends Request {
  userPermissions?: Permission[];
}

export function requirePermission(...requiredPermissions: Permission[]) {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      const authUser = await getUserFromAuth(req);
      
      if (!authUser) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }
      
      const userRole = authUser.role || 'homeowner';
      
      const hasRequiredPermissions = requiredPermissions.every(
        permission => hasPermission(userRole, permission)
      );
      
      if (!hasRequiredPermissions) {
        securityEvent('PERMISSION_DENIED', {
          userId: String(authUser.id),
          email: authUser.email,
          role: userRole,
          path: req.path,
          method: req.method,
          requiredPermissions: requiredPermissions.join(','),
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          required: requiredPermissions,
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
}

export function requireAnyPermission(...requiredPermissions: Permission[]) {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      const authUser = await getUserFromAuth(req);
      
      if (!authUser) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }
      
      const userRole = authUser.role || 'homeowner';
      
      if (!hasAnyPermission(userRole, requiredPermissions)) {
        securityEvent('PERMISSION_DENIED', {
          userId: String(authUser.id),
          email: authUser.email,
          role: userRole,
          path: req.path,
          method: req.method,
          requiredPermissions: requiredPermissions.join(','),
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          required: requiredPermissions,
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
}

export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  return requirePermission(Permission.ACCESS_ALL_DATA)(req as PermissionRequest, res, next);
}
