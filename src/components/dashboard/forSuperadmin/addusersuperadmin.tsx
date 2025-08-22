import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react"; // ✅ Removed Eye since no refresh button
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

// Super Admin User type
export interface SuperAdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
}

const AddUserSuperAdmin: React.FC = () => {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(false);

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
          variant: "destructive",
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

      // Refresh users list (Super Admin version)
      fetchUsers();
      setCurrentPage(Math.ceil((users.length + 1) / usersPerPage));
    } catch (error: any) {
      console.error(error);
      const status = error.response?.status;

      if (status === 500) {
        toast({
          title: "Error",
          description: "Something went wrong.",
          className: "bg-red-500 text-white",
        });
      } else if (status === 400) {
        toast({
          title: "Error",
          description: "Wrong input.",
          className: "bg-red-500 text-white",
        });
      } else {
        toast({
          title: "Error",
          description: "User not created.",
          className: "bg-red-500 text-white",
        });
      }
    }
  };

  // Fetch users for Super Admin
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://localhost:3000/api/v1/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  // Pagination logic
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Card className="shadow-md border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Super Admin - Users
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add User
              </Button>
              {/* ✅ Refresh button removed */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">S.No</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone Number</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Active Status</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-muted/40"
                    >
                      <td className="p-3">{startIndex + index + 1}</td>
                      <td className="p-3">
                        {user.firstName || "—"} {user.lastName || "—"}
                      </td>
                      <td className="p-3">{user.email || "—"}</td>
                      <td className="p-3">{user.phone || "—"}</td>
                      <td className="p-3 capitalize">{user.role || "—"}</td>
                      <td className="p-3">
                        {user.active ? (
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      {loading ? "Loading users..." : "No users found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <span className="px-2 py-1 text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New User (Super Admin)</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label className="mb-4 block">First Name</Label>
              <Input
                name="firstName"
                value={newUser.firstName}
                onChange={handleInputChange}
                className="bg-gray-100"
                required
              />
            </div>
            <div>
              <Label className="mb-4 block">Last Name</Label>
              <Input
                name="lastName"
                value={newUser.lastName}
                onChange={handleInputChange}
                className="bg-gray-100"
                required
              />
            </div>

            <div>
              <Label className="mb-4 block">Email</Label>
              <Input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                className="bg-gray-100"
                required
              />
            </div>
            <div>
              <Label className="mb-4 block">Password</Label>
              <Input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                className="bg-gray-100"
                required
              />
            </div>

            <div>
              <Label className="mb-4 block">Phone</Label>
              <Input
                name="phone"
                value={newUser.phone}
                onChange={handleInputChange}
                className="bg-gray-100"
              />
            </div>
            <div>
              <Label className="mb-4 block">Role</Label>
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="allocator">Allocator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setNewUser({
                  firstName: "",
                  lastName: "",
                  email: "",
                  password: "",
                  phone: "",
                  role: "superadmin",
                })
              }
            >
              Clear
            </Button>
            <Button onClick={handleSubmit}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddUserSuperAdmin;
