import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    email: 'superadmin@fleet.com',
    name: 'Super Admin',
    role: 'superadmin',
    avatar: 'SA',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'admin@logistics.com',
    name: 'John Smith',
    role: 'admin',
    organizationId: 'org1',
    organizationName: 'Logistics Corp',
    avatar: 'JS',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    email: 'allocator@logistics.com',
    name: 'Sarah Wilson',
    role: 'allocator',
    organizationId: 'org1',
    organizationName: 'Logistics Corp',
    avatar: 'SW',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: '4',
    email: 'rider@logistics.com',
    name: 'Mike Johnson',
    role: 'rider',
    organizationId: 'org1',
    organizationName: 'Logistics Corp',
    avatar: 'MJ',
    isActive: true,
    createdAt: '2024-02-10T00:00:00Z'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('fleet-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        localStorage.removeItem('fleet-user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Mock authentication - in real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (user && credentials.password === 'password') {
      localStorage.setItem('fleet-user', JSON.stringify(user));
      setState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('fleet-user');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('fleet-user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};