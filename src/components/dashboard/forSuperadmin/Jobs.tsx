import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AllocatorLike {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface JobItem {
  id: string;
  title: string;
  description: string;
  status: string;
  allocatorId?: string | null;
  organizationId?: string | null;
  allocator?: AllocatorLike | null;
  allocatorName?: string | null;
  createdAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrganizations(res?.data?.data ?? []);
    } catch (error: unknown) {
      console.error("Error fetching organizations", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res?.data?.data ?? []);
    } catch (error: unknown) {
      console.error("Error fetching users", error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/v1/jobs/superadmin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: JobItem[] = res?.data?.data ?? [];
      setJobs(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching jobs", error);
      toast({ title: "Failed to fetch jobs", description: message, className: "bg-red-500 text-white", duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchOrganizations();
    fetchUsers();
    const interval = setInterval(fetchJobs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOrganizationName = (organizationId: string | null | undefined): string => {
    if (!organizationId) return "—";
    const org = organizations.find(o => o.id === organizationId);
    return org?.name || "—";
  };

  const getAllocatorName = (allocatorId: string | null | undefined): string => {
    if (!allocatorId) return "—";
    const user = users.find(u => u.id === allocatorId);
    if (user) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—";
    }
    return "—";
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      case 'yet to be assigned':
        return <Badge variant="outline" className="text-gray-500 border-gray-500">Yet to be assigned</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status || '—'}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Jobs</h1>
      </div>

      <Card className="shadow-md border rounded-lg">
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="text-xs md:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="hidden lg:table-cell">Allocator</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/40">
                    <TableCell className="whitespace-normal break-words max-w-[200px] md:max-w-none">{job.title || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words">{job.description || "—"}</TableCell>
                    <TableCell className="whitespace-normal break-words">{getOrganizationName(job.organizationId)}</TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-normal break-words">{getAllocatorName(job.allocatorId)}</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      {getStatusBadge(job.status)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-4 text-center text-muted-foreground">
                    {loading ? "Loading jobs..." : "No jobs found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Jobs;
