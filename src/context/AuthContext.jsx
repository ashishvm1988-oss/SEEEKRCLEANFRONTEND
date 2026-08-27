import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

const USER_KEY = 'seeekr_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  // On load, if we have a token AND a cached user (so we know which id to
  // ask for — GET /users with no id returns every user on this API, not
  // "me"), re-validate against the API. Catches an expired/invalid token or
  // stale role/city early instead of letting every screen 401 individually.
  useEffect(() => {
    const token = getToken();
    if (!token || !user?.id) {
      if (token && !user?.id) logout();
      setReady(true);
      return;
    }
    api
      .getUserById(user.id)
      .then((freshUser) => {
        if (freshUser) persistUser(freshUser);
        else logout();
      })
      .catch(() => {
        logout();
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistUser(u) {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }

  const login = useCallback(async (identifier, password) => {
    const { user: u, token } = await api.login(identifier, password);
    setToken(token);
    persistUser(u);
    return u;
  }, []);

  const signup = useCallback(async (payload) => {
    const newUser = await api.signup(payload);
    // Signup doesn't return a token, so log in right after with the same
    // credentials rather than asking the user to do it themselves.
    const { user: u, token } = await api.login(payload.email, payload.password);
    setToken(token);
    persistUser(u);
    return newUser && u;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    persistUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return null;
    const freshUser = await api.getUserById(user.id);
    persistUser(freshUser);
    return freshUser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
