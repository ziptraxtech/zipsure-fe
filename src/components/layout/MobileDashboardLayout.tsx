import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  DollarSign,
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Shield, 
  Building2,
  MapPin,
  ClipboardList,
  Home
} from 'lucide-react';
import logo from '@/assets/logo.png';

// ✅ Admin subscriptions
import Subscriptions from '@/components/dashboard/forAdmin/payment/subscriptions';
// ✅ Superadmin subscription plans
import SubscriptionPlans from '@/components/dashboard/forSuperadmin/SubscriptionPlans';

interface MobileDashboardLayoutProps {
  children: React.ReactNode;
}

interface User {
  role?: 'superadmin' | 'admin' | 'allocator' | 'rider' | string;
  name?: string;
  avatar?: string;
  organizationName?: string;
}

type ActiveView =
  | 'dashboard'
  | 'subscriptions'
  | 'plans'
  | 'fleet'
  | 'users'
  | 'jobs'
  | 'analytics'
  | 'settings'
  | 'organizations'
  | 'riders'
  | 'tracking'
  | 'reports'
  | 'history';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  view: ActiveView;
}

const AppSidebar = ({ onViewChange }: { onViewChange: (view: ActiveView) => void }) => {
  const { user, logout } = useAuth() as { user: User | null; logout: () => void };
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // ✅ Get user info from localStorage
  const localUser = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // ✅ Full name from first + last
  const fullName =
    localUser?.firstName && localUser?.lastName
      ? `${localUser.firstName} ${localUser.lastName}`
      : user?.name || "User";

  const handleNavigation = (view: ActiveView) => {
    setActiveView(view);
    onViewChange(view);
    // ❌ Removed navigate(url) so it won't trigger 404
  };

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: Home, 
        url: '/',
        view: 'dashboard'
      }
    ];

    switch (user?.role) {
      case 'superadmin':
        return [
          ...baseItems,
          { id: 'organizations', label: 'Organizations', icon: Building2, url: '/organizations', view: 'organizations' },
          { id: 'analytics', label: 'Global Analytics', icon: BarChart3, url: '/analytics', view: 'analytics' },
          { id: 'plans', label: 'Subscription Plans', icon: Shield, url: '/plans', view: 'plans' }, // ✅ fixed view
          { id: 'users', label: 'All Users', icon: Users, url: '/users', view: 'users' },
          { id: 'settings', label: 'System Settings', icon: Settings, url: '/settings', view: 'settings' }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign, url: '/subscriptions', view: 'subscriptions' },
          { id: 'fleet', label: 'Fleet Management', icon: ClipboardList, url: '/fleet', view: 'fleet' },
          { id: 'users', label: 'Team Members', icon: Users, url: '/users', view: 'users' },
          { id: 'jobs', label: 'Job Overview', icon: ClipboardList, url: '/jobs', view: 'jobs' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, url: '/analytics', view: 'analytics' },
          { id: 'settings', label: 'Organization Settings', icon: Settings, url: '/settings', view: 'settings' }
        ];
      
      case 'allocator':
        return [
          ...baseItems,
          { id: 'jobs', label: 'Job Allocation', icon: ClipboardList, url: '/jobs', view: 'jobs' },
          { id: 'riders', label: 'Riders', icon: Users, url: '/riders', view: 'riders' },
          { id: 'tracking', label: 'Live Tracking', icon: MapPin, url: '/tracking', view: 'tracking' },
          { id: 'reports', label: 'Reports', icon: BarChart3, url: '/reports', view: 'reports' }
        ];
      
      case 'rider':
        return [
          ...baseItems,
          { id: 'jobs', label: 'My Jobs', icon: ClipboardList, url: '/jobs', view: 'jobs' },
          { id: 'tracking', label: 'Current Route', icon: MapPin, url: '/tracking', view: 'tracking' },
          { id: 'history', label: 'Job History', icon: BarChart3, url: '/history', view: 'history' }
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleBadgeVariant = (role: string = '') => {
    switch (role) {
      case 'superadmin': return 'default';
      case 'admin': return 'secondary';
      case 'allocator':
      case 'rider':
        return 'outline';
      default: 
        return 'outline';
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold">Zipsure AI</h1>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Info */}
        {!isCollapsed && user && (
          <SidebarGroup>
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(user?.role)} className="text-xs">
                    {user?.role || 'user'}
                  </Badge>
                </div>
                {user?.organizationName && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {user.organizationName}
                  </p>
                )}
              </div>
            </div>
          </SidebarGroup>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigation(item.view)}
                      className={activeView === item.view ? 'bg-muted' : ''}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!isCollapsed && (
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
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

const MobileDashboardLayout: React.FC<MobileDashboardLayoutProps> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { user } = useAuth() as { user: User | null };

  // ✅ Get initials from localStorage or fallback
  const getUserInitials = (): string => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.firstName && parsed.lastName) {
          return (
            parsed.firstName.charAt(0).toUpperCase() +
            parsed.lastName.charAt(0).toUpperCase()
          );
        }
      }
    } catch {}
    if (user?.name) return user.name.substring(0, 2).toUpperCase();
    return "U";
  };

  const renderContent = () => {
    switch (activeView) {
      case 'subscriptions':
        return <Subscriptions />; // ✅ Admin subscriptions
      case 'plans':
        return <SubscriptionPlans />; // ✅ Superadmin subscription plans
      case 'dashboard':
      default:
        return children;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar onViewChange={setActiveView} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            
            <div className="flex items-center gap-2 lg:hidden">
              <div className="p-1 rounded-md">
                <img src={logo} alt="Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-semibold text-sm">Zipsure AI</span>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-4 pt-0">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MobileDashboardLayout;
