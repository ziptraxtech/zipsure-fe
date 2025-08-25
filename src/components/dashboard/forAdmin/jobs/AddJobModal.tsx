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
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: () => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({
  open,
  onClose,
  onJobAdded,
}) => {
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

      const response = await axios.post(
        "http://localhost:3000/api/v1/jobs",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast({
          variant: "default",
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

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label className="mb-4 block">Job Title</Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-gray-100"
              required
            />
          </div>

          <div>
            <Label className="mb-4 block">Job Description</Label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="bg-gray-100"
              required
            />
          </div>

          <div>
            <Label className="mb-4 block">Pickup Location</Label>
            <Input
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              className="bg-gray-100"
              required
            />
          </div>

          <div>
            <Label className="mb-4 block">Delivery Location</Label>
            <Input
              name="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={handleChange}
              className="bg-gray-100"
              required
            />
          </div>

          <div>
            <Label className="mb-4 block">Pickup Longitude</Label>
            <Input
              name="pickupLongitude"
              value={formData.pickupLongitude}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Pickup Latitude</Label>
            <Input
              name="pickupLatitude"
              value={formData.pickupLatitude}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Delivery Longitude</Label>
            <Input
              name="deliveryLongitude"
              value={formData.deliveryLongitude}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Delivery Latitude</Label>
            <Input
              name="deliveryLatitude"
              value={formData.deliveryLatitude}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Schedule Date & Time</Label>
            <Input
              type="datetime-local"
              name="scheduleTime"
              value={formData.scheduleTime}
              onChange={handleChange}
              className="bg-gray-100"
              required
            />
          </div>
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
