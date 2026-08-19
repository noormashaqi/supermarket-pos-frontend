import type { SessionState } from '../types/app';
import type { PermissionKey } from '../types/employees';

export const getSession = (): SessionState | null => {
  try {
    const rawSession = localStorage.getItem('supermarket-pos-session');
    if (rawSession) {
      return JSON.parse(rawSession) as SessionState;
    }
  } catch (err) {
    console.error('Error parsing session:', err);
  }
  return null;
};

export const hasPermission = (
  permissionKey: PermissionKey | string,
  userPermissions?: string[]
): boolean => {
  // If explicit permissions array is passed
  if (userPermissions && Array.isArray(userPermissions)) {
    if (userPermissions.includes('*') || userPermissions.includes('admin') || userPermissions.includes('Admin')) {
      return true;
    }
    return userPermissions.includes(permissionKey);
  }

  // Otherwise check active stored session
  const session = getSession();
  if (!session) return false;

  // Admin automatically has full permissions across all screens
  if (session.role === 'Admin' || session.role === 'admin') return true;

  // 1. Direct match in per-action permissions array from JWT/DB
  if (Array.isArray(session.permissions)) {
    if (session.permissions.includes('*') || session.permissions.includes('admin')) return true;
    if (session.permissions.includes(permissionKey)) return true;

    // Check key mapping variations
    if (permissionKey === 'products.view' && session.permissions.includes('products.manage')) return true;
    if (permissionKey === 'categories.view' && session.permissions.includes('categories.manage')) return true;
    if (permissionKey === 'employees.view' && session.permissions.includes('employees.manage')) return true;
  }

  // 2. Role-based fallback defaults if explicit permissions array is missing
  const role = session.role;
  if (role === 'Cashier' || role === 'cashier') {
    if (permissionKey === 'sales.create' || permissionKey === 'invoices.view' || permissionKey === 'invoices.create') {
      return true;
    }
  }

  if (role === 'Inventory' || role === 'InventoryEmployee') {
    if (
      permissionKey === 'products.view' ||
      permissionKey === 'products.manage' ||
      permissionKey === 'categories.view' ||
      permissionKey === 'categories.manage' ||
      permissionKey === 'products.stock_add'
    ) {
      return true;
    }
  }

  return false;
};
