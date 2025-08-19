// pages/OrganizationOverviewPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddOrganizationDialog from "./AddOrganization";

export interface Organization {
  name: string;
  status: string;
  phone: string;
  email: string;
  gst: string;
  address: string;
}

interface OrganizationOverviewProps {
  organizations: Organization[];
  isLoading: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-success border-success">Active</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Address Modal
const AddressDialog: React.FC<{ org: Organization }> = ({ org }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs">
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
          <p className="mt-1">{org.gst}</p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// Organization Table Component
const OrganizationTable: React.FC<OrganizationOverviewProps> = ({ organizations, isLoading }) => {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No organizations found. {isLoading ? "Loading..." : "Try refreshing the page."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 font-medium">Organization</th>
            <th className="text-left p-2 font-medium">Status</th>
            <th className="text-left p-2 font-medium">Phone</th>
            <th className="text-left p-2 font-medium">Email</th>
            <th className="text-left p-2 font-medium">GST</th>
            <th className="text-left p-2 font-medium">Address</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org, index) => (
            <tr key={index} className="border-b border-border/50 hover:bg-muted/50 fleet-transition">
              <td className="p-2 font-medium">{org.name}</td>
              <td className="p-2">{getStatusBadge(org.status)}</td>
              <td className="p-2">{org.phone}</td>
              <td className="p-2">{org.email}</td>
              <td className="p-2">{org.gst}</td>
              <td className="p-2"><AddressDialog org={org} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Page ---
const OrganizationOverview: React.FC<OrganizationOverviewProps> = () => {
  const navigate = useNavigate();
  const [organizationsState, setOrganizationsState] = useState<Organization[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(false);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const res = await fetch("http://localhost:3000/api/v1/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formattedOrgs = json.data.map((org: any) => ({
          name: org.name,
          status: org.isActive ? "active" : "inactive",
          phone: org.phone,
          email: org.email,
          gst: org.gstNumber,
          address: [org.address, org.city, org.state, org.country].filter(Boolean).join(", "),
        }));
        return formattedOrgs;
      } else {
        console.error("Failed to fetch organizations:", json.message || "Unknown error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadOrganizations = async () => {
      setIsLoadingState(true);
      const orgs = await fetchOrganizations();
      if (orgs) {
        setOrganizationsState(orgs);
      }
      setIsLoadingState(false);
    };
    loadOrganizations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <AddOrganizationDialog onAdded={() => {}} />
      </div>
      <OrganizationTable organizations={organizationsState} isLoading={isLoadingState} />
    </div>
  );
};

export default OrganizationOverview;
