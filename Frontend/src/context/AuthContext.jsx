import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AUTH_KEY = 'vvcmc-bed-dashboard:admin';
const USER_KEY = 'vvcmc-bed-dashboard:user';
const TOKEN_KEY = 'vvcmc-bed-dashboard:token';
const SESSION_TIME_KEY = 'vvcmc-bed-dashboard:session_time';
const SESSION_EXPIRED_KEY = 'vvcmc-bed-dashboard:session_expired';

// 15 minutes session expiration time (in milliseconds)
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

const AuthContext = createContext(null);

function getStoredSessionTime() {
  try {
    const raw = localStorage.getItem(SESSION_TIME_KEY) || sessionStorage.getItem(SESSION_TIME_KEY);
    return raw ? Number(raw) : 0;
  } catch (error) {
    console.error('Error reading session time:', error);
    return 0;
  }
}

function isSessionExpired(timestamp) {
  if (!timestamp) return true;
  return Date.now() - timestamp > SESSION_TIMEOUT_MS;
}

function clearAllStorage() {
  try {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TIME_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_TIME_KEY);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

function inspectInitialSession() {
  try {
    const isAuth =
      localStorage.getItem(AUTH_KEY) === '1' ||
      sessionStorage.getItem(AUTH_KEY) === '1';

    if (!isAuth) {
      const wasExpired = localStorage.getItem(SESSION_EXPIRED_KEY) === '1';
      return { isAuth: false, isExpired: wasExpired };
    }

    const time = getStoredSessionTime();
    if (!time || isSessionExpired(time)) {
      clearAllStorage();
      try {
        localStorage.setItem(SESSION_EXPIRED_KEY, '1');
      } catch (err) {
        console.error('Error setting session expired flag:', err);
      }
      return { isAuth: false, isExpired: true };
    }

    return { isAuth: true, isExpired: false };
  } catch (error) {
    console.error('Error verifying initial session:', error);
    return { isAuth: false, isExpired: false };
  }
}

export function AuthProvider({ children }) {
  const initial = useMemo(() => inspectInitialSession(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuth);
  const [sessionExpired, setSessionExpired] = useState(initial.isExpired);

  const [token, setToken] = useState(() => {
    try {
      if (!initial.isAuth) return '';
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
    } catch (error) {
      console.error('Error reading token from storage:', error);
      return '';
    }
  });

  const [user, setUser] = useState(() => {
    try {
      if (!initial.isAuth) return null;
      const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error reading user from storage:', error);
      return null;
    }
  });

  /**
   * Sets authenticated user session and token in state and persistent storage
   * Persisted in localStorage so copying links to new tabs shares the session
   */
  const login = useCallback((userData, authToken = '') => {
    const now = Date.now();
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    setSessionExpired(false);

    try {
      localStorage.removeItem(SESSION_EXPIRED_KEY);

      // Store in localStorage for cross-tab sharing
      localStorage.setItem(AUTH_KEY, '1');
      localStorage.setItem(SESSION_TIME_KEY, String(now));
      if (userData) localStorage.setItem(USER_KEY, JSON.stringify(userData));
      if (authToken) localStorage.setItem(TOKEN_KEY, authToken);

      // Also set in sessionStorage
      sessionStorage.setItem(AUTH_KEY, '1');
      sessionStorage.setItem(SESSION_TIME_KEY, String(now));
      if (userData) sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
      if (authToken) sessionStorage.setItem(TOKEN_KEY, authToken);
    } catch (error) {
      console.error('Error saving auth to storage:', error);
    }
  }, []);

  /**
   * Clears authenticated session and tokens from state and storage
   */
  const logout = useCallback((options = {}) => {
    setUser(null);
    setToken('');
    setIsAuthenticated(false);

    if (options.expired) {
      setSessionExpired(true);
      try {
        localStorage.setItem(SESSION_EXPIRED_KEY, '1');
      } catch (err) {
        console.error('Error setting session expired flag on logout:', err);
      }
    } else {
      setSessionExpired(false);
      try {
        localStorage.removeItem(SESSION_EXPIRED_KEY);
      } catch (err) {
        console.error('Error removing session expired flag on logout:', err);
      }
    }

    clearAllStorage();
  }, []);

  /**
   * Refresh the active session timestamp on user activity (throttled to once every 10s)
   */
  const refreshActivity = useCallback(
    (force = false) => {
      if (!isAuthenticated) return;
      const lastTime = getStoredSessionTime();
      const now = Date.now();
      if (force || now - lastTime > 10000) {
        try {
          localStorage.setItem(SESSION_TIME_KEY, String(now));
          sessionStorage.setItem(SESSION_TIME_KEY, String(now));
        } catch (error) {
          console.error('Error updating session timestamp:', error);
        }
      }
    },
    [isAuthenticated]
  );

  // Sync session into sessionStorage and refresh activity on initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshActivity(true);
      try {
        sessionStorage.setItem(AUTH_KEY, '1');
        const sessionTime = localStorage.getItem(SESSION_TIME_KEY);
        if (sessionTime) sessionStorage.setItem(SESSION_TIME_KEY, sessionTime);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) sessionStorage.setItem(USER_KEY, storedUser);
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (storedToken) sessionStorage.setItem(TOKEN_KEY, storedToken);
      } catch (error) {
        console.error('Error syncing sessionStorage on mount:', error);
      }
    }
  }, [isAuthenticated, refreshActivity]);

  // Listen to user interaction to keep active sessions alive
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => refreshActivity(false);

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [isAuthenticated, refreshActivity]);

  // Handle tab visibility and focus: instantly check session expiration or refresh activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const time = getStoredSessionTime();
        if (!time || isSessionExpired(time)) {
          console.warn('Session expired after 15 minutes of inactivity upon tab focus.');
          logout({ expired: true });
        } else {
          refreshActivity(false);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isAuthenticated, logout, refreshActivity]);

  // 15-minute expiration checker running every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkExpiration = () => {
      const time = getStoredSessionTime();
      if (!time || isSessionExpired(time)) {
        console.warn('Session expired after 15 minutes of inactivity.');
        logout({ expired: true });
      }
    };

    const intervalId = setInterval(checkExpiration, 5000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, logout]);

  // Synchronize authentication changes across tabs via storage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === AUTH_KEY && e.newValue !== '1') {
        let wasExpired = false;
        try {
          wasExpired = localStorage.getItem(SESSION_EXPIRED_KEY) === '1';
        } catch (err) {
          console.error('Error checking expired flag in storage event:', err);
        }
        setUser(null);
        setToken('');
        setIsAuthenticated(false);
        setSessionExpired(wasExpired);
      } else if (e.key === AUTH_KEY && e.newValue === '1') {
        const time = getStoredSessionTime();
        if (!isSessionExpired(time)) {
          setIsAuthenticated(true);
          setSessionExpired(false);
          try {
            const rawUser = localStorage.getItem(USER_KEY);
            if (rawUser) setUser(JSON.parse(rawUser));
            const rawToken = localStorage.getItem(TOKEN_KEY);
            if (rawToken) setToken(rawToken);
          } catch (error) {
            console.error('Error syncing auth across tabs:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = useMemo(
    () => ({
      user,
      currentUser: user, // Alias for compatibility
      token,
      isAuthenticated,
      isAdmin: isAuthenticated, // Alias for compatibility with existing admin layout
      sessionExpired,
      login,
      logout,
    }),
    [user, token, isAuthenticated, sessionExpired, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
