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

const API_URL = import.meta.env.VITE_API_URL;

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onVehicleAdded: (vehicle: any) => void;
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = "";
    const currentYear = new Date().getFullYear();

    if (name === "vehicleNumber") {
      if (!value.trim()) {
        error = "Vehicle number is required";
      } else if (
        !/^[A-Za-z]{2}\s?[0-9]{1,2}\s?[A-Za-z]{0,3}\s?[0-9]{4}$/i.test(value)
      ) {
        error = "Enter a valid vehicle number (e.g., MH 12 AB 1234)";
      }
    } else if (name === "model") {
      if (!value.trim()) {
        error = "Model is required";
      }
    } else if (name === "make") {
      if (!value.trim()) {
        error = "Make is required";
      }
    } else if (name === "year") {
      if (!value) {
        error = "Year is required";
      } else if (
        isNaN(Number(value)) ||
        Number(value) < 1980 ||
        Number(value) > currentYear
      ) {
        error = `Year must be between 1980 and ${currentYear}`;
      }
    } else if (name === "color") {
      if (!value.trim()) {
        error = "Color is required";
      }
    }

    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleVehicleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, vehicleType: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      if (key !== "vehicleType") {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    const touchedFields = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(touchedFields);

    if (!validateForm()) {
      return;
    }

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

      const response = await axios.post(
        `${API_URL}/api/v1/vehicles`,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ pass the new vehicle back immediately
      onVehicleAdded(response.data.data);

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
              .map(
                (d: any) =>
                  `${d.field || "Field"}: ${d.message || "Invalid value"}`
              )
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
              onBlur={handleBlur}
              className={`bg-gray-100 ${
                touched.vehicleNumber && errors.vehicleNumber
                  ? "border-red-500"
                  : ""
              }`}
            />
            {touched.vehicleNumber && errors.vehicleNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.vehicleNumber}
              </p>
            )}
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
              onBlur={handleBlur}
              className={`bg-gray-100 ${
                touched.model && errors.model ? "border-red-500" : ""
              }`}
            />
            {touched.model && errors.model && (
              <p className="text-red-500 text-xs mt-1">{errors.model}</p>
            )}
          </div>

          <div>
            <Label className="mb-4 block">Make</Label>
            <Input
              name="make"
              value={formData.make}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`bg-gray-100 ${
                touched.make && errors.make ? "border-red-500" : ""
              }`}
            />
            {touched.make && errors.make && (
              <p className="text-red-500 text-xs mt-1">{errors.make}</p>
            )}
          </div>

          <div>
            <Label className="mb-4 block">Year</Label>
            <Input
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`bg-gray-100 ${
                touched.year && errors.year ? "border-red-500" : ""
              }`}
            />
            {touched.year && errors.year && (
              <p className="text-red-500 text-xs mt-1">{errors.year}</p>
            )}
          </div>

          <div>
            <Label className="mb-4 block">Color</Label>
            <Input
              name="color"
              value={formData.color}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`bg-gray-100 ${
                touched.color && errors.color ? "border-red-500" : ""
              }`}
            />
            {touched.color && errors.color && (
              <p className="text-red-500 text-xs mt-1">{errors.color}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button
                        variant="secondary"
                        onClick={() => {
                          setFormData({
                            vehicleNumber: "",
                            vehicleType: "Bike",
                            model: "",
                            make: "",
                            year: "",
                            color: "",
                          });
                          setErrors({});
                        }}
                      >
                        Clear
                      </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleModal;
