import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddJobModal from "./AddJobModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface RecentJobsTableProps {
  recentJobs: any[];
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
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Rider-related state
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");

  // Vehicle-related state
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

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

  // Finds job ID based on title & customer name
  const findJobByTitleAndCustomer = (title: string, customerName: string) => {
    return recentJobs.find((job) => {
      const fullName = job.allocator
        ? `${job.allocator.firstName} ${job.allocator.lastName}`
        : "";
      return job.title === title && fullName === customerName;
    });
  };

  const handleOpenAssignModal = (job: any) => {
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
        fetchAllJobs(); // refresh table
      })
      .catch((err) => console.error("Failed to update job", err));
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left">Sr. no.</th>
                <th className="p-2 text-left">Job Title</th>
                <th className="p-2 text-left">Customer Name</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Rider</th>
                <th className="p-2 text-left">Completed</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length > 0 ? (
                recentJobs.map((job, index) => (
                  <tr
                    key={`${job.title}-${job.allocator?.firstName || ""}`}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{job.title || "—"}</td>
                    <td className="p-2">
                      {job.allocator
                        ? `${job.allocator.firstName} ${job.allocator.lastName}`
                        : "—"}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{job.status}</Badge>
                    </td>

                    {/* Rider column */}
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

                    <td className="p-2 text-muted-foreground">
                      {timeAgo(job.completedAt)}
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
    </Card>
  );
};

export default RecentJobsTable;
