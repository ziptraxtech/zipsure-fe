import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddUserDialog from "./AddUserModel"; // ✅ import user modal
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

  // ✅ Clear button handler
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
        localStorage.setItem("organizationId", orgId); // ✅ store locally
        setOrganizationId(orgId);

        toast({
          title: "Organization created successfully",
          duration: 5000,
          className: "bg-green-500 text-white",
        });

        handleClear(); // reset after success

        // 👉 open user modal after org creation
        setIsUserModalOpen(true);
        onAdded?.();
      } else if (res.status === 400 && json.errors) {
        // ✅ show field-specific errors
        Object.keys(json.errors).forEach((field) => {
          toast({
            title: `Enter correct data in field: ${field}`,
            duration: 5000,
            className: "bg-red-500 text-white",
          });
        });
      } else if (res.status === 500) {
        toast({
          title: "Something went wrong",
          duration: 5000,
          className: "bg-red-500 text-white",
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
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitOrg} className="grid grid-cols-2 gap-4 mt-2">
            <input required name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="gstNumber" placeholder="GST Number" value={formData.gstNumber} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="state" placeholder="State" value={formData.state} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="w-full border p-2 rounded" />
            <input required name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded" />

            <div className="col-span-2 flex justify-between mt-2">
              <Button type="button" onClick={handleClear} variant="secondary">
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Second Modal - User (separate component) */}
      <AddUserDialog
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        organizationId={organizationId}
      />
    </>
  );
};

export default AddOrganizationDialog;
