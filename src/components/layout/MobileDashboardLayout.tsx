import React, { useState, useRef } from 'react';
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
  Settings, 
  LogOut, 
  Shield, 
  Building2,
  MapPin,
  ClipboardList,
  Home,
  Truck,
  QrCode,
  PlugZap,
  Map
} from 'lucide-react';
import logo from '@/assets/logo.png';

import Subscriptions from '@/components/dashboard/forAdmin/payment/subscriptions';
import SubscriptionPlans from '@/components/dashboard/forSuperadmin/SubscriptionPlans';
import ChangePassword from '@/contexts/ChangePassword';
import Jobs from '@/components/dashboard/forSuperadmin/Jobs';
import RiderJobs from '@/components/dashboard/forRider/Jobs-rider';
import NearbyChargers from '@/components/dashboard/forRider/chargers';
import QRScannerPage from '@/components/dashboard/forRider/QRScannerPage';
import Chargers from '@/components/dashboard/forSuperadmin/allChargers';
import RidersMap from '@/components/dashboard/forAdmin/user-section/RidersMap';

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
  | 'history'
  | 'jobs-rider'
  | 'nearby chargers'
  | 'qr-scanner'
  | 'chargers'
  | 'riders-map';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  view: ActiveView;
  scrollTo?: string;
}

const AppSidebar = ({ onViewChange, orgRef, onOpenChangePassword }: { onViewChange: (view: ActiveView) => void, orgRef: React.RefObject<HTMLDivElement>, onOpenChangePassword: () => void }) => {
  const { user, logout } = useAuth() as { user: User | null; logout: () => void };
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const localUser = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const fullName =
    localUser?.firstName && localUser?.lastName
      ? `${localUser.firstName} ${localUser.lastName}`
      : user?.name || "User";

  const handleNavigation = (view: ActiveView, scrollTo?: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }

    if (scrollTo) {
      const element = document.getElementById(scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    
    if (view === "organizations" && orgRef.current) {
      orgRef.current.scrollIntoView({ behavior: "smooth" });
      return;
    }
    
    setActiveView(view);
    onViewChange(view);
  };

  const getNavigationItems = (): NavigationItem[] => {
    const getDashboardId = () => {
      switch (user?.role) {
        case 'superadmin': return 'dashboard-top';
        case 'admin': return 'admin-dashboard-top';
        case 'allocator': return 'allocator-dashboard-top';
        case 'rider': return 'rider-dashboard-top';
        default: return 'dashboard-top';
      }
    };

    const baseItems: NavigationItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, url: '#', view: 'dashboard', scrollTo: getDashboardId() }
    ];

    switch (user?.role) {
      case 'superadmin':
        return [
          ...baseItems,
          { id: 'organizations', label: 'Organizations', icon: Building2, url: '#', view: 'organizations', scrollTo: 'organizations-section' },
          { id: 'plans', label: 'Subscription Plans', icon: Shield, url: '/plans', view: 'plans' },
          { id: 'users', label: 'All Users', icon: Users, url: '#', view: 'users', scrollTo: 'users-section' },
          { id: 'jobs', label: 'All Jobs', icon: Truck, url: '/jobs', view: 'jobs' },
          { id: 'chargers', label: 'Chargers', icon: PlugZap, url: '/chargers', view: 'chargers' }
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign, url: '/subscriptions', view: 'subscriptions' },
          { id: 'users', label: 'Team Members', icon: Users, url: '#', view: 'users', scrollTo: 'admin-users-section' },
          { id: 'riders-map', label: 'Riders Map', icon: Map, url: '/riders-map', view: 'riders-map' }
        ];
      case 'allocator':
        return [
          ...baseItems,
          { id: 'jobs', label: 'Job Allocation', icon: ClipboardList, url: '#', view: 'jobs', scrollTo: 'allocator-jobs-section' },
          { id: 'riders-map', label: 'Riders Map', icon: Map, url: '/riders-map', view: 'riders-map' }
        ];
      
      case 'rider':
        return [
          ...baseItems,
          { id: 'jobs', label: 'All Jobs', icon: ClipboardList, url: '/jobs-rider', view: 'jobs-rider' },
          { id: 'nearby chargers', label: 'Map', icon: MapPin, url: '/Map', view: 'nearby chargers' },
          { id: 'qr scanner', label: 'QR Scanner', icon: QrCode, url: '/qr-scanner', view: 'qr-scanner' },
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
    <Sidebar variant="inset" collapsible="icon" className="flex flex-col h-full">
      <SidebarHeader className="shrink-0">
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

      <SidebarContent className="flex-1 overflow-y-auto">
        {/* User Info */}
        {!isCollapsed && user && (
          <SidebarGroup>
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(fullName?.substring(0, 1) || "") + (localUser?.lastName?.substring(0, 1)?.toUpperCase() || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant(user?.role)} className="text-xs">
                {user?.role === "allocator" ? "Fleet Manager" : (user?.role || "user")}
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
        <SidebarGroup className="mb-4">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigation(item.view, item.scrollTo)}
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

      <SidebarFooter className="border-t pt-2 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isCollapsed ? (
              <Button variant="ghost" size="icon" className="w-full">
                <Settings className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full justify-start gap-3">
                <Settings className="h-4 w-4" />
                Account
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenChangePassword}>
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
      </SidebarFooter>
    </Sidebar>
  );
};

const MobileDashboardLayout: React.FC<MobileDashboardLayoutProps> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { user } = useAuth() as { user: User | null };

  const orgRef = useRef<HTMLDivElement>(null);

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
    } catch {
    }
    if (user?.name) return user.name.substring(0, 2).toUpperCase();
    return "U";
  };

  const renderContent = () => {
    switch (activeView) {
      case 'subscriptions':
        return <Subscriptions />;
      case 'plans':
        return <SubscriptionPlans />;
      case 'jobs':
        return <Jobs />;
      case 'jobs-rider': 
        return <RiderJobs />;
      case 'nearby chargers':
        return <NearbyChargers />;
      case 'qr-scanner':
        return <QRScannerPage />;
      case 'chargers':
        return <Chargers />;
      case 'riders-map':
        return <RidersMap />;
      case 'dashboard':
      default:
        return (
          <>
            {children}
          </>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex w-screen h-screen overflow-hidden">
        <AppSidebar 
          onViewChange={setActiveView} 
          orgRef={orgRef} 
          onOpenChangePassword={() => setIsChangePasswordOpen(true)} 
        />
        <SidebarInset className="flex-1 flex flex-col h-full w-full overflow-hidden">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
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
          <div className={`flex-1 p-4 pt-0 ${activeView === 'qr-scanner' || activeView === 'riders-map' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            {renderContent()}
          </div>

          {/* Change Password Modal */}
          <ChangePassword open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MobileDashboardLayout;