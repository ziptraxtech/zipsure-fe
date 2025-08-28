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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onVehicleAdded: () => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  open,
  onClose,
  onVehicleAdded,
}) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "Bike",
    model: "",
    make: "",
    year: "",
    color: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVehicleTypeChange = (value: string) => {
    setFormData({ ...formData, vehicleType: value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You are not authenticated.",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const enteredYear = Number(formData.year);

    if (enteredYear < 1980 || enteredYear > currentYear) {
      toast({
        title: "Invalid Year",
        description: `Year should be between 1980 and ${currentYear}`,
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return;
    }

    try {
      setLoading(true);

      const capitalizedType =
        formData.vehicleType.charAt(0).toUpperCase() +
        formData.vehicleType.slice(1).toLowerCase();

      const payload = {
        ...formData,
        vehicleType: capitalizedType,
        year: enteredYear,
      };

      await axios.post("http://localhost:3000/api/v1/vehicles", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onVehicleAdded();
      onClose();
      setFormData({
        vehicleNumber: "",
        vehicleType: "Bike",
        model: "",
        make: "",
        year: "",
        color: "",
      });

      toast({
        title: "Success",
        description: "Vehicle added successfully.",
        className: "bg-green-500 text-white",
      });
    } catch (err: any) {
      console.error("Error adding vehicle:", err);

      if (err.response) {
        if (err.response.status === 500) {
          toast({
            title: "Server Error",
            description: "Something went wrong. Please try again later.",
            className: "bg-red-500 text-white",
            duration: 5000,
          });
        } else if (err.response?.status === 400) {
          const errorData = err.response.data;
          let errorMessage = "Invalid input";
          
          if (errorData.details && Array.isArray(errorData.details)) {
            errorMessage = errorData.details
              .map((d: any) => `${d.field || 'Field'}: ${d.message || 'Invalid value'}`)
              .join("\n");
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }

          toast({
            title: errorData.title || "Input Error",
            description: errorMessage,
            className: "bg-red-500 text-white whitespace-pre-line",
            duration: 5000,
          });
        } else {
          toast({
            title: "Error",
            description: err.response.data.message || "An error occurred.",
            className: "bg-red-500 text-white",
            duration: 5000,
          });
        }
      } else {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server.",
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
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label className="mb-4 block">Vehicle Number</Label>
            <Input
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Vehicle Type</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={handleVehicleTypeChange}
            >
              <SelectTrigger className="bg-gray-100">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bike">Bike</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-4 block">Model</Label>
            <Input
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Make</Label>
            <Input
              name="make"
              value={formData.make}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Year</Label>
            <Input
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label className="mb-4 block">Color</Label>
            <Input
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="bg-gray-100"
            />
          </div>
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
