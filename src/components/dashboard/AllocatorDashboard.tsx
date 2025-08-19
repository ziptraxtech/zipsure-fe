"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Eye, DollarSign, Star, MapPin } from "lucide-react";
import NewJob from "./forAdmin/AddJobModal";

// Reusable Metric Card
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "success";
}
const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, variant = "default" }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`p-3 rounded-lg ${
            variant === "success" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
};

const AllocatorDashboard: React.FC = () => {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const handleJobAdded = () => {
    console.log("Job successfully added!");
    // TODO: refresh jobs list here
  };

  const metrics = [
    {
      title: "Jobs Today",
      value: "24",
      subtitle: "5 pending, 3 active",
      icon: ClipboardList,
    },
    {
      title: "Earnings Today",
      value: "$540",
      subtitle: "Average: $22/job",
      icon: DollarSign,
      variant: "success" as const,
    },
    {
      title: "Rider Rating",
      value: "4.8",
      subtitle: "320 reviews",
      icon: Star,
      variant: "success" as const,
    },
    {
      title: "Distance Covered",
      value: "120 km",
      subtitle: "This week",
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Job Allocation</h1>
          <p className="text-muted-foreground">
            Manage and assign jobs to available riders
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Live Map
          </Button>
          <Button size="sm" onClick={() => setIsJobModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">Order #1234</p>
                <p className="text-sm text-muted-foreground">
                  Pickup: Warehouse A
                </p>
              </div>
              <Badge variant="outline" className="text-warning border-warning">
                Pending
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Job Modal */}
      <NewJob
        open={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onJobAdded={handleJobAdded}
      />
    </div>
  );
};

export default AllocatorDashboard;
