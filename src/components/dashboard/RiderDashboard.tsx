import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const RiderDashboard = () => {
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
      const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs/my-jobs`;
      console.log('Fetching jobs from:', url);
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Jobs response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      console.log('Jobs data:', json);
      
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
      toast({ title: 'Error', description: 'Failed to load your jobs', duration: 5000, className: "bg-red-500 text-white" });
    } finally {
      setLoadingMyJobs(false);
    }
  };

  const updateMyJobStatus = async (jobId: string) => {
    const newStatus = statusDraftById[jobId];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      toast({ title: 'Invalid status', description: 'Please choose a valid status.', duration: 5000, className: "bg-red-500 text-white" });
      return;
    }
    try {
      setSavingId(jobId);
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs/my-jobs/${jobId}/status`;
      console.log('Updating job status at:', url);
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      console.log('Update response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      console.log('Update data:', json);
      
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to update status');
      }
      toast({ title: 'Status updated', duration: 5000, className: "bg-green-500 text-white" });
      fetchMyJobs();
    } catch (err) {
      console.error(err);
      toast({ title: 'Update failed', description: 'Could not update job status', duration: 5000, className: "bg-red-500 text-white" });
    } finally {
      setSavingId(null);
    }
  };

  React.useEffect(() => {
    fetchMyJobs();
  }, []);

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

<div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="fixed inset-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206, 122, 122, 0.15)_0%,rgba(255,255,255,0)_70%)] pointer-events-none"
        aria-hidden="true"
      />

    <div className="space-y-6 p-4">
      {/* Header - Mobile Responsive */}
      <div id="rider-dashboard-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">My Dashboard</h1>
        </div>
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
    </div>
    </div>
  );
};

export default RiderDashboard;