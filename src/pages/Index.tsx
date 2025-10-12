// src/pages/Index.tsx
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import MobileDashboardLayout from '@/components/layout/MobileDashboardLayout';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AllocatorDashboard from '@/components/dashboard/AllocatorDashboard';
import RiderDashboard from '@/components/dashboard/RiderDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isZipsureApp = userAgent.includes("ZipsureApp/");

    if (isZipsureApp) {
      const versionMatch = userAgent.match(/ZipsureApp\/(\d+)/);
      const appVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
      const REQUIRED_VERSION = 2;

      if (appVersion < REQUIRED_VERSION || !appVersion) {
        document.body.innerHTML = `
          <div style="text-align:center;margin-top:50px;font-family:sans-serif">
          <br>
            <h2>🚨 Update Required</h2>
            <br>
            <p>Your app version is outdated. Please download the latest version.</p>
            <br>
            <br>
            <a href="https://yourwebsite.com/download-latest.apk"
               style="background:#007bff;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
               Download Latest
            </a>
          </div>
        `;
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderDashboard = () => {
    switch (user.role?.toLowerCase()) {
      case 'superadmin':
        return <SuperAdminDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'allocator':
        return <AllocatorDashboard />;
      case 'rider':
        return <RiderDashboard />;
      default:
        return (
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold mb-4">Welcome to FleetOps</h1>
            <p className="text-muted-foreground">
              Role not recognized. Please contact support.
            </p>
          </div>
        );
    }
  };

  return <MobileDashboardLayout>{renderDashboard()}</MobileDashboardLayout>;
};

export default Index;
