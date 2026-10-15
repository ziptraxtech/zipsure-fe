import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface AllJobsModalProps {
  allJobs: any[];
  onClose: () => void;
  onEdit?: (job: any) => void;
  onDelete?: (job: any) => void;
}

const AllJobsModal: React.FC<AllJobsModalProps> = ({ allJobs, onClose, onEdit, onDelete }) => {
  const { toast } = useToast();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    pickupLongitude: "",
    pickupLatitude: "",
    deliveryLongitude: "",
    deliveryLatitude: "",
  });

  const startEdit = (job: any) => {
    if (onEdit) return onEdit(job);
    setEditing(job);
    setForm({
      title: job.title || "",
      description: job.description || "",
      pickupLongitude: job.pickupLongitude || "",
      pickupLatitude: job.pickupLatitude || "",
      deliveryLongitude: job.deliveryLongitude || "",
      deliveryLatitude: job.deliveryLatitude || "",
    });
  };

  const startDelete = (job: any) => {
    if (onDelete) return onDelete(job);
    setDeleting(job);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!token) {
      toast({ title: "Auth error", description: "Not authenticated", className: "bg-red-500 text-white", duration: 5000 });
      return;
    }
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        pickupLongitude: form.pickupLongitude.trim(),
        pickupLatitude: form.pickupLatitude.trim(),
        deliveryLongitude: form.deliveryLongitude.trim(),
        deliveryLatitude: form.deliveryLatitude.trim(),
      };

      await axios.put(`${API_URL}/api/v1/jobs/${editing.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Updated", description: "Job updated successfully", className: "bg-green-500 text-white", duration: 5000 });
      setEditing(null);
      const idx = allJobs.findIndex((j) => j.id === editing.id);
      if (idx >= 0) {
        allJobs[idx].title = payload.title;
        allJobs[idx].description = payload.description;
        allJobs[idx].pickupLongitude = payload.pickupLongitude;
        allJobs[idx].pickupLatitude = payload.pickupLatitude;
        allJobs[idx].deliveryLongitude = payload.deliveryLongitude;
        allJobs[idx].deliveryLatitude = payload.deliveryLatitude;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Failed to update job";
      toast({ title: "Error", description: msg, className: "bg-red-500 text-white", duration: 5000 });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    if (!token) {
      toast({ title: "Auth error", description: "Not authenticated", className: "bg-red-500 text-white", duration: 5000 });
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/v1/jobs/${deleting.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Deleted", description: "Job deleted successfully", className: "bg-green-500 text-white", duration: 5000 });
      setDeleting(null);
      const delIdx = allJobs.findIndex((j) => j.id === deleting.id);
      if (delIdx >= 0) allJobs.splice(delIdx, 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Failed to delete job";
      toast({ title: "Error", description: msg, className: "bg-red-500 text-white", duration: 5000 });
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">All Jobs</h2>
          <Button variant="no-hover" size="icon" onClick={onClose}>
            <X/>
          </Button>
        </div>
        <div className="overflow-x-auto">
  <table className="w-full border rounded-lg overflow-hidden table-fixed min-w-[800px]">
    <thead>
      <tr className="border-b border-border bg-primary">
        <th className="p-2 text-left">Sr. no.</th>
        <th className="p-2 text-left">Job Title</th>
        <th className="p-2 text-left">Allocator Name</th>
        <th className="p-2 text-left">Status</th>
        <th className="p-2 text-left">Rider</th>
        <th className="p-2 text-left">Vehicle</th>
        <th className="p-2 text-left">Created At</th>
        <th className="p-2 text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      {allJobs.length > 0 ? (
        allJobs.map((job, index) => (
          <tr key={job.id} className="border-b hover:bg-muted/50">
            <td className="p-2 align-top w-16">{index + 1}</td>
            <td className="p-2 whitespace-normal break-words max-w-[260px] md:max-w-[340px]">{job.title}</td>
            <td className="p-2 whitespace-normal break-words max-w-[240px] md:max-w-[300px]">{job.allocator ? `${job.allocator.firstName} ${job.allocator.lastName}` : "—"}</td>
            <td className="p-2 align-top"><Badge variant="outline">{job.status}</Badge></td>
            <td className="p-2 whitespace-normal break-words max-w-[240px] md:max-w-[300px]">{job.rider ? `${job.rider.firstName} ${job.rider.lastName}` : "—"}</td>
            <td className="p-2 whitespace-normal break-words max-w-[200px]">{job.vehicle ? job.vehicle.vehicleNumber : "—"}</td>
            <td className="p-2 whitespace-normal break-words">{new Date(job.createdAt).toLocaleString()}</td>
            <td className="p-2">
              {String(job.status).toLowerCase() !== 'completed' ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <Button variant="outline" size="default" className="px-3 py-1.5" onClick={() => startEdit(job)}>
                    Edit
                  </Button>
                  <Button color="primary" size="default" className="px-3 py-1.5" onClick={() => startDelete(job)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-muted-foreground">Completed</span>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={8} className="p-2 text-center text-muted-foreground">No jobs found</td>
        </tr>
      )}
    </tbody>
  </table>
</div>

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

export default AllJobsModal;
