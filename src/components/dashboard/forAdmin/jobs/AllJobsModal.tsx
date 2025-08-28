import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AllJobsModalProps {
  allJobs: any[];
  onClose: () => void;
}

const AllJobsModal: React.FC<AllJobsModalProps> = ({ allJobs, onClose }) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose} // Close when clicking outside the modal
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-4xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">All Jobs</h2>
          <Button variant="no-hover" size="icon" onClick={onClose}>
            <X/>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b border-border bg-primary">
                <th className="p-2 text-left">Sr. no.</th>
                <th className="p-2 text-left">Allocator Name</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Rider</th>
                <th className="p-2 text-left">Vehicle</th>
                <th className="p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {allJobs.length > 0 ? (
                allJobs.map((job, index) => (
                  <tr key={job.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{job.allocator ? `${job.allocator.firstName} ${job.allocator.lastName}` : "—"}</td>
                    <td className="p-2"><Badge variant="outline">{job.status}</Badge></td>
                    <td className="p-2">{job.rider ? `${job.rider.firstName} ${job.rider.lastName}` : "—"}</td>
                    <td className="p-2">{job.vehicle ? job.vehicle.vehicleNumber : "—"}</td>
                    <td className="p-2">{new Date(job.createdAt).toLocaleString()}</td>
                  </tr>
                  
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-2 text-center text-muted-foreground">No jobs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllJobsModal;
