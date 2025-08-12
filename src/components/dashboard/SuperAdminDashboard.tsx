import React from 'react';
import MetricCard from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Shield,
  AlertCircle
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const metrics = [
    {
      title: "Total Organizations",
      value: "47",
      subtitle: "Active organizations",
      icon: Building2,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Total Revenue",
      value: "$124,580",
      subtitle: "This month",
      icon: DollarSign,
      trend: { value: 8.5, isPositive: true },
      variant: 'success' as const
    },
    {
      title: "Active Users",
      value: "2,847",
      subtitle: "Across all orgs",
      icon: Users,
      trend: { value: 15, isPositive: true }
    },
    {
      title: "Fleet Vehicles",
      value: "1,234",
      subtitle: "Total registered",
      icon: Truck,
      trend: { value: 6, isPositive: true }
    }
  ];

  const organizations = [
    { name: "Logistics Corp", plan: "Premium", users: 145, vehicles: 89, revenue: 2890, status: "active" },
    { name: "Swift Delivery", plan: "Standard", users: 87, vehicles: 54, revenue: 1450, status: "active" },
    { name: "FastTrack", plan: "Basic", users: 32, vehicles: 25, revenue: 890, status: "active" },
    { name: "Metro Transport", plan: "Premium", users: 198, vehicles: 134, revenue: 3240, status: "pending" },
    { name: "City Movers", plan: "Standard", users: 76, vehicles: 43, revenue: 1280, status: "active" }
  ];

  const recentActivity = [
    { type: "new_org", message: "New organization 'QuickShip' registered", time: "2 hours ago" },
    { type: "payment", message: "Payment received from Logistics Corp", time: "4 hours ago" },
    { type: "upgrade", message: "Swift Delivery upgraded to Premium plan", time: "6 hours ago" },
    { type: "alert", message: "System maintenance scheduled", time: "1 day ago" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-success border-success">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Premium':
        return <Badge className="bg-primary">Premium</Badge>;
      case 'Standard':
        return <Badge variant="secondary">Standard</Badge>;
      case 'Basic':
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Global Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Super Administrator</span>
        </div>
      </div>

      {/* Metrics Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Organizations Table */}
      <Card className="fleet-card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Organization</th>
                  <th className="text-left p-2 font-medium">Plan</th>
                  <th className="text-left p-2 font-medium">Users</th>
                  <th className="text-left p-2 font-medium">Vehicles</th>
                  <th className="text-left p-2 font-medium">Revenue</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50 fleet-transition">
                    <td className="p-2 font-medium">{org.name}</td>
                    <td className="p-2">{getPlanBadge(org.plan)}</td>
                    <td className="p-2">{org.users}</td>
                    <td className="p-2">{org.vehicles}</td>
                    <td className="p-2">${org.revenue.toLocaleString()}</td>
                    <td className="p-2">{getStatusBadge(org.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">January</span>
                <span className="font-medium">$98,240</span>
              </div>
              <Progress value={78} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">February</span>
                <span className="font-medium">$112,580</span>
              </div>
              <Progress value={89} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">March</span>
                <span className="font-medium">$124,580</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 fleet-transition">
                  <div className="mt-1">
                    {activity.type === 'alert' && <AlertCircle className="h-4 w-4 text-warning" />}
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-success" />}
                    {activity.type === 'new_org' && <Building2 className="h-4 w-4 text-primary" />}
                    {activity.type === 'upgrade' && <TrendingUp className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;