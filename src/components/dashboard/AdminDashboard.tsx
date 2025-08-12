import React from 'react';
import MetricCard from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Users, 
  ClipboardList, 
  DollarSign, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const metrics = [
    {
      title: "Active Vehicles",
      value: "89",
      subtitle: "12 on route",
      icon: Truck,
      trend: { value: 5, isPositive: true }
    },
    {
      title: "Team Members",
      value: "145",
      subtitle: "32 allocators, 113 riders",
      icon: Users,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Jobs Today",
      value: "247",
      subtitle: "89% completion rate",
      icon: ClipboardList,
      trend: { value: 12, isPositive: true },
      variant: 'success' as const
    },
    {
      title: "Monthly Cost",
      value: "$2,890",
      subtitle: "Premium plan",
      icon: DollarSign,
      variant: 'warning' as const
    }
  ];

  const recentJobs = [
    { id: "JOB-001", customer: "Downtown Delivery", rider: "Mike Johnson", status: "completed", time: "2 hours ago" },
    { id: "JOB-002", customer: "Express Pickup", rider: "Sarah Wilson", status: "in_progress", time: "30 mins ago" },
    { id: "JOB-003", customer: "Urgent Transport", rider: "Alex Brown", status: "assigned", time: "15 mins ago" },
    { id: "JOB-004", customer: "Medical Delivery", rider: "Emma Davis", status: "pending", time: "5 mins ago" },
  ];

  const topRiders = [
    { name: "Mike Johnson", jobs: 23, rating: 4.9, earnings: "$1,240" },
    { name: "Sarah Wilson", jobs: 21, rating: 4.8, earnings: "$1,180" },
    { name: "Alex Brown", jobs: 19, rating: 4.7, earnings: "$1,090" },
    { name: "Emma Davis", jobs: 18, rating: 4.9, earnings: "$1,050" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-success border-success">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-warning border-warning">In Progress</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="text-primary border-primary">Assigned</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Organization Dashboard</h1>
          <p className="text-muted-foreground">
            Logistics Corp - Fleet Management Overview
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View Reports</span>
            <span className="sm:hidden">Reports</span>
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Vehicle</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Recent Jobs */}
      <Card className="fleet-card-gradient">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
            <Button variant="outline" size="sm">
              View All Jobs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Job ID</th>
                  <th className="text-left p-2 font-medium">Customer</th>
                  <th className="text-left p-2 font-medium">Rider</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50 fleet-transition">
                    <td className="p-2 font-mono text-sm">{job.id}</td>
                    <td className="p-2 font-medium">{job.customer}</td>
                    <td className="p-2">{job.rider}</td>
                    <td className="p-2">{getStatusBadge(job.status)}</td>
                    <td className="p-2 text-muted-foreground">{job.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Chart */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Jobs Completed</span>
                <span className="font-medium">247/280</span>
              </div>
              <Progress value={88} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">On-Time Delivery</span>
                <span className="font-medium">234/247</span>
              </div>
              <Progress value={95} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Rating</span>
                <span className="font-medium">4.8/5.0</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top Riders */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRiders.map((rider, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 fleet-transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rider.jobs} jobs • ⭐ {rider.rating}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success">{rider.earnings}</p>
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

export default AdminDashboard;