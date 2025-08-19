import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import axios from "axios";

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void; // To refresh parent after adding user
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onOpenChange, onUserAdded }) => {
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "Admin",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setNewUser({ ...newUser, role: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token"); // Assuming auth token
      await axios.post(
        "/api/v1/users", // Your POST API endpoint
        newUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onUserAdded();
      onOpenChange(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        role: "Admin",
      });
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>First Name</Label>
            <Input name="firstName" value={newUser.firstName} onChange={handleInputChange} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input name="lastName" value={newUser.lastName} onChange={handleInputChange} />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" value={newUser.password} onChange={handleInputChange} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input name="phone" value={newUser.phone} onChange={handleInputChange} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={newUser.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Rider">Rider</SelectItem>
                <SelectItem value="Allocator">Allocator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Add User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
