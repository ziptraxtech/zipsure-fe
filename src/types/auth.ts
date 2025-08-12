export type UserRole = 'superadmin' | 'admin' | 'allocator' | 'rider';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Organization {
  id: string;
  name: string;
  planType: 'basic' | 'standard' | 'premium';
  vehicleCount: number;
  userCount: number;
  isActive: boolean;
  adminId: string;
  createdAt: string;
}