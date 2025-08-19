import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
  organizationId,
}) => {
  const { toast } = useToast();

  const [userData, setUserData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "admin", // default role
  });

  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization ID not found.",
        className:
          "bg-red-500/90 text-white rounded-lg shadow-lg px-4 py-3",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const localId = localStorage.getItem("id");

      const res = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...userData,
          organizationId,
          localId,
        }),
      });

      // --- Handle server errors first ---
      if (res.status === 500) {
        toast({
          title: "Error",
          description: "Something went wrong",
          className:
            "bg-red-500/90 text-white rounded-lg shadow-lg px-4 py-3",
        });
        return;
      }

      if (res.status === 400) {
        const json = await res.json();
        const errorDetails = json?.details
          ?.map((d: any) => `${d.message}`)
          .join("\n");

        toast({
          title: json.error || "Validation Failed",
          description:
            errorDetails ||
            json.message ||
            "Please check your input data",
          className:
            "bg-red-500/90 text-white rounded-lg shadow-lg px-4 py-3 whitespace-pre-line",
        });
        return;
      }

      const json = await res.json();

      if (json.success) {
        toast({
          title: "Success",
          description: "User added successfully!",
          className:
            "bg-green-500/90 text-white rounded-lg shadow-lg px-4 py-3",
        });

        // ✅ Clear localStorage id after successful user creation
        localStorage.removeItem("id");

        setUserData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          role: "rider",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Invalid Input",
          description:
            json.message || "Enter correct data in this field",
          className:
            "bg-red-500/90 text-white rounded-lg shadow-lg px-4 py-3",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong",
        className:
          "bg-red-500/90 text-white rounded-lg shadow-lg px-4 py-3",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User for Organization</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitUser} className="grid gap-4 mt-2">
          <input
            required
            name="firstName"
            placeholder="First Name"
            value={userData.firstName}
            onChange={handleUserChange}
            className="w-full border p-2 rounded"
          />
          <input
            required
            name="lastName"
            placeholder="Last Name"
            value={userData.lastName}
            onChange={handleUserChange}
            className="w-full border p-2 rounded"
          />
          <input
            required
            type="email"
            name="email"
            placeholder="Email"
            value={userData.email}
            onChange={handleUserChange}
            className="w-full border p-2 rounded"
          />
          <input
            required
            type="password"
            name="password"
            placeholder="Password"
            value={userData.password}
            onChange={handleUserChange}
            className="w-full border p-2 rounded"
          />
          <input
            required
            type="tel"
            name="phone"
            placeholder="Phone"
            value={userData.phone}
            onChange={handleUserChange}
            className="w-full border p-2 rounded"
          />
          <select
            name="role"
            value={userData.role}
            onChange={handleUserChange}
            className="w-full border p-2 rounded"
          >
            <option value="admin">Admin</option>
            <option value="rider">Rider</option>
            <option value="allocator">Allocator</option>
          </select>

          <div className="flex justify-end mt-2">
            <Button type="submit">Save User</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
