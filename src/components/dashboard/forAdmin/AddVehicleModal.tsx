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

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onVehicleAdded: () => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ open, onClose, onVehicleAdded }) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "Bike", // Default to Bike
    model: "",
    make: "",
    year: "",
    color: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You are not authenticated.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Year validation
    const currentYear = new Date().getFullYear();
    const enteredYear = Number(formData.year);

    if (enteredYear < 1980 || enteredYear > currentYear) {
      toast({
        title: "Invalid Year",
        description: `Year should be between 1980 and ${currentYear}`,
        variant: "destructive",
        className: "bg-red-500 text-white",
      });
      return;
    }

    try {
      setLoading(true);

      // Ensure vehicleType first letter is capitalized
      const capitalizedType =
        formData.vehicleType.charAt(0).toUpperCase() + formData.vehicleType.slice(1).toLowerCase();

      const payload = { ...formData, vehicleType: capitalizedType, year: enteredYear };

      await axios.post("http://localhost:3000/api/v1/vehicles", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onVehicleAdded();
      onClose();
      setFormData({
        vehicleNumber: "",
        vehicleType: "Bike", // reset to default
        model: "",
        make: "",
        year: "",
        color: "",
      });

      // ✅ Success toast
      toast({
        title: "Success",
        description: "Vehicle added successfully.",
        className: "bg-green-500 text-white",
      });

    } catch (err: any) {
      console.error("Error adding vehicle:", err);

      if (err.response) {
        if (err.response.status === 500) {
          // ✅ 500 error
          toast({
            title: "Server Error",
            description: "Something went wrong. Please try again later.",
            variant: "destructive",
            className: "bg-red-500 text-white",
          });
        } else if (err.response.status === 400) {
          // ✅ Validation error from backend
          toast({
            title: "Invalid Input",
            description: `Wrong Input. ${err.response.data.message || ""}`,
            variant: "destructive",
            className: "bg-red-500 text-white",
          });
        } else {
          // Other API errors
          toast({
            title: "Error",
            description: err.response.data.message || "An error occurred.",
            variant: "destructive",
            className: "bg-red-500 text-white",
          });
        }
      } else {
        // No response from server
        toast({
          title: "Network Error",
          description: "Unable to connect to the server.",
          variant: "destructive",
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
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>

        {/* Two per row grid layout */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="vehicleNumber"
            placeholder="Vehicle Number"
            value={formData.vehicleNumber}
            onChange={handleChange}
          />

          {/* Fixed dropdown for vehicleType */}
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="Bike">Type - Bike</option>
            <option value="Car">Type - Car</option>
            <option value="Truck">Type - Truck</option>
            <option value="Van">Type - Van</option>
            <option value="Auto">Type - Auto</option>
          </select>

          <Input name="model" placeholder="Model" value={formData.model} onChange={handleChange} />
          <Input name="make" placeholder="Make" value={formData.make} onChange={handleChange} />
          <Input name="year" type="number" placeholder="Year" value={formData.year} onChange={handleChange} />
          <Input name="color" placeholder="Color" value={formData.color} onChange={handleChange} />
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleModal;
