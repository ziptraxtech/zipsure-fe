import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleCategoryId: string;
  model: string;
  make: string;
  year: number;
  color: string;
  status: string;
  createdAt: string;
}

interface VehicleCategory {
  id: string;
  name: string;
  createdAt: string;
}

const AddVehicleCategory = () => {
  const [formData, setFormData] = useState({
    vehicleCategory: "",
  });
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deleteCategory, setDeleteCategory] = useState<VehicleCategory | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const token = useMemo(() => localStorage.getItem("token"), []);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchCategories();
    fetchVehicles();

    const intervalId = setInterval(() => {
        fetchVehicles();
      }, 20000);
      return () => clearInterval(intervalId);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/vehicle-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.data || response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch vehicle categories",
        variant: "destructive",
        duration: 5000,
        className: "bg-red-500 text-white",
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data.data || response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch vehicles",
        variant: "destructive",
        duration: 5000,
        className: "bg-red-500 text-white",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setTouched({ ...touched, [name]: true });
    
    if (value.trim()) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.vehicleCategory.trim()) {
      newErrors.vehicleCategory = "Vehicle category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/v1/vehicle-categories`, {
        name: formData.vehicleCategory,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast({
        title: "Success",
        description: "Vehicle category added successfully",
        duration: 5000,
        className: "bg-green-500 text-white",
      });
      
      setFormData({ vehicleCategory: "" });
      setTouched({});
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add vehicle category",
        variant: "destructive",
        duration: 5000,
        className: "bg-red-500 text-white",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    try {
      const url = `${API_URL}/api/v1/vehicle-categories/${deleteCategory.id}`;
      console.log('Deleting category at:', url);
      
      await axios.delete(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Category deleted successfully');
      
      toast({ 
        title: "Success",
        description: "Category deleted successfully!",
        className: "bg-green-500 text-white",
        duration: 5000 
      });
      
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category", err);
      const errorMessage = err.response?.data?.message || "Failed to delete category. Please try again.";
      toast({ 
        title: "Error",
        description: errorMessage,
        className: "bg-red-500 text-white",
        duration: 5000 
      });
    } finally {
      setDeleteCategory(null);
    }
    
  };
  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '—';
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206,122,122,0.15)_0%,rgba(255,255,255,0)_70%] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vehicles</h1>
        </div>

        {/* Top Section - Two Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Card - Add Vehicle Category Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Vehicle Category</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleCategory">Vehicle Category</Label>
                  <Input
                    id="vehicleCategory"
                    name="vehicleCategory"
                    value={formData.vehicleCategory}
                    onChange={handleInputChange}
                    placeholder="Enter vehicle category"
                    className={errors.vehicleCategory && touched.vehicleCategory ? "border-red-500" : ""}
                  />
                  {errors.vehicleCategory && touched.vehicleCategory && (
                    <p className="text-sm text-red-500">{errors.vehicleCategory}</p>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Adding..." : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Card - List of Vehicle Categories */}
          <Card className="flex flex-col h-[400px]">
            <CardHeader>
              <CardTitle>Vehicle Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 h-full overflow-y-auto pr-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No categories found</p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteCategory(category)}
                            >
                            <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Vehicles Table */}
        <Card className="shadow-md border rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="text-xs md:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Make</TableHead>
                    <TableHead className="hidden md:table-cell">Model</TableHead>
                    <TableHead className="hidden md:table-cell">Year</TableHead>
                    <TableHead className="hidden md:table-cell">Color</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-muted/40">
                        <TableCell className="whitespace-normal break-words max-w-[200px] md:max-w-none">{vehicle.vehicleNumber}</TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[200px] md:max-w-none">{vehicle.vehicleType || "—"}</TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[200px] md:max-w-none">{getCategoryNameById(vehicle.vehicleCategoryId) || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell whitespace-normal break-words max-w-[200px] md:max-w-none">{vehicle.make || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell whitespace-normal break-words max-w-[200px] md:max-w-none">{vehicle.model || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell whitespace-normal break-words max-w-[200px] md:max-w-none">{vehicle.year || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell whitespace-normal break-words max-w-[200px] md:max-w-none">{vehicle.color || "—"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No vehicles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>


        {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Do you really want to delete{" "}
            <span className="font-bold">{deleteCategory?.name}</span> plan?
          </p>
          <DialogFooter className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteCategory(null)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default AddVehicleCategory;