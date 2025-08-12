import React from 'react';
import MetricCard from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Users, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Send
} from 'lucide-react';

const AllocatorDashboard = () => {
  const metrics = [
    {
      title: "Jobs Allocated Today",
      value: "34",
      subtitle: "8 pending assignment",
      icon: ClipboardList,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Available Riders",
      value: "27",
      subtitle: "Out of 35 total",
      icon: Users,
      trend: { value: 3, isPositive: true },
      variant: 'success' as const
    },
    {
      title: "Active Routes",
      value: "19",
      subtitle: "Real-time tracking",
      icon: MapPin,
      variant: 'warning' as const
    },
    {
      title: "Completion Rate",
      value: "94%",
      subtitle: "Last 7 days",
      icon: CheckCircle,
      trend: { value: 2, isPositive: true },
      variant: 'success' as const
    }
  ];

  const pendingJobs = [
    { id: "JOB-025", customer: "City Mall Pickup", priority: "high", location: "Downtown", estimatedTime: "45 min" },
    { id: "JOB-026", customer: "Office Supplies", priority: "medium", location: "Business District", estimatedTime: "30 min" },
    { id: "JOB-027", customer: "Grocery Delivery", priority: "low", location: "Suburbs", estimatedTime: "60 min" },
    { id: "JOB-028", customer: "Medical Transport", priority: "urgent", location: "Hospital Zone", estimatedTime: "20 min" },
  ];

  const availableRiders = [
    { name: "Mike Johnson", location: "Downtown", rating: 4.9, status: "available", distance: "0.5 km" },
    { name: "Sarah Wilson", location: "Business District", rating: 4.8, status: "available", distance: "1.2 km" },
    { name: "Alex Brown", location: "Mall Area", rating: 4.7, status: "available", distance: "0.8 km" },
    { name: "Emma Davis", location: "Suburbs", rating: 4.9, status: "break", distance: "2.1 km" },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-destructive border-destructive">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-warning border-warning">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="text-success border-success">Available</Badge>;
      case 'busy':
        return <Badge variant="outline" className="text-warning border-warning">Busy</Badge>;
      case 'break':
        return <Badge variant="outline" className="text-muted-foreground">On Break</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Allocation</h1>
          <p className="text-muted-foreground">
            Manage and assign jobs to available riders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Live Map
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Jobs */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Pending Assignments
              </CardTitle>
              <Badge variant="outline" className="text-warning border-warning">
                {pendingJobs.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingJobs.map((job, index) => (
                <div key={index} className="p-3 border border-border rounded-lg hover:bg-muted/50 fleet-transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{job.customer}</p>
                      <p className="text-sm text-muted-foreground">{job.id}</p>
                    </div>
                    {getPriorityBadge(job.priority)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.estimatedTime}
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full">
                    <Send className="h-3 w-3 mr-2" />
                    Assign Rider
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Riders */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Riders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableRiders.map((rider, index) => (
                <div key={index} className="p-3 border border-border rounded-lg hover:bg-muted/50 fleet-transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ⭐ {rider.rating} • {rider.distance} away
                      </p>
                    </div>
                    {getStatusBadge(rider.status)}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    {rider.location}
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full" 
                    disabled={rider.status !== 'available'}
                    variant={rider.status === 'available' ? 'default' : 'outline'}
                  >
                    {rider.status === 'available' ? 'Assign Job' : 'Unavailable'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="fleet-card-gradient">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <MapPin className="h-6 w-6" />
              <span>View Live Map</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ClipboardList className="h-6 w-6" />
              <span>Job History</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Emergency Jobs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllocatorDashboard;