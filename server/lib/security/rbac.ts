export enum Permission {
  VIEW_DASHBOARD = 'view:dashboard',
  PURCHASE_QR_CODES = 'purchase:qr_codes',
  MANAGE_HOMEOWNERS = 'manage:homeowners',
  VIEW_ANALYTICS = 'view:analytics',
  EXPORT_DATA = 'export:data',
  
  VIEW_MAINTENANCE = 'view:maintenance',
  UPDATE_PROFILE = 'update:profile',
  SCHEDULE_REMINDERS = 'schedule:reminders',
  VIEW_PROPERTY = 'view:property',
  
  MANAGE_APPLIANCES = 'manage:appliances',
  VIEW_APPLIANCES = 'view:appliances',
  MANAGE_MAINTENANCE_LOGS = 'manage:maintenance_logs',
  VIEW_MAINTENANCE_LOGS = 'view:maintenance_logs',
  VIEW_REPORTS = 'view:reports',
  
  MANAGE_USERS = 'manage:users',
  VIEW_SYSTEM_LOGS = 'view:system_logs',
  CONFIGURE_SYSTEM = 'configure:system',
  ACCESS_ALL_DATA = 'access:all_data',
  MANAGE_SETUP_FORMS = 'manage:setup_forms',
  MANAGE_ORDERS = 'manage:orders',
  MANAGE_PRO_REQUESTS = 'manage:pro_requests',
}

export const RolePermissions: Record<string, Permission[]> = {
  admin: Object.values(Permission),
  agent: [
    Permission.VIEW_DASHBOARD,
    Permission.PURCHASE_QR_CODES,
    Permission.MANAGE_HOMEOWNERS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_APPLIANCES,
    Permission.VIEW_MAINTENANCE_LOGS,
    Permission.VIEW_REPORTS,
  ],
  homeowner: [
    Permission.VIEW_MAINTENANCE,
    Permission.UPDATE_PROFILE,
    Permission.SCHEDULE_REMINDERS,
    Permission.VIEW_PROPERTY,
    Permission.MANAGE_APPLIANCES,
    Permission.VIEW_APPLIANCES,
    Permission.MANAGE_MAINTENANCE_LOGS,
    Permission.VIEW_MAINTENANCE_LOGS,
    Permission.VIEW_REPORTS,
  ],
  system: Object.values(Permission),
};

export function hasPermission(role: string, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

export function checkPermissions(
  role: string, 
  permissions: Permission[]
): Record<Permission, boolean> {
  return permissions.reduce((acc, permission) => {
    acc[permission] = hasPermission(role, permission);
    return acc;
  }, {} as Record<Permission, boolean>);
}

export function getPermissionsForRole(role: string): Permission[] {
  return RolePermissions[role] || [];
}
