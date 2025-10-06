import React, { useState, useEffect, useRef } from "react";
import axios, { AxiosError } from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2} from "lucide-react";
import { DownloadCSV } from "./downloadcsv";
import { EditModal } from "../forAdmin/user-section/editModal"; 
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
  organizationId: string;
  phone: string;
  role: string;
  isActive: boolean;
}

interface Organization {
  id: string;
  name: string;
}

const AddUserSuperAdmin: React.FC = () => {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    organizationId: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  // server-side pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteUser, setDeleteUser] = useState<{ id: string; name: string } | null>(null);
  const [editUser, setEditUser] = useState<SuperAdminUser | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const validateField = (name: string, value: string, currentRole?: string) => {
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

    if (name === "organizationId") {
      const roleToCheck = currentRole || newUser.role;
      if (roleToCheck !== "superadmin" && (!value || value.trim() === "")) {
        error = "Organization is required for this role";
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
    
      if (value === "superadmin") {
      setNewUser(prev => ({ ...prev, role: value, organizationId: "" }));
      setErrors(prev => ({ ...prev, organizationId: "" }));
    }
    
    validateField("organizationId", newUser.organizationId, value);
  };

  const handleOrganizationChange = (value: string) => {
    setNewUser({ ...newUser, organizationId: value });
    validateField("organizationId", value, newUser.role);
  };

  const resetForm = () => {
    setNewUser({
      firstName: "",
      lastName: "",
      organizationId: "",
      email: "",
      password: "",
      phone: "",
      role: "admin",
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const baseRequiredFields = ['firstName', 'lastName', 'email', 'password', 'phone'];
    const fieldsToValidate = newUser.role === 'superadmin' 
      ? baseRequiredFields 
      : [...baseRequiredFields, 'organizationId'];
    
    let hasErrors = false;

    fieldsToValidate.forEach((field) => {
      const value = newUser[field as keyof typeof newUser];
      if (!value || value.trim() === "") {
        const fieldName = field === 'organizationId' ? 'Organization' : field.charAt(0).toUpperCase() + field.slice(1);
        setErrors(prev => ({ ...prev, [field]: `${fieldName} is required` }));
        hasErrors = true;
      } else {
        validateField(field, value, newUser.role);
      }
    });

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    if (Object.values(errors).some((err) => err)) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      setIsSubmitting(false);
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
        setIsSubmitting(false);
        return;
      }

      const requestPayload = {
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
        ...(newUser.role !== "superadmin" && { organizationId: newUser.organizationId })
      };

      const res = await axios.post(
        `${API_URL}/api/v1/auth/register`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Success",
        duration: 5000,
        description: "User created successfully!",
        className: "bg-green-500 text-white",
      });

      await fetchUsers();

      setIsAddUserOpen(false);
      resetForm();
      
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const axiosErr = error as AxiosError<{ message?: string; details?: Array<{ field?: string; message?: string }> }>;
      const status = axiosErr.response?.status;

      if (status === 500) {
        toast({
          title: "Server Error",
          description: "Something went wrong on the server.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      } else if (status === 400) {
        const errorData = axiosErr.response?.data;
        let errorMessage = "Invalid input";

        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details
            .map((d: { field?: string; message?: string }) => `${d.field || 'Field'}: ${d.message || 'Invalid value'}`)
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
      } else if (status === 409) {
        toast({
          title: "Conflict Error",
          description: "User with this email already exists.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create user. Please try again.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit },
      });

      if (mountedRef.current) {
        const data = res.data;
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.users)
            ? data.users
            : [];
        if (Array.isArray(list)) {
          setUsers(list);
          setLastRefreshed(new Date());
        }
        if (data?.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalCount(data.pagination.total || list.length || 0);
        } else {
          setTotalPages(1);
          setTotalCount(list.length || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      if (mountedRef.current && !isAutoRefresh) {
        toast({
          title: "Error",
          description: "Failed to fetch users.",
          className: "bg-red-500 text-white",
          duration: 5000,
        });
      }
    } finally {
      if (mountedRef.current) {
        if (isAutoRefresh) {
          setIsRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/v1/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data.data)) {
        setOrganizations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
      toast({
        title: "Error",
        description: "Failed to fetch organizations.",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
    }
  };

  const handleAddUserClick = async () => {
    await fetchOrganizations();
    setIsAddUserOpen(true);
  };

  const handleManualRefresh = () => {
    fetchUsers(false);
  };

  const startAutoRefresh = () => {
    stopAutoRefresh(); 
    refreshIntervalRef.current = setInterval(() => {
      fetchUsers(true);
    }, 30000); 
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const onEdit = (user: SuperAdminUser) => {
    setEditUser(user);
  };

  const onAskDelete = (user: SuperAdminUser) => {
    setDeleteUser({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;

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

      await axios.delete(`${API_URL}/api/v1/users/${deleteUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(prev => prev.filter(user => user.id !== deleteUser.id));
      
      toast({
        title: "Success",
        description: "User deleted successfully!",
        className: "bg-green-500 text-white",
        duration: 5000,
      });

      setDeleteUser(null);
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
    }
  };

  const getOrganizationName = (orgId: string) => {
    const organization = organizations.find(org => org.id === orgId);
    return organization?.name || orgId || "—";
  };

  const formatLastRefreshed = () => {
    if (!lastRefreshed) return "";
    return lastRefreshed.toLocaleTimeString();
  };

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
    startAutoRefresh();

    return () => {
      mountedRef.current = false;
      stopAutoRefresh();
    };
  }, []);

  // refetch when page changes
  useEffect(() => {
    fetchUsers();
  }, [page]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRefresh();
      } else {
        startAutoRefresh();
        fetchUsers(true); 
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const startIndex = (page - 1) * limit;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <DownloadCSV 
                endpoint="users"
                disabled={isDownloading || users.length === 0}
                onDownloadStart={() => setIsDownloading(true)}
                onDownloadComplete={() => setIsDownloading(false)}
              />
              {/* handleAddUserClick function */}
              <Button size="sm" onClick={handleAddUserClick}>
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
                <TableHead>Organization</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <TableRow key={user.id} className="hover:bg-muted/40">
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[180px] md:max-w-none">
                      {(user.firstName || "—") +
                        " " +
                        (user.lastName || "—")}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">
                      {getOrganizationName(user.organizationId)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">
                      {user.email || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">
                      {user.phone || "—"}
                    </TableCell>
                    <TableCell className="capitalize whitespace-normal break-words">
                      {user.role === "allocator" ? "Fleet Manager" : (user.role || "—")}
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
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                        Edit
                      </Button>
                      <Button color="primary" size="sm" onClick={() => onAskDelete(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-4 text-center text-muted-foreground"
                  >
                    {loading ? "Loading users..." : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Footer Pagination (optional) */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button size="sm" color="primary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
              <span className="px-2 py-1 text-sm font-medium">{page} / {totalPages}</span>
              <Button size="sm" color="primary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-2xl">
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
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
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
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
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
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <Label className="mb-4 block">Password   *</Label>
              <Input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.password ? "border-red-500" : ""}`}
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label className="mb-4 block">Phone</Label>
              <Input
                name="phone"
                value={newUser.phone}
                onChange={handleInputChange}
                className={`bg-gray-100 ${errors.phone ? "border-red-500" : ""}`}
                maxLength={10}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label className="mb-4 block">
                Organization {newUser.role !== "superadmin" && "*"}
              </Label>
              <Select 
                value={newUser.organizationId} 
                onValueChange={handleOrganizationChange}
                disabled={newUser.role === "superadmin"}
              >
                <SelectTrigger className={`bg-gray-100 ${errors.organizationId ? "border-red-500" : ""} ${newUser.role === "superadmin" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder={
                    newUser.role === "superadmin" 
                      ? "Not required for Super Admin" 
                      : "Select Organization"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organizationId && (
                <p className="text-red-500 text-sm mt-1">{errors.organizationId}</p>
              )}
              {newUser.role === "superadmin" && (
                <p className="text-gray-500 text-sm mt-1">Super Admins are not tied to specific organizations</p>
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
                  <SelectItem value="allocator">Fleet Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddUserOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <EditModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Do you really want to delete <span className="font-semibold">{deleteUser?.name}</span>?</p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddUserSuperAdmin;