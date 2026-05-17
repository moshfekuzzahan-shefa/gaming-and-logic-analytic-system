import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  userId: number | null;
  username: string | null;
  token: string | null;
  role: string | null;
  loading: boolean;
  login: (token: string, user: { id: number; username: string; role: string }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to log in a user and persist session
  const login = (newToken: string, user: { id: number; username: string; role: string }) => {
    setToken(newToken);
    setUserId(user.id);
    setUsername(user.username);
    setRole(user.role);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUserId', String(user.id));
    localStorage.setItem('authUsername', user.username);
    localStorage.setItem('authRole', user.role);
  };

  // Helper to log out and clear persistent session
  const logout = () => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    setRole(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserId');
    localStorage.removeItem('authUsername');
    localStorage.removeItem('authRole');
  };

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('authToken');
      const savedUserId = localStorage.getItem('authUserId');
      const savedUsername = localStorage.getItem('authUsername');
      const savedRole = localStorage.getItem('authRole');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        // Double-check session validity with the backend
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setToken(savedToken);
            setUserId(data.user.id);
            setUsername(data.user.username);
            setRole(data.user.role);
          } else {
            logout();
          }
        } else {
          // Token is invalid or expired
          logout();
        }
      } catch (err) {
        console.warn('Backend verification failed, attempting local cache fallback');
        // Fallback to local cache in offline development mode
        if (savedUserId && savedUsername && savedRole) {
          setToken(savedToken);
          setUserId(parseInt(savedUserId));
          setUsername(savedUsername);
          setRole(savedRole);
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const isAuthenticated = !!token && userId !== null;
  const isAdmin = role?.toLowerCase() === 'admin';

  return (
    <UserContext.Provider value={{ userId, username, token, role, loading, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
