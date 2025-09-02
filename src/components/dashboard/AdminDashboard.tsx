import React, { useEffect, useState } from "react";
import axios from "axios";
import MetricCard from "./MetricCard";
import { Button } from "@/components/ui/button";
import { Truck, Users, ClipboardList, Plus, Eye } from "lucide-react";
import JobStatusChart from "./forAdmin/jobs/JobStatusChart";
import RecentJobsTable from "./forAdmin/jobs/RecentJobsTable";
import UsersTable from "./forAdmin/user-section/UsersTable"; 
import AllJobsModal from "./forAdmin/jobs/AllJobsModal";
import AddVehicleModal from "./forAdmin/vichicle/AddVehicleModal"; 
import GetAllVehicles from "./forAdmin/vichicle/GetAllVehicles";

const API_URL = import.meta.env.VITE_API_URL;

interface JobSummary {
  id: string;
  title: string;
  description?: string | null;
  allocator?: {
    firstName: string;
    lastName: string;
  } | null;
  rider?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  status: string;
  completedAt: string | null;
  vehicleId?: string | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
} 

const AdminDashboard = () => {
  const [organizationName, setOrganizationName] = useState<string>(""); // ✅ store org name
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [jobStatuses, setJobStatuses] = useState({ assigned: 0, in_progress: 0 });
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [allJobs, setAllJobs] = useState<JobSummary[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isViewVehiclesModalOpen, setIsViewVehiclesModalOpen] = useState(false);

  const fetchOrganisationName = async (orgId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/organisations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.data?.name) {
        setOrganizationName(res.data.data.name);
      }
    } catch (err) {
      console.error("Error fetching organisation name:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAllUsers(res.data.data.slice(0, 10));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/api/v1/analytics/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.data?.overview) {
        const { totalUsers, totalJobs, totalVehicles, jobStatuses, organizationId } = res.data.data.overview;

        setTotalUsers(totalUsers || 0);
        setTotalJobs(totalJobs || 0);
        setTotalVehicles(totalVehicles || 0);
        if (jobStatuses) setJobStatuses(jobStatuses);

        if (organizationId) {
          await fetchOrganisationName(organizationId);
        }
      }

      if (res.data?.success && res.data.data?.recentJobs) {
        setRecentJobs(res.data.data.recentJobs.slice(0, 5));
      }

      await fetchUsers();
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllJobs = () => {
    const token = localStorage.getItem("token");
    setLoadingJobs(true);
    axios
      .get(`${API_URL}/api/v1/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAllJobs(res.data.data);
          setIsModalOpen(true);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingJobs(false));
  };

  const metrics = [
    { title: "Total Users", value: totalUsers.toString(), subtitle: "All registered users", icon: Users },
    { title: "Total Jobs", value: totalJobs.toString(), subtitle: "All time jobs", icon: ClipboardList, variant: "success" as const },
    { title: "Total Vehicles", value: totalVehicles.toString(), subtitle: "Fleet size", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div id="admin-dashboard-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{organizationName || "Organization"} Dashboard</h1>
          <p className="text-muted-foreground">
         
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsViewVehiclesModalOpen(true)}>
            <Eye className="h-4 w-4 mr-2" /> View All Vehicles
          </Button>
          <Button size="sm" onClick={() => setIsVehicleModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Metrics & Chart */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => <MetricCard key={index} {...metric} />)}
        <JobStatusChart jobStatuses={jobStatuses} />
      </div>

      {/* Recent Jobs Section */}
      <div>
        <RecentJobsTable recentJobs={recentJobs} fetchAllJobs={fetchAllJobs} loadingJobs={loadingJobs} />
      </div>

      {/* Users Table Section */}
      <div id="admin-users-section">
        <UsersTable users={allUsers} />
      </div>

      {/* All Jobs Modal */}
      {isModalOpen && <AllJobsModal allJobs={allJobs} onClose={() => setIsModalOpen(false)} />}

      {/* Add Vehicle Modal */}
      {isVehicleModalOpen && (
        <AddVehicleModal
          open={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          onVehicleAdded={() => {
            setIsVehicleModalOpen(false);
            setTotalVehicles((prev) => prev + 1);
          }}
        />
      )}

      {/* Get All Vehicles Modal */}
      {isViewVehiclesModalOpen && (
        <GetAllVehicles
          open={isViewVehiclesModalOpen}
          onClose={() => setIsViewVehiclesModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
