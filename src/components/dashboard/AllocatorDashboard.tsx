// AllocatorDashboard.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Users, Truck, Trash2} from "lucide-react";
import { ClipboardPenLine } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddJobModal from "./forAdmin/jobs/AddJobModal";
import MetricCard from "./MetricCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Types
interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  completedAt: string | null;
  pickupLongitude?: string;
  pickupLatitude?: string;
  deliveryLongitude?: string;
  deliveryLatitude?: string;
  allocator?: {
    firstName: string;
    lastName: string;
  };
  rider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vehicleId?: string;
}

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
}

interface AnalyticsResponse {
  success: boolean;
  data: {
    riders: {
      total: number;
      active: number;
    };
    totalVehicles: number;
    totalJobs: number;
    jobStatuses: {
      [key: string]: number;
    };
  };
}

const AllocatorDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [riders, setRiders] = useState<Rider[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const [analytics, setAnalytics] = useState<AnalyticsResponse["data"] | null>(null);

  // New state for edit/delete functionality
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    pickupLongitude: "",
    pickupLatitude: "",
    deliveryLongitude: "",
    deliveryLatitude: ""
  });

  const fetchAllJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/api/v1/analytics/allocator`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: AnalyticsResponse = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  useEffect(() => {
    fetchAllJobs();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (assignModalOpen) {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/api/v1/users?role=rider`;
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setRiders(data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch riders", err));

      const vehicleUrl = `${import.meta.env.VITE_API_URL}/api/v1/vehicles/organization`;
      fetch(vehicleUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setVehicles(data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch vehicles", err));
    }
  }, [assignModalOpen]);

  const handleOpenAssignModal = (job: Job) => {
    setSelectedJob(job);
    setSelectedRider(job.rider?.id || "");
    setSelectedVehicle(job.vehicleId || "");
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedJob || !selectedRider || !selectedVehicle) return;
    const token = localStorage.getItem("token");
    const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs/${selectedJob.id}/status`;
    
    console.log('Updating job status at:', url);
    
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riderId: selectedRider,
          vehicleId: selectedVehicle,
          status: "assigned"
        }),
      });

      console.log('Update response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update job status');
      }

      const data = await res.json();
      console.log('Update successful:', data);
      
      fetchAllJobs();
      setAssignModalOpen(false);
      
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  // New handler functions for edit/delete
  const startEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title || "",
      description: job.description || "",
      pickupLongitude: job.pickupLongitude || "",
      pickupLatitude: job.pickupLatitude || "",
      deliveryLongitude: job.deliveryLongitude || "",
      deliveryLatitude: job.deliveryLatitude || ""
    });
  };

  const startDelete = (job: Job) => {
    setDeleting(job);
  };

  const handleSave = async () => {
    if (!editing) return;
    
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs/${editing.id}`;
      
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          pickupLongitude: form.pickupLongitude,
          pickupLatitude: form.pickupLatitude,
          deliveryLongitude: form.deliveryLongitude,
          deliveryLatitude: form.deliveryLatitude,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update job');
      }

      console.log('Job updated successfully');
      fetchAllJobs(); // Refresh the jobs list
      setEditing(null);
      
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    
    try {
      const token = localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_URL}/api/v1/jobs/${deleting.id}`;
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete job');
      }

      console.log('Job deleted successfully');
      fetchAllJobs(); // Refresh the jobs list
      setDeleting(null);
      
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const metrics = analytics
    ? [
        {
          title: "Active Riders",
          value: `${analytics.riders.active}`,
          subtitle: "Currently active",
          icon: Users,
          variant: "default" as const,
        },
        {
          title: "Total Vehicles",
          value: `${analytics.totalVehicles}`,
          subtitle: "Available fleet",
          icon: Truck,
          variant: "default" as const,
        },
        {
          title: "Total Jobs",
          value: `${analytics.totalJobs}`,
          subtitle: "Available jobs",
          icon: ClipboardList,
          variant: "default" as const,
        },
        {
          title: "Unassigned Jobs",
          value: `${analytics.jobStatuses["yet to be assigned"]}`,
          subtitle: "Yet to be assigned",
          icon: ClipboardPenLine ,
          variant: "default" as const,
        }
      ]
    : [];

  return (

    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206,122,122,0.15)_0%,rgba(255,255,255,0)_70%] pointer-events-none"
        aria-hidden="true"
      />

    <div className="space-y-6 p-4">
      {/* Header */}
      <div id="allocator-dashboard-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Resource Management Dashboard</h1>
          <p className="text-muted-foreground"></p>
        </div>
      </div>    

      {/* Metrics Grid - Responsive */}
      <div id="allocator-dashboard-top" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.length > 0 ? (
          metrics.map((metric, index) => <MetricCard key={index} {...metric} />)
        ) : (
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
        )}
      </div>

      {/* Jobs Section */}
      <Card id="allocator-jobs-section" className="fleet-card-gradient shadow-md border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-4" />
              Jobs
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsAddJobOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="text-xs md:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell font-bold">Sr. no.</TableHead>
                <TableHead className="font-bold">Job Title</TableHead>
                <TableHead className="hidden md:table-cell font-bold">Job Description</TableHead>
                <TableHead className="hidden lg:table-cell font-bold">Allocator</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Rider & Vehicle</TableHead>
                <TableHead className="font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length > 0 ? (
                jobs.map((job, index) => (
                  <TableRow key={job.id} className="hover:bg-muted/50">
                    <TableCell className="hidden md:table-cell">{index + 1}</TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[200px] md:max-w-none">{job.title || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">{job.description || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-normal break-words">
                      {job.allocator ? `${job.allocator.firstName} ${job.allocator.lastName}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {job.rider ? (
                        `${job.rider.firstName} ${job.rider.lastName}`
                      ) : (
                        <Button
                          size="sm"
                          className="bg-primary text-white"
                          onClick={() => handleOpenAssignModal(job)}
                        >
                          Assign
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-3 py-1.5" 
                          onClick={() => startEdit(job)}
                        >
                          Edit
                        </Button>
                        <Button 
                          color="primary" 
                          size="sm" 
                          className="px-3 py-1.5" 
                          onClick={() => startDelete(job)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="p-2 text-center text-muted-foreground">
                    {loadingJobs ? "Loading jobs..." : "No recent jobs"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Job Modal */}
      <AddJobModal open={isAddJobOpen} onClose={() => setIsAddJobOpen(false)} onJobAdded={fetchAllJobs} />

      {/* Assign Rider + Vehicle Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Rider & Vehicle</DialogTitle>
          </DialogHeader>

          {/* Rider dropdown */}
          <Select value={selectedRider} onValueChange={setSelectedRider}>
            <SelectTrigger>
              <SelectValue placeholder="Select Rider" />
            </SelectTrigger>
            <SelectContent>
              {riders.length > 0 ? (
                riders.map((rider) => (
                  <SelectItem key={rider.id} value={rider.id}>
                    {rider.firstName} {rider.lastName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No riders available
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Vehicle dropdown */}
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="mt-3">
              <SelectValue placeholder="Select Vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber} — {vehicle.vehicleType}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No vehicles available
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button
            className="mt-4 bg-green-500 hover:bg-green-600 text-white"
            disabled={!selectedRider || !selectedVehicle}
            onClick={handleConfirmAssign}
          >
            Confirm Assignment
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Job Modal */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label className="mb-4 block">Job Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-4 block">Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-4 block">Pickup Longitude</Label>
              <Input value={form.pickupLongitude} onChange={(e) => setForm({ ...form, pickupLongitude: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-4 block">Pickup Latitude</Label>
              <Input value={form.pickupLatitude} onChange={(e) => setForm({ ...form, pickupLatitude: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-4 block">Drop Longitude</Label>
              <Input value={form.deliveryLongitude} onChange={(e) => setForm({ ...form, deliveryLongitude : e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-4 block">Drop Latitude</Label>
              <Input value={form.deliveryLatitude} onChange={(e) => setForm({ ...form, deliveryLatitude: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Do you really want to delete <span className="font-semibold">{deleting?.title}</span>?</p>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)}>No</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default AllocatorDashboard;