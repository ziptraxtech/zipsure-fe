import React, { useState, useEffect } from "react";
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

const AddJobModal: React.FC<AddJobModalProps> = ({ open, onClose, onJobAdded }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "", description: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupPin: "",
    deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryPin: "",
    pickupLongitude: "", pickupLatitude: "", deliveryLongitude: "", deliveryLatitude: "", scheduleTime: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  

  const isComplete = (type: 'pickup' | 'delivery') => {
    const prefix = type === 'pickup' ? 'pickup' : 'delivery';
    return formData[`${prefix}Address`]?.trim() && formData[`${prefix}City`]?.trim() && 
           formData[`${prefix}State`]?.trim() && formData[`${prefix}Pin`]?.trim();
  };


  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim()) newErrors.description = "Job description is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({ title: "Validation Error", description: "Please fix errors before submitting", className: "bg-red-500 text-white" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Not authenticated", className: "bg-red-500 text-white" });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/v1/jobs`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201 || response.status === 200) {
        toast({ title: "Success", description: "Job created successfully", className: "bg-green-500 text-white" });
        onJobAdded(response.data);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create job", className: "bg-red-500 text-white" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "", description: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupPin: "",
      deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryPin: "",
      pickupLongitude: "", pickupLatitude: "", deliveryLongitude: "", deliveryLatitude: "", scheduleTime: "",
    });
    setRouteCoordinates([]);
  };

  const renderAddressSection = (type: 'pickup' | 'delivery') => {
    const isPickup = type === 'pickup';
    const color = isPickup ? 'green' : 'red';
    const complete = isComplete(type);
    
    return (
      <div className="space-y-2">
        <Label className={`block text-${color}-600 font-semibold`}>
          {isPickup ? 'Pickup' : 'Delivery'} Details (Point {isPickup ? 'A' : 'B'})
          {complete && " ✓"}
        </Label>
        {['Address', 'City', 'State', 'Pin'].map(field => (
          <Input key={field}
            placeholder={`${field === 'Address' ? 'Home / Address / Building' : field}${field !== 'Address' ? '' : ''} *`}
            name={`${type}${field}`}
            value={formData[`${type}${field}`]}
          
            className={complete ? `border-${color}-500` : ""}
          />
        ))}
        <p className="text-xs text-gray-500">Fill all fields to see Point {isPickup ? 'A' : 'B'} on map</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-4xl">
        <DialogHeader><DialogTitle>Add New Job</DialogTitle></DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label className="mb-2 block">Job Title</Label>
            <Input name="title" value={formData.title} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Job Description</Label>
            <Input name="description" value={formData.description} />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          {renderAddressSection('pickup')}
          {renderAddressSection('delivery')}
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Schedule Date & Time</Label>
          <Input 
            type="datetime-local" 
            name="scheduleTime" 
            value={formData.scheduleTime} 
            
            className="w-1/1.5 cursor-pointer" 
            onClick={(e) => e.currentTarget.showPicker?.()}
          />
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={resetForm}>Clear All</Button>
          <Button onClick={handleSubmit} disabled={loading || geocodingLoading}>
            {loading ? "Adding..." : "Add Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;