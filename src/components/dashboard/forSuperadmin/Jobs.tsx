import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/v1/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrganizations(res?.data?.data ?? []);
    } catch (error: unknown) {
      console.error("Error fetching organizations", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/v1/users", {
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
      const res = await axios.get("http://localhost:3000/api/v1/jobs/superadmin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: JobItem[] = res?.data?.data ?? [];
      setJobs(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching jobs", error);
      toast({ title: "Failed to fetch jobs", description: message, variant: "destructive" });
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
          <div className="overflow-x-auto">
            <table className="w-full border rounded-md">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Organization Name</th>
                  <th className="p-3 text-left">Allocator Name</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/50 hover:bg-muted/40">
                      <td className="p-3">{job.title || "—"}</td>
                      <td className="p-3">{job.description || "—"}</td>
                      <td className="p-3">{getOrganizationName(job.organizationId)}</td>
                      <td className="p-3">{getAllocatorName(job.allocatorId)}</td>
                      <td className="p-3 capitalize">{job.status || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      {loading ? "Loading jobs..." : "No jobs found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Jobs;


