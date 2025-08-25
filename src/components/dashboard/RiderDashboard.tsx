import React from 'react';
import MetricCard from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardList, 
  MapPin, 
  DollarSign, 
  Clock,
  CheckCircle,
  Navigation,
  Phone,
  Star,
  TrendingUp
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const RiderDashboard = () => {
  const metrics = [
    {
      title: "Jobs Today",
      value: "12",
      subtitle: "2 pending, 1 active",
      icon: ClipboardList,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Earnings Today",
      value: "$240",
      subtitle: "Average: $20/job",
      icon: DollarSign,
      trend: { value: 15, isPositive: true },
      variant: 'success' as const
    },
    {
      title: "Rating",
      value: "4.9",
      subtitle: "125 reviews",
      icon: Star,
      variant: 'success' as const
    },
    {
      title: "Distance Covered",
      value: "87 km",
      subtitle: "This week",
      icon: MapPin,
      trend: { value: 5, isPositive: true }
    }
  ];

  const { toast } = useToast();

  type MyJob = {
    id: string;
    title: string;
    description: string | null;
    pickupLocation: string | null;
    deliveryLocation: string | null;
    scheduledTime: string | null;
    status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | string;
  };

  const [myJobs, setMyJobs] = React.useState<MyJob[]>([]);
  const [loadingMyJobs, setLoadingMyJobs] = React.useState<boolean>(true);
  const [statusDraftById, setStatusDraftById] = React.useState<Record<string, MyJob['status']>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const allowedStatuses: MyJob['status'][] = ['accepted', 'in_progress', 'completed', 'cancelled'];

  const fetchMyJobs = async () => {
    try {
      setLoadingMyJobs(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/jobs/my-jobs', {
        headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const jobs: MyJob[] = json.data.map((j: any) => ({
          id: j.id,
          title: j.title,
          description: j.description ?? null,
          pickupLocation: j.pickupLocation ?? null,
          deliveryLocation: j.deliveryLocation ?? null,
          scheduledTime: j.scheduledTime ?? null,
          status: j.status,
        }));
        setMyJobs(jobs);
        setStatusDraftById(Object.fromEntries(jobs.map(j => [j.id, j.status])));
      } else {
        setMyJobs([]);
      }
    } catch (err) {
      console.error('Failed to fetch my jobs', err);
      toast({ title: 'Error', description: 'Failed to load your jobs', variant: 'destructive' });
    } finally {
      setLoadingMyJobs(false);
    }
  };

  const updateMyJobStatus = async (jobId: string) => {
    const newStatus = statusDraftById[jobId];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      toast({ title: 'Invalid status', description: 'Please choose a valid status.' });
      return;
    }
    try {
      setSavingId(jobId);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/v1/jobs/my-jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to update status');
      }
      toast({ title: 'Status updated' });
      fetchMyJobs();
    } catch (err) {
      console.error(err);
      toast({ title: 'Update failed', description: 'Could not update job status', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  React.useEffect(() => {
    fetchMyJobs();
  }, []);

  const currentJob = {
    id: "JOB-042",
    customer: "Downtown Delivery",
    pickup: "123 Main St, Business District",
    delivery: "456 Oak Ave, Downtown",
    estimatedTime: "25 mins",
    payment: "$18",
    customerPhone: "+1 (555) 123-4567",
    instructions: "Leave at front desk, ask for reception"
  };

  const upcomingJobs = [
    { id: "JOB-043", customer: "Express Pickup", location: "Mall District", time: "2:30 PM", payment: "$15" },
    { id: "JOB-044", customer: "Medical Delivery", location: "Hospital Zone", time: "3:15 PM", payment: "$22" },
  ];

  const recentJobs = [
    { id: "JOB-039", customer: "Office Supplies", status: "completed", payment: "$16", time: "1 hour ago" },
    { id: "JOB-040", customer: "Lunch Delivery", status: "completed", payment: "$12", time: "2 hours ago" },
    { id: "JOB-041", customer: "Pharmacy Run", status: "completed", payment: "$20", time: "3 hours ago" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-success border-success">Completed</Badge>;
      case 'active':
        return <Badge variant="outline" className="text-warning border-warning">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-primary border-primary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div id="rider-dashboard-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">
            Mike Johnson • Currently Available
          </p>
        </div>
        <Badge variant="outline" className="text-success border-success w-fit">
          Available
        </Badge>
      </div>

      {/* Metrics Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* My Jobs */}
      <Card className="fleet-card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            My Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="text-xs md:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Pickup</TableHead>
                <TableHead className="hidden md:table-cell">Delivery</TableHead>
                <TableHead className="hidden lg:table-cell">Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingMyJobs ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-3 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : myJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-3 text-center text-muted-foreground">No jobs assigned</TableCell>
                </TableRow>
              ) : (
                myJobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium whitespace-normal break-words max-w-[200px] md:max-w-none">{job.title}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">{job.pickupLocation || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">{job.deliveryLocation || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-normal break-words">{job.scheduledTime ? new Date(job.scheduledTime).toLocaleString() : '—'}</TableCell>
                    <TableCell className="capitalize">{job.status}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={statusDraftById[job.id]}
                          onValueChange={(v) => setStatusDraftById(prev => ({ ...prev, [job.id]: v as MyJob['status'] }))}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedStatuses.map(s => (
                              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => updateMyJobStatus(job.id)} disabled={savingId === job.id}>
                          {savingId === job.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Current Job */}
      <Card className="fleet-card-gradient border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Current Job
            </CardTitle>
            <Badge className="bg-primary">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Job ID</p>
                <p className="font-mono font-medium">{currentJob.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{currentJob.customer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="text-sm">{currentJob.pickup}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery</p>
                <p className="text-sm">{currentJob.delivery}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Time</span>
                <span className="font-medium">{currentJob.estimatedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment</span>
                <span className="font-medium text-success">{currentJob.payment}</span>
              </div>
              
              <div className="pt-2 space-y-2">
                <Button className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Navigate to Pickup
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </Button>
              </div>
            </div>
          </div>
          
          {currentJob.instructions && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
              <p className="text-sm">{currentJob.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Jobs */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingJobs.map((job, index) => (
                <div key={index} className="p-3 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{job.customer}</p>
                      <p className="text-sm text-muted-foreground">{job.id}</p>
                    </div>
                    <p className="text-sm font-medium text-success">{job.payment}</p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="fleet-card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Week's Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Jobs Completed</span>
                <span className="font-medium">67/70</span>
              </div>
              <Progress value={96} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">On-Time Rate</span>
                <span className="font-medium">95%</span>
              </div>
              <Progress value={95} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Rating</span>
                <span className="font-medium">4.9/5.0</span>
              </div>
              <Progress value={98} className="h-2" />
              
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Weekly Earnings</span>
                  <span className="font-bold text-success">$1,240</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className="fleet-card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Job ID</th>
                  <th className="text-left p-2 font-medium">Customer</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Payment</th>
                  <th className="text-left p-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50 fleet-transition">
                    <td className="p-2 font-mono text-sm">{job.id}</td>
                    <td className="p-2 font-medium">{job.customer}</td>
                    <td className="p-2">{getStatusBadge(job.status)}</td>
                    <td className="p-2 text-success font-medium">{job.payment}</td>
                    <td className="p-2 text-muted-foreground">{job.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderDashboard;