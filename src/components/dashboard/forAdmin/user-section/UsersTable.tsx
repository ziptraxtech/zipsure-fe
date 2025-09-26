import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Eye, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DownloadCSV } from "../../forSuperadmin/downloadcsv";
import { EditModal } from "./editModal";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  onRefresh?: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users = [],
  loading = false,
  onRefresh,
}) => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Separate state for delete confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(localUsers.length / usersPerPage);

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = "Email is required";
      else if (!emailRegex.test(value)) error = "Invalid email format";
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
    if (name === "phone") {
      const phoneRegex = /^[0-9]{10}$/;
      if (value && !phoneRegex.test(value)) error = "Invalid phone number";
    }
    if (name === "firstName" && !value) {
      error = "First name is required";
    }
    if (name === "lastName" && !value) {
      error = "Last name is required";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear any existing error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
    validateField(name, value);
  };

  const handleRoleChange = (value: string) => {
    setNewUser({ ...newUser, role: value });
    // Clear role error if any
    if (errors.role) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.role;
        return newErrors;
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  // Simple delete handler - just opens confirmation dialog
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Actual delete function
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const API_URL = import.meta.env.VITE_API_URL;
      await axios.delete(`${API_URL}/api/v1/users/${userToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Success",
        description: "User deleted successfully!",
        className: "bg-green-500 text-white",
      });

      // Update local state
      setLocalUsers(localUsers.filter(user => user.id !== userToDelete.id));
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh if callback provided
      if (onRefresh) onRefresh();
      
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        className: "bg-red-500 text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserUpdated = (updatedUser: User) => {
    setLocalUsers(localUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    if (onRefresh) onRefresh();
  };

  const handleUserDeleted = (deletedUserId: string) => {
    setLocalUsers(localUsers.filter(user => user.id !== deletedUserId));
    if (onRefresh) onRefresh();
  };

  const handleSubmit = async () => {
    await handleCreateUser();
  };

  const handleCreateUser = async () => {
    Object.entries(newUser).forEach(([key, value]) => validateField(key, value));
    const hasErrors = Object.values(errors).some((err) => err);
    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before submitting.",
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

      const API_URL = import.meta.env.VITE_API_URL;

      setIsSubmitting(true);
      try {
        const res = await axios.post(
          `${API_URL}/api/v1/users`,
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

        const createdUser: User = res.data.data || {
          ...newUser,
          id: Date.now().toString(),
          isActive: true,
        };

        setLocalUsers((prev) => [...prev, createdUser]);

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
        setErrors({});

        if (onRefresh) {
          onRefresh();
        }
        setCurrentPage(Math.ceil((localUsers.length + 1) / usersPerPage));
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: unknown) {
      console.error(error);
      type ApiErrorData = { message?: string; details?: Array<{ field?: string; message?: string }> };
      const axiosErr = error as AxiosError<ApiErrorData>;
      const status = axiosErr.response?.status;
      if (status === 500) {
        toast({
          title: "Error",
          description: "Something went wrong.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      } else if (status === 400) {
        const errorData = axiosErr.response?.data;
        let errorMessage = "Invalid input";
        if (errorData?.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details
            .map((d) => `${d.field || 'Field'}: ${d.message || 'Invalid value'}`)
            .join("\n");
        } else if (errorData?.message) {
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

  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = localUsers.slice(startIndex, endIndex);


  return (
    <>
      <Card className="shadow-md border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Users
            </CardTitle>
            <div className="flex gap-2">
              <DownloadCSV 
                endpoint="users" 
                onDownloadStart={() => {}}
                onDownloadComplete={() => {}}
              />
              <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              )}
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <TableRow key={user.id} className="hover:bg-muted/40">
                    <TableCell className="hidden md:table-cell">{startIndex + index + 1}</TableCell>
                    <TableCell>{(user.firstName || "—") + " " + (user.lastName || "—")}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone || "—"}</TableCell>
                    <TableCell className="capitalize">{user.role === "allocator" ? "Fleet Manager" : (user.role || "—")}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          user.isActive ? "text-green-500 border-green-500" : "text-red-500 border-red-500"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 px-3 mr-2"
                      >
                        Edit
                      </Button>        
                      <Button color="primary" 
                      size="default" 
                      className="px-3 py-1.5" 
                      onClick={() => handleDeleteClick(user)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-4 text-center text-muted-foreground">
                    {loading ? "Loading users..." : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
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

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div>
              <Label className="mb-4 block">First Name</Label>
              <Input
                name="firstName"
                value={newUser.firstName}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.firstName ? "border-red-500" : ""}`}
                required
              />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>
            <div>
              <Label className="mb-4 block">Last Name</Label>
              <Input
                name="lastName"
                value={newUser.lastName}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.lastName ? "border-red-500" : ""}`}
                required
              />
              {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
            </div>

            <div>
              <Label className="mb-4 block">Email</Label>
              <Input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.email ? "border-red-500" : ""}`}
                required
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            <div>
              <Label className="mb-4 block">Password</Label>
              <Input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.password ? "border-red-500" : ""}`}
                required
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            <div>
              <Label className="mb-4 block">Phone</Label>
              <Input
                name="phone"
                value={newUser.phone}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>
            <div>
              <Label className="mb-4 block">Role</Label>
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="allocator">Fleet Manager</SelectItem>
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
                  role: "admin",
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

      {/* Edit User Modal*/}
      <EditModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/*Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete user <span className="font-semibold">{userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}</span>?</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersTable;