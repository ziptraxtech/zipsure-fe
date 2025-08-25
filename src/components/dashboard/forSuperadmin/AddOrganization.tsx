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
import AddUserDialog from "./AddUserModel"; // ✅ user modal
import { useToast } from "@/components/ui/use-toast";

interface AddOrganizationDialogProps {
  onAdded?: () => void;
}

const AddOrganizationDialog: React.FC<AddOrganizationDialogProps> = ({
  onAdded,
}) => {
  const { toast } = useToast();

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
  };

  const handleSubmitOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:3000/api/v1/organizations", {
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
        localStorage.setItem("organizationId", orgId);
        setOrganizationId(orgId);

        toast({
          title: "Organization created successfully",
          duration: 5000,
          className: "bg-green-500 text-white",
        });

        handleClear();
        setIsUserModalOpen(true);
        onAdded?.();
      } else if (res.status === 400 && json.errors) {
        Object.keys(json.errors).forEach((field) => {
          toast({
            title: `Enter correct data in field: ${field}`,
            duration: 5000,
            className: "bg-red-500 text-white",
          });
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
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="flex items-center gap-1 h-8 px-3 text-xs">
            <Plus className="h-6 w-6 mr-1" />
            Add Organization
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
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label className="mb-4 block">Email</Label>
                <Input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label className="mb-4 block">GST Number</Label>
                <Input
                  required
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="bg-gray-100"
                />
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
      />
    </>
  );
};

export default AddOrganizationDialog;
