// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast"; // Import toast hook

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>; // returns role
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const { toast } = useToast();

  const validateToken = useCallback(async (token: string) => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      return res.ok;
    } catch (error) {
      return false;
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        
        if (storedToken && storedToken !== "undefined" && storedUser) {
          const isValid = await validateToken(storedToken);
          if (isValid) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } else {
            clearAuth();
          }
        }
      } catch (error) {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [validateToken, clearAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      const userData = data.data.user;
      const tokenValue = data.data.token;

      setUser(userData);
      setToken(tokenValue);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", tokenValue);

      // ✅ Success toast
      toast({
        title: "Login successful",
        description: `Welcome back!`,
        duration: 5000,
        className: "bg-green-500 text-white", // green background
      });

      return userData.role;
    } catch (error: any) {
      // ❌ Failure toast
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        duration: 5000,
        className: "bg-red-500 text-white", // red background
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
