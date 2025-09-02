import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserAdded: (newUser: any) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    username: "",
    prize: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${API_URL}/api/v1/users`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onUserAdded(res.data);

      onClose();
      setFormData({ username: "", prize: "" });
    } catch (err: any) {
      console.error("Error adding user:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong while adding the user.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="space-y-3">
          <Input
            placeholder="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
          <Input
            placeholder="Prize"
            name="prize"
            value={formData.prize}
            onChange={handleChange}
          />
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
