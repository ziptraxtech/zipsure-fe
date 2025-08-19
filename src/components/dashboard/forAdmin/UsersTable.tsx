import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Eye, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
}

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  onRefresh?: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users = [], loading = false, onRefresh }) => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
  });

  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setNewUser({ ...newUser, role: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication error",
          description: "You are not authenticated.",
          variant: "destructive", // 🔴 red
        });
        return;
      }

      await axios.post(
        "http://localhost:3000/api/v1/users",
        {
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          role: newUser.role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Success",
        description: "User created successfully!",
        variant: "default", // 🟢 green
        className: "bg-green-500 text-white",
      });

      setIsAddUserOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        role: "admin",
      });

      if (onRefresh) {
        await onRefresh();
        setCurrentPage(Math.ceil((users.length + 1) / usersPerPage));
      }
    } catch (error: any) {
      console.error(error);
      const status = error.response?.status;

      if (status === 500) {
        toast({
          title: "Error",
          description: "Something went wrong.",
          variant: "destructive", // 🔴 red
          className: "bg-red-500 text-white",
        });
      } else if (status === 400) {
        toast({
          title: "Error",
          description: "Wrong input.",
          variant: "destructive", // 🔴 red
          className: "bg-red-500 text-white",
            });
      } else {
        toast({
          title: "Error",
          description: "User not created.",
          variant: "destructive", // 🔴 red
          className: "bg-red-500 text-white",
        });
      }
    }
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  return (
    <>
      <Card className="shadow-md border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Users
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add User
              </Button>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <Eye className="h-4 w-4 mr-2" />
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left">S.No</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Phone Number</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Active Status</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-2">{startIndex + index + 1}</td>
                      <td className="p-2">{user.firstName || "—"} {user.lastName || "—"}</td>
                      <td className="p-2">{user.email || "—"}</td>
                      <td className="p-2">{user.phone || "—"}</td>
                      <td className="p-2">{user.role || "—"}</td>
                      <td className="p-2">{user.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-muted-foreground">
                      {loading ? "Loading users..." : "No users found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination buttons */}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <span className="px-2 py-1">{currentPage} / {totalPages}</span>
              <Button
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            <Input
              name="firstName"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={handleInputChange}
            />
            <Input
              name="lastName"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={handleInputChange}
            />

            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={handleInputChange}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={handleInputChange}
            />

            <Input
              name="phone"
              placeholder="Phone"
              value={newUser.phone}
              onChange={handleInputChange}
            />
            <Select value={newUser.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Role - Admin</SelectItem>
                <SelectItem value="rider">Role - Rider</SelectItem>
                <SelectItem value="allocator">Role - Allocator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button onClick={handleSubmit}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersTable;
