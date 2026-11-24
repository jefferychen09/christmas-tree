import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, CLOUD_ENABLED, loadSession, saveSession, type User } from './api';

interface AuthValue {
  user: User | null;
  login: (name: string, password: string) => Promise<User>;
  register: (name: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  login: () => Promise.reject(new ApiError('server')),
  register: () => Promise.reject(new ApiError('server')),
  logout: () => Promise.resolve(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // 先用上次存下的用户信息显示，再去服务器确认登录还有效
  const [user, setUser] = useState<User | null>(() => (CLOUD_ENABLED ? (loadSession()?.user ?? null) : null));

  useEffect(() => {
    const session = CLOUD_ENABLED ? loadSession() : null;
    if (!session) return;
    api
      .me()
      .then(({ user: fresh }) => {
        saveSession(session.token, fresh);
        setUser(fresh);
      })
      .catch((err) => {
        // 只有服务器明确说「没登录」才退出；断网时保持原样
        if (err instanceof ApiError && err.status === 401) {
          saveSession(null, null);
          setUser(null);
        }
      });
  }, []);

  const finish = useCallback(({ token, user: next }: { token: string; user: User }) => {
    saveSession(token, next);
    setUser(next);
    return next;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      login: (name, password) => api.login(name, password).then(finish),
      register: (name, password) => api.register(name, password).then(finish),
      logout: async () => {
        await api.logout().catch(() => {});
        saveSession(null, null);
        setUser(null);
      },
    }),
    [user, finish],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
