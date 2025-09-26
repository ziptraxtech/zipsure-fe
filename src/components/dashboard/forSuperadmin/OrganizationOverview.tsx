import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import AddOrganizationDialog from "./AddOrganization";
import { Building2Icon, Trash2 } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { DownloadCSV } from "./downloadcsv";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_URL;

export interface Organization {
  id: string;
  name: string;
  status: string; 
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
}

interface OrganizationOverviewProps {
  organizations?: Organization[];
  isLoading?: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-success border-success">Active</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-muted-foreground border-muted">Inactive</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const AddressDialog: React.FC<{ org: Organization }> = ({ org }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs">
        View
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{org.name}'s Address</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Full Address</h4>
          <p className="mt-1">{org.address}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
          <p className="mt-1">{org.phone}</p>
          <p>{org.email}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">GST Number</h4>
          <p className="mt-1">{org.gstNumber}</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const OrganizationTable: React.FC<{
  organizations: Organization[];
  isLoading: boolean;
  onEdit: (org: Organization) => void;
  onAskDelete: (org: Organization) => void;
}> = ({ organizations, isLoading, onEdit, onAskDelete }) => {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No organizations found. {isLoading ? "Loading..." : "Try refreshing the page."}
      </div>
    );
  }

  return (
    <Table className="text-xs md:text-sm">
      <TableHeader>
        <TableRow>
          <TableHead>Organization</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead className="hidden lg:table-cell">GST</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org, index) => (
          <TableRow key={index} className="fleet-transition">
            <TableCell className="font-medium whitespace-normal break-words max-w-[200px] md:max-w-none">{org.name}</TableCell>
            <TableCell className="hidden md:table-cell">{getStatusBadge(org.status)}</TableCell>
            <TableCell className="whitespace-normal break-words">{org.phone}</TableCell>
            <TableCell className="hidden md:table-cell whitespace-normal break-words">{org.email}</TableCell>
            <TableCell className="hidden lg:table-cell whitespace-normal break-words">{org.gstNumber}</TableCell>
            <TableCell>
              <AddressDialog org={org} />
            </TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(org)}>Edit</Button>
              <Button color="primary" size="sm" onClick={() => onAskDelete(org)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const OrganizationOverview: React.FC<OrganizationOverviewProps> = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizationsState, setOrganizationsState] = useState<Organization[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  const fetchOrganizations = useCallback(async (): Promise<Organization[] | undefined> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const url = `${API_URL}/api/v1/organizations`;
      console.log('Fetching organizations from:', url);
      
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Organizations response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const formattedOrgs: Organization[] = json.data.map((org: any) => ({
          id: org.id,
          name: org.name,
          status: org.isActive ? "active" : "inactive",
          phone: org.phone,
          email: org.email,
          gstNumber: org.gstNumber || "N/A",
          address: org.address || "No address provided",
        }));
        return formattedOrgs;
      }
      return [];
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations. Please try again.",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
      return [];
    }
  }, [navigate, toast]);

  const loadOrganizations = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const orgs = await fetchOrganizations();
      if (orgs) {
        setOrganizationsState(orgs);
      }
    } catch (error) {
      console.error("Error in loadOrganizations:", error);
    } finally {
      setIsLoadingState(false);
    }
  }, [fetchOrganizations]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleSaveEdit = async () => {
    if (!editingOrg) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast({ title: "Auth error", description: "Not authenticated", className: "bg-red-500 text-white", duration: 5000 });
      
      const url = `${API_URL}/api/v1/organizations/${editingOrg.id}`;
      const payload = {
        name: editingOrg.name,
        phone: editingOrg.phone,
        email: editingOrg.email,
        gstNumber: editingOrg.gstNumber === 'N/A' ? '' : editingOrg.gstNumber,
        address: editingOrg.address,
        isActive: editingOrg.status === 'active',
      };
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: 'Updated', description: 'Organization updated successfully', className: "bg-green-500 text-white", duration: 5000 });
      setEditingOrg(null);
      await loadOrganizations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update organization', className: "bg-red-500 text-white", duration: 5000 });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOrg) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast({ title: "Auth error", description: "Not authenticated", className: "bg-red-500 text-white", duration: 5000 });
      const url = `${API_URL}/api/v1/organizations/${deleteOrg.id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: 'Deleted', description: 'Organization deleted successfully', className: "bg-red-500 text-white", duration: 5000 });
      setDeleteOrg(null);
      await loadOrganizations();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete organization', className: "bg-red-500 text-white", duration: 5000 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <CardTitle className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5" />
            Organizations
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <DownloadCSV 
              endpoint="organizations"
              disabled={isDownloading || !organizationsState?.length}
              onDownloadStart={() => setIsDownloading(true)}
              onDownloadComplete={() => setIsDownloading(false)}
            />
            <AddOrganizationDialog onAdded={loadOrganizations} />
          </div>
        </div>
        <OrganizationTable 
          organizations={organizationsState} 
          isLoading={isLoadingState} 
          onEdit={(org) => setEditingOrg(org)}
          onAskDelete={(org) => setDeleteOrg(org)}
        />
      </div>

      {/* Edit Organization Modal */}
      <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          {editingOrg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div>
                <Label className="mb-2 block">Name</Label>
                <Input value={editingOrg.name} onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block">Phone</Label>
                <Input value={editingOrg.phone} onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block">Email</Label>
                <Input type="email" value={editingOrg.email} onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block">GST Number</Label>
                <Input value={editingOrg.gstNumber === 'N/A' ? '' : editingOrg.gstNumber} onChange={(e) => setEditingOrg({ ...editingOrg, gstNumber: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Address</Label>
                <Input value={editingOrg.address} onChange={(e) => setEditingOrg({ ...editingOrg, address: e.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select value={editingOrg.status} onValueChange={(v) => setEditingOrg({ ...editingOrg, status: v })}>
                  <SelectTrigger className="bg-gray-100">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingOrg(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteOrg} onOpenChange={() => setDeleteOrg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Do you really want to delete <span className="font-semibold">{deleteOrg?.name}</span>?</p>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteOrg(null)}>No</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationOverview;
