import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: () => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ open, onClose, onJobAdded }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pickupLocation: "",
    deliveryLocation: "",
    pickupLongitude: "",
    pickupLatitude: "",
    deliveryLongitude: "",
    deliveryLatitude: "",
    scheduleTime: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not authenticated.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("http://localhost:3000/api/v1/jobs", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast({
          variant: "default", // green
          title: "Success",
          description: "Job created successfully",
          className: "bg-green-500 text-white",
        });
        onJobAdded();
        onClose();
        setFormData({
          title: "",
          description: "",
          pickupLocation: "",
          deliveryLocation: "",
          pickupLongitude: "",
          pickupLatitude: "",
          deliveryLongitude: "",
          deliveryLatitude: "",
          scheduleTime: "",
        });
      }
    } catch (err: any) {
      console.error("Error adding job:", err);

      if (err.response?.status === 500) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong",
          className: "bg-red-500 text-white",
        });
      } else if (err.response?.status === 400) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Wrong input",
          className: "bg-red-500 text-white",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Job not created",
          className: "bg-red-500 text-white",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Input name="title" placeholder="Job Title" value={formData.title} onChange={handleChange} />
          <Input name="description" placeholder="Job Description" value={formData.description} onChange={handleChange} />

          <Input name="pickupLocation" placeholder="Pickup Location" value={formData.pickupLocation} onChange={handleChange} />
          <Input name="deliveryLocation" placeholder="Delivery Location" value={formData.deliveryLocation} onChange={handleChange} />

          <Input name="pickupLongitude" placeholder="Pickup Longitude" value={formData.pickupLongitude} onChange={handleChange} />
          <Input name="pickupLatitude" placeholder="Pickup Latitude" value={formData.pickupLatitude} onChange={handleChange} />

          <Input name="deliveryLongitude" placeholder="Delivery Longitude" value={formData.deliveryLongitude} onChange={handleChange} />
          <Input name="deliveryLatitude" placeholder="Delivery Latitude" value={formData.deliveryLatitude} onChange={handleChange} />

          <Input
            type="datetime-local"
            name="scheduleTime"
            value={formData.scheduleTime}
            onChange={handleChange}
          />
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
