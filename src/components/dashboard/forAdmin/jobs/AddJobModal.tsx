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

const API_URL = import.meta.env.VITE_API_URL;

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: (newJob?: any) => void;
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const getFieldError = (name: string, value: string): string => {
    let error = "";

    if (name === "title") {
      if (!value.trim()) error = "Job title is required";
      else if (value.length < 5) error = "Job title must be at least 5 characters";
    }

    if (name === "description") {
      if (!value.trim()) error = "Job description is required";
      else if (value.length < 5)
        error = "Job description must be at least 5 characters";
    }

    if (name === "pickupLocation") {
      if (!value.trim()) error = "Pickup location is required";
      else if (value.length < 3)
        error = "Pickup location must be at least 3 characters";
    }

    if (name === "deliveryLocation") {
      if (!value.trim()) error = "Delivery location is required";
      else if (value.length < 3)
        error = "Delivery location must be at least 3 characters";
    }

    if (["pickupLatitude", "deliveryLatitude"].includes(name)) {
      if (
        value &&
        (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 1)
      ) {
        error = "Latitude must be a number between 0 and 1";
      }
    }

    if (["pickupLongitude", "deliveryLongitude"].includes(name)) {
      if (
        value &&
        (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 1)
      ) {
        error = "Longitude must be a number between 0 and 1";
      }
    }

    return error;
  };

  const validateField = (name: string, value: string) => {
    const error = getFieldError(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    Object.entries(formData).forEach(([key, value]) => {
      newErrors[key] = getFieldError(key, value as string);
    });
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        className: "bg-red-500 text-white",
        title: "Error",
        duration: 5000,
        description: "You are not authenticated.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/v1/jobs`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast({
          title: "Success",
          description: "Job created successfully",
          className: "bg-green-500 text-white",
          duration: 5000,
        });
        onJobAdded(response.data);
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
        setErrors({});
      }
    } catch (err: any) {
      console.error("Error adding job:", err);

      if (err.response?.status === 400) {
        const errorData = err.response.data;
        let errorMessage = "Invalid input";

        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details
            .map((d: any) => `${d.field || "Field"}: ${d.message || "Invalid value"}`)
            .join("\n");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }

        toast({
          title: "Input Error",
          description: errorMessage,
          className: "bg-red-500 text-white whitespace-pre-line",
          duration: 7000,
        });
      } else {
        toast({
          title: "Error",
          description: err.message || "Failed to create job",
          className: "bg-red-500 text-white",
          duration: 5000,
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
          {/* Title */}
          <div>
            <Label className="mb-2 block">Job Title</Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.title ? "border-red-500" : ""}`}
              required
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <Label className="mb-2 block">Job Description</Label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.description ? "border-red-500" : ""}`}
              required
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Pickup Location */}
          <div>
            <Label className="mb-2 block">Pickup Location</Label>
            <Input
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.pickupLocation ? "border-red-500" : ""}`}
              required
            />
            {errors.pickupLocation && (
              <p className="text-red-500 text-sm">{errors.pickupLocation}</p>
            )}
          </div>

          {/* Delivery Location */}
          <div>
            <Label className="mb-2 block">Delivery Location</Label>
            <Input
              name="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.deliveryLocation ? "border-red-500" : ""}`}
              required
            />
            {errors.deliveryLocation && (
              <p className="text-red-500 text-sm">{errors.deliveryLocation}</p>
            )}
          </div>

          {/* Pickup Longitude */}
          <div>
            <Label className="mb-2 block">Pickup Longitude</Label>
            <Input
              name="pickupLongitude"
              value={formData.pickupLongitude}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.pickupLongitude ? "border-red-500" : ""}`}
            />
            {errors.pickupLongitude && (
              <p className="text-red-500 text-sm">{errors.pickupLongitude}</p>
            )}
          </div>

          {/* Pickup Latitude */}
          <div>
            <Label className="mb-2 block">Pickup Latitude</Label>
            <Input
              name="pickupLatitude"
              value={formData.pickupLatitude}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.pickupLatitude ? "border-red-500" : ""}`}
            />
            {errors.pickupLatitude && (
              <p className="text-red-500 text-sm">{errors.pickupLatitude}</p>
            )}
          </div>

          {/* Delivery Longitude */}
          <div>
            <Label className="mb-2 block">Delivery Longitude</Label>
            <Input
              name="deliveryLongitude"
              value={formData.deliveryLongitude}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.deliveryLongitude ? "border-red-500" : ""}`}
            />
            {errors.deliveryLongitude && (
              <p className="text-red-500 text-sm">{errors.deliveryLongitude}</p>
            )}
          </div>

          {/* Delivery Latitude */}
          <div>
            <Label className="mb-2 block">Delivery Latitude</Label>
            <Input
              name="deliveryLatitude"
              value={formData.deliveryLatitude}
              onChange={handleChange}
              className={`bg-gray-100 ${errors.deliveryLatitude ? "border-red-500" : ""}`}
            />
            {errors.deliveryLatitude && (
              <p className="text-red-500 text-sm">{errors.deliveryLatitude}</p>
            )}
          </div>

          {/* Schedule Time */}
          <div>
            <Label className="mb-2 block">Schedule Date & Time</Label>
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
          <Button
                        variant="secondary"
                        onClick={() => {
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
                          setErrors({});
                        }}
                      >
                        Clear
                      </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
