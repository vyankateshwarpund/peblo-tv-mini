import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ViewerUser {
  email: string;
  name: string;
}

interface AuthContextType {
  user: ViewerUser | null;
  login: (userData: ViewerUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ViewerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('peblo_viewer_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('peblo_viewer_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: ViewerUser) => {
    localStorage.setItem('peblo_viewer_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('peblo_viewer_user');
    localStorage.removeItem('peblo_auth_token');
    localStorage.removeItem('peblo_user_profile');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
