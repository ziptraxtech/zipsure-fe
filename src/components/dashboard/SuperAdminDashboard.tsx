import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import { Shield } from 'lucide-react';
import MetricsSection from './forSuperadmin/MetricsSection';
import OrganizationOverview from './forSuperadmin/OrganizationOverview';
import AddUserSuperAdmin from './forSuperadmin/addusersuperadmin'

// Using Vite's environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL;
console.log('Using API URL:', API_URL);

interface OverviewData {
  totalOrganizations: number;
  totalUsers: number;
  totalVehicles: number;
  totalJobs: number;
  totalSubscriptions: number;
  totalPayments: number;
  totalRevenue: number;
}

interface TokenPayload {
  role: string;
  exp?: number;
}

interface Organization {
  name: string;
  status: string;
  phone: string;
  email: string;
  gst: string;
  address: string;
}

interface ApiOrganization {
  name: string;
  isActive: boolean;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

const GlobalDashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalVehicles: 0,
    totalJobs: 0,
    totalSubscriptions: 0,
    totalPayments: 0,
    totalRevenue: 0,
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (decoded.role !== 'superadmin') {
          navigate(`/${decoded.role}-dashboard`);
          return;
        }

        await Promise.all([
          fetchOverview(token),
          fetchOrganizations(token),
        ]);
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 20000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  const fetchOverview = async (token: string) => {
    try {
      const url = `${API_URL}/api/v1/analytics/superadmin`;
      console.log('Fetching overview from:', url);
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Received data:', data);
      
      if (data.success && data.data?.overview) {
        setOverview(data.data.overview);
      }
    } catch (err) {
      console.error('Error in fetchOverview:', err);
    }
  };

  const fetchOrganizations = async (token: string) => {
    setIsLoading(true);
    try {
      const url = `${API_URL}/api/v1/organizations`;
      console.log('Fetching organizations from:', url);
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Organizations response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Organizations data:', data);

      if (data.success && Array.isArray(data.data)) {
        const formattedOrgs = data.data.map((org: ApiOrganization) => ({
          name: org.name,
          status: org.isActive ? 'active' : 'inactive',
          phone: org.phone,
          email: org.email,
          gst: org.gstNumber,
          address: [org.address, org.city, org.state, org.country]
            .filter(Boolean)
            .join(', '),
        }));
        setOrganizations(formattedOrgs);
      } else {
        console.error('Failed to fetch organizations:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error in fetchOrganizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div id="dashboard-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Global Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Super Administrator</span>
        </div>
      </div>

      {/* Metrics Section */}
      <MetricsSection overview={overview} />

      {/* Organizations Section */}
      <div id="organizations-section">
        <OrganizationOverview organizations={organizations} isLoading={isLoading} />
      </div>

      {/* Users Section (Super Admin specific) */}
      <div id="users-section">
        <AddUserSuperAdmin /> {/* ✅ Replaced UsersTable with AddUserSuperAdmin */}
      </div>
    </div>
  );
};

export default GlobalDashboard;
