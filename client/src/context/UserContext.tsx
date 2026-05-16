import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
}

interface UserContextType {
  userId: number;
  username: string;
  setUserId: (id: number) => void;
  availableUsers: User[];
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 1, but we will try to find a valid user from the DB
  const [userId, setUserIdInternal] = useState<number>(1);
  const [username, setUsername] = useState<string>('EliteCoder99');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const setUserId = (id: number) => {
    const user = availableUsers.find(u => u.id === id);
    if (user) {
      setUserIdInternal(user.id);
      setUsername(user.username);
      localStorage.setItem('activeUserId', String(user.id));
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // We can fetch from the leaderboard or a dedicated users endpoint
        // Since we don't have a /api/users, we'll use leaderboard which returns users
        const res = await fetch('http://localhost:5000/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setAvailableUsers(data.map((u: any) => ({ id: u.id, username: u.username })));
            
            // Check if we have a saved ID in localStorage
            const savedId = localStorage.getItem('activeUserId');
            const initialUser = savedId 
              ? data.find((u: any) => u.id === parseInt(savedId)) 
              : data[0];

            if (initialUser) {
              setUserIdInternal(initialUser.id);
              setUsername(initialUser.username);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch users for context, using defaults');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <UserContext.Provider value={{ userId, username, setUserId, availableUsers, loading }}>
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
