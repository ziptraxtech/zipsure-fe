// AddOrginization.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import AddUserDialog from "./AddUserModel"; 
import { useToast } from "@/components/ui/use-toast";


const API_URL = import.meta.env.VITE_API_URL;

interface AddOrganizationDialogProps {
  onAdded?: () => void;
}

const AddOrganizationDialog: React.FC<AddOrganizationDialogProps> = ({ onAdded }) => {
  const { toast } = useToast();

  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    email: "",
    gstNumber: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const validateField = (name: string, value: string) => {
    let error = "";

    if (name === "phone") {
      if (!/^\d{10}$/.test(value)) {
        error = "Phone number must be exactly 10 digits";
      }
    }

    if (name === "gstNumber") {
      if (!/^[A-Za-z0-9]{15}$/.test(value)) {
        error = "GST Number must be exactly 15characters (alphanumeric)";
      }
    }

    if (name === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email format";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value); 
  };

  const handleClear = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      phone: "",
      email: "",
      gstNumber: "",
    });
    setErrors({});
  };

  const handleSubmitOrg = async (e: React.FormEvent) => {
    e.preventDefault();

    Object.entries(formData).forEach(([key, value]) => {
      validateField(key, value);
    });

    if (Object.values(errors).some((err) => err)) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/v1/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const orgId = json.data.id;
        setOrganizationId(orgId);

        setIsOrgDialogOpen(false);

        setTimeout(() => {
          setIsUserModalOpen(true);
        }, 0);

        toast({
          title: "Organization created successfully",
          duration: 2000,
          className: "bg-green-500 text-white",
        });

        handleClear();
        setTimeout(() => {
          setIsUserModalOpen(true);
        }, 0);

        toast({
          title: "Organization created successfully",
          duration: 2000,
          className: "bg-green-500 text-white",
        });

        handleClear();

        onAdded?.();
      } else if (res.status === 400) {
        const errorData = json;
        let errorMessage = "";

        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage += errorData.details
            .map(
              (d: { field?: string; message?: string }) =>
                `• ${d.field || "Field"}: ${d.message || "Invalid value"}`
            )
            .join("\n");
        } else if (errorData.message) {
          errorMessage += errorData.message;
        } else if (typeof errorData === "string") {
          errorMessage += errorData;
        }

        toast({
          title: "Input Error",
          description: errorMessage,
          className: "bg-red-500 text-white whitespace-pre-line text-left",
          duration: 7000,
        });
      } else {
        toast({
          title: json.message || "Failed to add organization",
          duration: 5000,
          className: "bg-red-500 text-white",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong",
        duration: 5000,
        className: "bg-red-500 text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* First Modal - Organization */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="flex items-center gap-1 h-8 px-3 text-xs"
            onClick={() => setIsOrgDialogOpen(true)}
          >
            <Plus className="h-6 w-6 mr-1" />
            Add
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitOrg}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label className="mb-4 block">Name</Label>
                <Input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label className="mb-4 block">Phone</Label>
                <Input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`bg-gray-100 ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label className="mb-4 block">Email</Label>
                <Input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-gray-100 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <div>
                <Label className="mb-4 block">GST Number</Label>
                <Input
                  required
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className={`bg-gray-100 ${errors.gstNumber ? "border-red-500" : ""}`}
                />
                {errors.gstNumber && (
                  <p className="text-red-500 text-sm">{errors.gstNumber}</p>
                )}
              </div>

              <div>
                <Label className="mb-4 block">City</Label>
                <Input
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label className="mb-4 block">State</Label>
                <Input
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label className="mb-4 block">Country</Label>
                <Input
                  required
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label className="mb-4 block">Address</Label>
                <Input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClear} variant="secondary">
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Second Modal - User */}
      <AddUserDialog
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        organizationId={organizationId}
        onUserCreated={() => {
          setIsUserModalOpen(false);
          onAdded?.();
        }}
      />
    </>
  );
};

export default AddOrganizationDialog;
