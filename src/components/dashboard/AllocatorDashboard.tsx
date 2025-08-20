// AllocatorDashboard.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, DollarSign, Star, MapPin } from "lucide-react";
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

// ✅ Hardcoded metrics array added here
const metrics = [
  {
    title: "Jobs Today",
    value: "12",
    subtitle: "2 pending, 1 active",
    icon: ClipboardList,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Earnings Today",
    value: "$240",
    subtitle: "Average: $20/job",
    icon: DollarSign,
    trend: { value: 15, isPositive: true },
    variant: "success" as const,
  },
  {
    title: "Rating",
    value: "4.9",
    subtitle: "125 reviews",
    icon: Star,
    variant: "success" as const,
  },
  {
    title: "Distance Covered",
    value: "87 km",
    subtitle: "This week",
    icon: MapPin,
    trend: { value: 5, isPositive: true },
  },
];


const AllocatorDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Rider & Vehicle state
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

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

  useEffect(() => {
    fetchAllJobs();
  }, []);

  // Fetch riders when modal opens
  useEffect(() => {
    if (assignModalOpen) {
      const token = localStorage.getItem("token");
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

    fetch(`http://localhost:3000/api/v1/jobs/${selectedJob.id}`, {
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
      })
      .catch((err) => console.error("Failed to update job", err));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <Card className="fleet-card-gradient shadow-md border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsAddJobOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Job
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left font-bold">Sr. no.</th>
                  <th className="p-2 text-left font-bold">Job Title</th>
                  <th className="p-2 text-left font-bold">Job Description</th>
                  <th className="p-2 text-left font-bold">Allocator Name</th>
                  <th className="p-2 text-left font-bold">Status</th>
                  <th className="p-2 text-left font-bold">Rider & Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length > 0 ? (
                  jobs.map((job, index) => (
                    <tr
                      key={job.id}
                      className="border-b border-border/50 hover:bg-muted/50"
                    >
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{job.title || "—"}</td>
                      <td className="p-2">{job.description || "-"}</td>
                      <td className="p-2">
                        {job.allocator
                          ? `${job.allocator.firstName} ${job.allocator.lastName}`
                          : "—"}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{job.status}</Badge>
                      </td>
                      <td className="p-2">
                        {job.rider ? (
                          `${job.rider.firstName} ${job.rider.lastName}`
                        ) : (
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => handleOpenAssignModal(job)}
                          >
                            Assign
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-2 text-center text-muted-foreground"
                    >
                      No recent jobs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Job Modal */}
      <AddJobModal
        open={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onJobAdded={fetchAllJobs}
      />

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
              <SelectItem value="bike">Bike</SelectItem>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
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
