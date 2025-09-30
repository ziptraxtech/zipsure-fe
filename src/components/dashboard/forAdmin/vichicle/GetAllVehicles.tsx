import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL;

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  model: string;
  make: string;
  year: number;
  color: string;
  status: string;
  createdAt: string;
  vehicleCategoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const GetAllVehicles: React.FC<Props> = ({ open, onClose }) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    vehicleNumber: "",
    vehicleType: "",
    model: "",
    make: "",
    year: "",
    color: "",
    status: "Active",
    vehicleCategoryId: "",
  });

  const fetchVehicles = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    axios
      .get(`${API_URL}/api/v1/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setVehicles(res.data.data);
        }
      })
      .catch((err) => console.error("Error fetching vehicles:", err))
      .finally(() => setLoading(false));
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/v1/vehicle-categories`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  const getCategoryNameById = (id: string) => {
    const category = categories.find((c) => c.id === id);
    return category?.name || "-";
  };

  useEffect(() => {
    if (!open) return;

    fetchVehicles();
    fetchCategories();
  }, [open]);

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      vehicleNumber: v.vehicleNumber || "",
      vehicleType: v.vehicleType || "",
      model: v.model || "",
      make: v.make || "",
      year: String(v.year ?? ""),
      color: v.color || "",
      status: v.status || "Active",
      vehicleCategoryId: v.vehicleCategoryId || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Auth error",
        description: "Not authenticated",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return;
    }
    try {
      const payload = {
        vehicleNumber: form.vehicleNumber.trim(),
        vehicleType: form.vehicleType.trim(),
        model: form.model.trim(),
        make: form.make.trim(),
        year: Number(form.year),
        color: form.color.trim(),
        status: form.status,
        vehicleCategoryId: form.vehicleCategoryId,
      };
      await axios.put(`${API_URL}/api/v1/vehicles/${editing.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Updated",
        description: "Vehicle updated successfully",
        className: "bg-green-500 text-white",
        duration: 5000,
      });
      setEditing(null);
      fetchVehicles();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to update vehicle";
      toast({
        title: "Error",
        description: message,
        className: "bg-red-500 text-white",
        duration: 5000,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Auth error",
        description: "Not authenticated",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/v1/vehicles/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "Deleted",
        description: "Vehicle deleted successfully",
        className: "bg-green-500 text-white",
        duration: 5000,
      });
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to delete vehicle";
      toast({
        title: "Error",
        description: message,
        className: "bg-red-500 text-white",
        duration: 5000,
      });
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-11/12 max-w-4xl p-6 relative">
          <h2 className="text-xl font-bold mb-4">All Vehicles</h2>
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>

          {loading ? (
            <p>Loading vehicles...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b bg-primary">
                    <th className="px-4 py-2 ">Vehicle Number</th>
                    <th className="px-4 py-2 ">Type</th>
                    <th className="px-4 py-2 ">Category</th>
                    <th className="px-4 py-2 ">Model</th>
                    <th className="px-4 py-2 ">Year</th>
                    <th className="px-4 py-2 ">Color</th>
                    <th className="px-4 py-2 ">Status</th>
                    <th className="px-4 py-2 ">Created At</th>
                    <th className="px-4 py-2 ">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="text-center border-b">
                      <td className="px-4 py-2 ">{v.vehicleNumber}</td>
                      <td className="px-4 py-2 ">{v.vehicleType}</td>
                      <td className="px-4 py-2 ">
                        {getCategoryNameById(v.vehicleCategoryId)}
                      </td>
                      <td className="px-4 py-2 ">{v.model}</td>
                      <td className="px-4 py-2 ">{v.year}</td>
                      <td className="px-4 py-2 ">{v.color}</td>
                      <td className="px-4 py-2 ">{v.status}</td>
                      <td className="px-4 py-2 ">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 ">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(v)}
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => setDeleteTarget(v)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div>
              <Label className="mb-4 block">Vehicle Number</Label>
              <Input
                value={form.vehicleNumber}
                className="bg-gray-100"
                onChange={(e) =>
                  setForm({ ...form, vehicleNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-4 block">Type</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(v) => setForm({ ...form, vehicleType: v })}
              >
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bike">Bike</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-4 block">Model</Label>
              <Input
                value={form.model}
                className="bg-gray-100"
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-4 block">Make</Label>
              <Input
                value={form.make}
                className="bg-gray-100"
                onChange={(e) => setForm({ ...form, make: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-4 block">Year</Label>
              <Input
                type="number"
                value={form.year}
                className="bg-gray-100"
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-4 block">Color</Label>
              <Input
                value={form.color}
                className="bg-gray-100"
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="mb-4 block">Category</Label>
            <Select
              value={form.vehicleCategoryId}
              onValueChange={(v) =>
                setForm({ ...form, vehicleCategoryId: v })
              }
            >
              <SelectTrigger className="bg-gray-100">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Do you really want to delete vehicle{" "}
            <span className="font-semibold">
              {deleteTarget?.vehicleNumber}
            </span>
            ?
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GetAllVehicles;
