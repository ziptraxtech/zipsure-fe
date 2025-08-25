import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddJobModal from "./AddJobModal";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
}

interface VehicleSummary {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
}

interface JobSummary {
  id: string;
  title: string;
  description?: string | null;
  allocator?: Partial<UserSummary> | null;
  rider?: Partial<UserSummary> | null;
  status: string;
  completedAt: string | null;
  vehicleId?: string | null;
}

interface RecentJobsTableProps {
  recentJobs: JobSummary[];
  fetchAllJobs: () => void;
  loadingJobs: boolean;
}

const timeAgo = (dateString: string | null) => {
  if (!dateString) return "Not completed yet";
  const now = new Date();
  const completedTime = new Date(dateString);
  const diffMs = now.getTime() - completedTime.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const RecentJobsTable: React.FC<RecentJobsTableProps> = ({ recentJobs, fetchAllJobs, loadingJobs }) => {
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);

  const { toast } = useToast();

  // Rider-related state
  const [riders, setRiders] = useState<UserSummary[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");

  // Vehicle-related state
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  // Fetch riders + vehicles when modal opens
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
            setRiders(data.data as UserSummary[]);
          }
        })
        .catch((err) => console.error("Failed to fetch riders", err));

      // Fetch vehicles
      fetch("http://localhost:3000/api/v1/vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setVehicles(data.data as VehicleSummary[]);
          }
        })
        .catch((err) => console.error("Failed to fetch vehicles", err));
    }
  }, [assignModalOpen]);

  // Finds job ID based on title & customer name
  const findJobByTitleAndCustomer = (title: string, customerName: string): JobSummary | undefined => {
    return recentJobs.find((job: JobSummary) => {
      const fullName = job.allocator
        ? `${job.allocator.firstName} ${job.allocator.lastName}`
        : "";
      return job.title === title && fullName === customerName;
    });
  };

  const handleOpenAssignModal = (job: JobSummary) => {
    // Get job ID by matching title and customer name
    const customerName = job.allocator
      ? `${job.allocator.firstName} ${job.allocator.lastName}`
      : "";
    const foundJob = findJobByTitleAndCustomer(job.title, customerName);

    if (foundJob) {
      setSelectedJob(foundJob); // store full job object
      setSelectedRider(foundJob.rider?.id || "");
      setSelectedVehicle(foundJob.vehicleId || "");
      setAssignModalOpen(true);
    } else {
      console.error("Job not found for given title and customer name");
    }
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
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const errorMsg = data?.details?.message || data?.message || "Failed to assign job";
          toast({
            title: "Assignment failed",
            description: errorMsg,
            className: "bg-red-500 text-white",
          });
          return;
        }
        const okMsg = data?.detail?.message || "Job assigned successfully";
        toast({
          title: "Success",
          description: okMsg,
          className: "bg-green-500 text-white",
        });
        setAssignModalOpen(false);
        // Intentionally not auto-refreshing jobs to avoid showing All Jobs list automatically
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "An error occurred.";
        toast({
          title: "Assignment failed",
          description: message,
          className: "bg-red-500 text-white",
        });
        console.error("Failed to update job", err);
      });
  };

  return (
    <Card className="fleet-card-gradient shadow-md border rounded-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Jobs
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAllJobs}>
              <Eye className="h-4 w-4 mr-2" />
              {loadingJobs ? "Loading..." : "View All Jobs"}
            </Button>
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
              <TableHead className="hidden md:table-cell">Sr. no.</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead className="hidden md:table-cell">Job Description</TableHead>
              <TableHead className="hidden lg:table-cell">Allocator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Completed</TableHead>
              <TableHead>Rider & Vehicle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentJobs.length > 0 ? (
              recentJobs.map((job, index) => (
                <TableRow
                  key={`${job.title}-${job.allocator?.firstName || ""}`}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="hidden md:table-cell">{index + 1}</TableCell>
                  <TableCell className="whitespace-normal break-words max-w-[200px] md:max-w-none">{job.title || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell whitespace-normal break-words">{job.description || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell whitespace-normal break-words">
                    {job.allocator
                      ? `${job.allocator.firstName} ${job.allocator.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{timeAgo(job.completedAt)}</TableCell>
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
                <TableCell colSpan={7} className="p-2 text-center text-muted-foreground">
                  No recent jobs
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

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
    </Card>
  );
};

export default RecentJobsTable;
