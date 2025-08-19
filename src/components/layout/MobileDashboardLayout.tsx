import React from 'react';
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
  ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface MobileDashboardLayoutProps {
  children: React.ReactNode;
}

interface User {
  role?: string;
  name?: string;
  avatar?: string;
  organizationName?: string;
}

const AppSidebar = () => {
  const { user, logout } = useAuth() as { user: User | null; logout: () => void };
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, url: '/' }
    ];

    switch (user?.role) {
      case 'superadmin':
        return [
          ...baseItems,
          { id: 'organizations', label: 'Organizations', icon: Building2, url: '/organizations' },
          { id: 'analytics', label: 'Global Analytics', icon: BarChart3, url: '/analytics' },
          { id: 'plans', label: 'Subscription Plans', icon: Shield, url: '/plans' },
          { id: 'users', label: 'All Users', icon: Users, url: '/users' },
          { id: 'settings', label: 'System Settings', icon: Settings, url: '/settings' }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign, url: '/forAdmin/subscriptions' },
          { id: 'fleet', label: 'Fleet Management', icon: ClipboardList, url: '/fleet' },
          { id: 'users', label: 'Team Members', icon: Users, url: '/users' },
          { id: 'jobs', label: 'Job Overview', icon: ClipboardList, url: '/jobs' },
          { id: 'analytics', label: 'Analytics', icon: BarChart3, url: '/analytics' },
          { id: 'settings', label: 'Organization Settings', icon: Settings, url: '/settings' }
        ];
      
      case 'allocator':
        return [
          ...baseItems,
          { id: 'jobs', label: 'Job Allocation', icon: ClipboardList, url: '/jobs' },
          { id: 'riders', label: 'Riders', icon: Users, url: '/riders' },
          { id: 'tracking', label: 'Live Tracking', icon: MapPin, url: '/tracking' },
          { id: 'reports', label: 'Reports', icon: BarChart3, url: '/reports' }
        ];
      
      case 'rider':
        return [
          ...baseItems,
          { id: 'jobs', label: 'My Jobs', icon: ClipboardList, url: '/jobs' },
          { id: 'tracking', label: 'Current Route', icon: MapPin, url: '/tracking' },
          { id: 'history', label: 'Job History', icon: BarChart3, url: '/history' }
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
                  {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
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
                    <SidebarMenuButton asChild>
                      <Link to={item.url} className="w-full flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
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
  const { user } = useAuth() as { user: User | null };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            
            <div className="flex items-center gap-2 lg:hidden">
              <div className="p-1  rounded-md">
                <img src={logo} alt="Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="font-semibold text-sm">Zipsure AI</span>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MobileDashboardLayout;
