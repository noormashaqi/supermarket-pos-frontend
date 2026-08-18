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

export const hasPermission = (permissionKey: PermissionKey): boolean => {
  const session = getSession();
  if (!session) return false;

  // Admin automatically has full permissions across all screens
  if (session.role === 'Admin') return true;

  // 1. Direct match in per-action permissions array from JWT/DB
  if (Array.isArray(session.permissions)) {
    if (session.permissions.includes(permissionKey)) return true;
    
    // Check key mapping variations (e.g. products.view vs products.manage)
    if (permissionKey === 'products.view' && session.permissions.includes('products.manage')) return true;
    if (permissionKey === 'categories.view' && session.permissions.includes('categories.manage')) return true;
    if (permissionKey === 'employees.view' && session.permissions.includes('employees.manage')) return true;
  }

  // 2. Role-based fallback defaults if explicit permissions array is missing
  const role = session.role;
  if (role === 'Cashier') {
    if (permissionKey === 'sales.create' || permissionKey === 'invoices.view') return true;
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
