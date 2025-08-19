import React, { useEffect, useState } from "react";
import axios from "axios";
import MetricCard from "./MetricCard";
import { Button } from "@/components/ui/button";
import { Truck, Users, ClipboardList, Plus, Eye } from "lucide-react";
import JobStatusChart from "./forAdmin/JobStatusChart";
import RecentJobsTable from "./forAdmin/RecentJobsTable";
import UsersTable from "./forAdmin/UsersTable"; // UsersTable component that accepts 'users' prop
import AllJobsModal from "./forAdmin/AllJobsModal";
import AddVehicleModal from "./forAdmin/AddVehicleModal"; 
import GetAllVehicles from "./forAdmin/GetAllVehicles"; // Import your vehicle modal

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [jobStatuses, setJobStatuses] = useState({ assigned: 0, in_progress: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isViewVehiclesModalOpen, setIsViewVehiclesModalOpen] = useState(false); // NEW

  // Fetch users separately
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/api/v1/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAllUsers(res.data.data.slice(0, 25)); // fetch first 25 users
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Fetch admin overview, recent jobs, and users
  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:3000/api/v1/analytics/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.data?.overview) {
        const { totalUsers, totalJobs, totalVehicles, jobStatuses } = res.data.data.overview;
        setTotalUsers(totalUsers || 0);
        setTotalJobs(totalJobs || 0);
        setTotalVehicles(totalVehicles || 0);
        if (jobStatuses) setJobStatuses(jobStatuses);
      }
      if (res.data?.success && res.data.data?.recentJobs) {
        setRecentJobs(res.data.data.recentJobs.slice(0, 5));
      }

      // Fetch users after admin data
      await fetchUsers();
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData(); // initial fetch

    // Auto-refresh every 1 minute (60000 ms)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const fetchAllJobs = () => {
    const token = localStorage.getItem("token");
    setLoadingJobs(true);
    axios
      .get("http://localhost:3000/api/v1/jobs", {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Organization Dashboard</h1>
          <p className="text-muted-foreground">Logistics Corp - Fleet Management Overview</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Updated button with onClick */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsViewVehiclesModalOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />View All Vehicles
          </Button>
          <Button size="sm" onClick={() => setIsVehicleModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Vehicle
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
      <div>
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
            setTotalVehicles(prev => prev + 1);
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
