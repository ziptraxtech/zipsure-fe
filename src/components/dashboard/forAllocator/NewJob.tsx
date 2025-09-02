"use client";

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

// Using Vite's environment variable
const API_URL = import.meta.env.VITE_API_URL;

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: () => void;
}

const NewJob: React.FC<AddJobModalProps> = ({ open, onClose, onJobAdded }) => {
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
    riderId: "",
    vehicleId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not authenticated.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.post(`${API_URL}/api/v1/jobs`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        riderId: "",
        vehicleId: "",
      });
    } catch (err: any) {
      console.error("Error adding job:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong while adding the job.");
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

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

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
          <Input name="riderId" placeholder="Rider ID" value={formData.riderId} onChange={handleChange} />

          <Input name="vehicleId" placeholder="Vehicle ID" value={formData.vehicleId} onChange={handleChange} />
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

export default NewJob;
