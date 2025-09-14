import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL;

interface JobRider {
  id: string;
  title: string;
  description: string;
  status: "pending" | "accepted" | "in progress" | "completed" | "cancelled";
  pickupLocation: string;
  deliveryLocation: string;
  createdAt: string;
}

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "in progress":
      return <Badge variant="outline" className="text-blue-600 border-blue-600">In Progress</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
    case "completed":
      return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>;
    case "accepted":
      return <Badge variant="outline" className="text-purple-600 border-purple-600">Accepted</Badge>;
    default:
      return <Badge variant="outline" className="capitalize">{status || "—"}</Badge>;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const JobsRider: React.FC = () => {
  const [jobs, setJobs] = useState<JobRider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const url = `${API_URL}/api/v1/jobs/my-jobs`;
      console.log('Fetching jobs from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      console.log('Jobs response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch jobs");
      }

      const data = await response.json();
      console.log('Jobs data received:', data);

      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data);
      } else {
        setJobs([]);
        console.warn('No jobs data found in response');
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load jobs. Please try again.",
        className: "bg-red-500 text-white",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">My All Jobs</h1>
          
        </div>
      </div>
      <Card className="shadow-sm border rounded-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Pickup</TableHead>
                <TableHead className="hidden lg:table-cell">Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Assigned On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium whitespace-normal break-words max-w-[150px]" title={job.title || ""}>
                      {job.title || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words max-w-[200px]">
                      {job.description || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-normal break-words max-w-[200px]">
                      {job.pickupLocation || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-normal break-words max-w-[200px]">
                      {job.deliveryLocation || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {job.createdAt ? formatDate(job.createdAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No jobs assigned yet.
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

// ✅ Fixed default export name
export default JobsRider;
