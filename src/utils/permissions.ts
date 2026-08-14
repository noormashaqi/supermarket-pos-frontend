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
  
  // Admin automatically bypasses all permission checks
  if (session.role === 'Admin') return true;
  
  // Check if user has specific permission key
  return Array.isArray(session.permissions) && session.permissions.includes(permissionKey);
};

