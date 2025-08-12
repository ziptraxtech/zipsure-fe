import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Truck, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Shield, 
  Building2,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeTab = 'dashboard' }) => {
  const { user, logout } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
    ];

    switch (user?.role) {
      case 'superadmin':
        return [
          ...baseItems,
          { id: 'organizations', label: 'Organizations', icon: Building2 },
          { id: 'analytics', label: 'Global Analytics', icon: BarChart3 },
          { id: 'plans', label: 'Subscription Plans', icon: Shield },
          { id: 'users', label: 'All Users', icon: Users },
          { id: 'settings', label: 'System Settings', icon: Settings }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { id: 'fleet', label: 'Fleet Management', icon: Truck },
          { id: 'users', label: 'Team Members', icon: Users },
          { id: 'jobs', label: 'Job Overview', icon: ClipboardList },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'settings', label: 'Organization Settings', icon: Settings }
        ];
      
      case 'allocator':
        return [
          ...baseItems,
          { id: 'jobs', label: 'Job Allocation', icon: ClipboardList },
          { id: 'riders', label: 'Riders', icon: Users },
          { id: 'tracking', label: 'Live Tracking', icon: MapPin },
          { id: 'reports', label: 'Reports', icon: BarChart3 }
        ];
      
      case 'rider':
        return [
          ...baseItems,
          { id: 'jobs', label: 'My Jobs', icon: ClipboardList },
          { id: 'tracking', label: 'Current Route', icon: MapPin },
          { id: 'history', label: 'Job History', icon: BarChart3 }
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'default';
      case 'admin': return 'secondary';
      case 'allocator': return 'outline';
      case 'rider': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border fleet-shadow">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="p-2 bg-primary rounded-lg">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">FleetOps</h1>
            <p className="text-xs text-muted-foreground">Fleet Management</p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.avatar || user?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant(user?.role || '')} className="text-xs">
                  {user?.role}
                </Badge>
              </div>
              {user?.organizationName && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {user.organizationName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-secondary/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Settings className="h-4 w-4" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;