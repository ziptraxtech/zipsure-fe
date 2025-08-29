// AllocatorDashboard.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Users, Truck} from "lucide-react";
import { ClipboardPenLine } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import AddJobModal from "./forAdmin/jobs/AddJobModal";
import MetricCard from "./MetricCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Rider & Vehicle state ✅
  const [riders, setRiders] = useState<Rider[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  // ✅ Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsResponse["data"] | null>(null);

  // Fetch jobs
  const fetchAllJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/v1/jobs", {
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

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/v1/analytics/allocator", {
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

  // ✅ Fetch riders & vehicles when modal opens
  useEffect(() => {
    if (assignModalOpen) {
      const token = localStorage.getItem("token");

      // Fetch riders
      fetch("http://localhost:3000/api/v1/users?role=rider", {
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

      // Fetch vehicles
      fetch("http://localhost:3000/api/v1/vehicles/organization", {
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

  const handleConfirmAssign = () => {
    if (!selectedJob || !selectedRider || !selectedVehicle) return;
    const token = localStorage.getItem("token");

    fetch(`http://localhost:3000/api/v1/jobs/${selectedJob.id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        riderId: selectedRider,
        vehicleId: selectedVehicle,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setAssignModalOpen(false);
        fetchAllJobs();
        fetchAnalytics(); // refresh analytics too
      })
      .catch((err) => console.error("Failed to update job", err));
  };

  // ✅ Build metrics dynamically from analytics API
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
    <div className="space-y-6">
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
                <Plus className="h-4 w-4 mr-1" /> Add Job
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-2 text-center text-muted-foreground">
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
    </div>
  );
};

export default AllocatorDashboard;
