import { useState, useEffect, useCallback } from 'react';

export interface MockSession {
  username: string;
  role: string;
  permissions: string[];
}

const SESSION_KEY = 'pos_session';

const DEFAULT_SESSION: MockSession = {
  username: '',
  role: '',
  permissions: [],
};

export const useSession = () => {
  const [session, setSession] = useState<MockSession>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_SESSION;
  });

  // Listen for storage changes (e.g. login from another tab or component)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) setSession(JSON.parse(stored));
        else setSession(DEFAULT_SESSION);
      } catch {
        setSession(DEFAULT_SESSION);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const refreshSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setSession(JSON.parse(stored));
      else setSession(DEFAULT_SESSION);
    } catch {
      setSession(DEFAULT_SESSION);
    }
  }, []);

  const isLoggedIn = session.username !== '';

  return { session, isLoggedIn, refreshSession };
};

/** Write a mock session to localStorage (called from AuthPage) */
export const writeSession = (username: string) => {
  const isAdmin = username.toLowerCase() === 'admin';
  const session: MockSession = {
    username,
    role: isAdmin ? 'admin' : 'cashier',
    permissions: isAdmin
      ? ['*']
      : ['invoices.create', 'invoices.debt_sale'],
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Dispatch storage event for same-tab listeners
  window.dispatchEvent(new Event('storage'));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('storage'));
};
