import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { DownloadCSV } from "./downloadcsv";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL;

export interface SuperAdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const [isDownloading, setIsDownloading] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = "";

    if (name === "phone") {
      if (!/^\d{10}$/.test(value)) {
        error = "Phone number must be exactly 10 digits";
      }
    }

    if (name === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email format";
      }
    }
    if (name === "password") {
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
    
      if (value.length < 8 || !hasUppercase || !hasLowercase || !hasNumber) {
        error =
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
    validateField(name, value);
  };

  const handleRoleChange = (value: string) => {
    setNewUser({ ...newUser, role: value });
  };

  const handleSubmit = async () => {
    Object.entries(newUser).forEach(([key, value]) => {
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

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication error",
          description: "You are not authenticated.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
        return;
      }

      const res = await axios.post(
        `${API_URL}/api/v1/auth/register`,
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

      const createdUser: SuperAdminUser = res.data.data; // take new user from response

      toast({
        title: "Success",
        duration: 5000,
        description: "User created successfully!",
        className: "bg-green-500 text-white",
      });

      setUsers((prev) => [...prev, createdUser]);
      await fetchUsers();

      setIsAddUserOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        role: "admin",
      });
      setErrors({});

      setCurrentPage(Math.ceil((users.length + 1) / usersPerPage));
    } catch (error: any) {
      console.error(error);
      const status = error.response?.status;

      if (status === 500) {
        toast({
          title: "Error",
          description: "Something went wrong.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      } else if (status === 400) {
        const errorData = error.response.data;
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
          description: "User not created.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/v1/users`, {
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

  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />Users
            </CardTitle>
            <div className="flex gap-2">
              <DownloadCSV 
                endpoint="users"
                disabled={isDownloading || users.length === 0}
                onDownloadStart={() => setIsDownloading(true)}
                onDownloadComplete={() => setIsDownloading(false)}
              />
              <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="text-xs md:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <TableRow key={user.id} className="hover:bg-muted/40">
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[180px] md:max-w-none">
                      {(user.firstName || "—") +
                        " " +
                        (user.lastName || "—")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">
                      {user.email || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">
                      {user.phone || "—"}
                    </TableCell>
                    <TableCell className="capitalize whitespace-normal break-words">
                      {user.role || "—"}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge
                          variant="outline"
                          className="text-success border-success"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-destructive border-destructive"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-4 text-center text-muted-foreground"
                  >
                    {loading ? "Loading users..." : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New User (Super Admin)</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
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
                className={`bg-gray-100 ${
                  errors.email ? "border-red-500" : ""
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div>
              <Label className="mb-4 block">Password</Label>
              <Input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                className={`bg-gray-100 ${
                  errors.password ? "border-red-500" : ""
                }`}
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>

            <div>
              <Label className="mb-4 block">Phone</Label>
              <Input
                name="phone"
                value={newUser.phone}
                onChange={handleInputChange}
                className={`bg-gray-100 ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
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
              onClick={() => {
                setNewUser({
                  firstName: "",
                  lastName: "",
                  email: "",
                  password: "",
                  phone: "",
                  role: "superAdmin",
                });
                setErrors({});
              }}
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
