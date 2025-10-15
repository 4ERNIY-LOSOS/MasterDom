import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

import { jwtDecode } from 'jwt-decode';

// Описываем, какую информацию хранит токен
interface DecodedToken {
  userId: string;
  role: string;
  exp: number;
}

// Описываем, что будет храниться в нашем контексте
interface AuthContextType {
  token: string | null;
  user: DecodedToken | null;
  login: (token: string) => void;
  logout: () => void;
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Создаем провайдер - компонент, который будет "обнимать" наше приложение
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<DecodedToken | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Проверяем, не истек ли срок действия токена
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } else {
          // Токен истек, выходим из системы
          logout();
        }
      } catch (error) {
        console.error("Invalid token", error);
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  const value = { token, user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Создаем кастомный хук для удобного доступа к контексту
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
