import React from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import { Building2, DollarSign, Users, Truck } from 'lucide-react';

interface OverviewData {
  totalOrganizations: number;
  totalUsers: number;
  totalVehicles: number;
  totalJobs: number;
  totalSubscriptions: number;
  totalPayments: number;
  totalRevenue: number;
}

interface Props {
  overview: OverviewData;
}

const MetricsSection: React.FC<Props> = ({ overview }) => {
  const metrics = [
    {
      title: 'Total Organizations',
      value: overview.totalOrganizations.toString(),
      subtitle: 'Active organizations',
      icon: Building2,
    },
    {
      title: 'Total Subscriptions',
      value: overview.totalSubscriptions.toString(),
      subtitle: 'Across all orgs',
      icon: DollarSign,
    },
    {
      title: 'Total Users',
      value: overview.totalUsers.toString(),
      subtitle: 'All registered users',
      icon: Users,
    },
    {
      title: 'Total Vehicles',
      value: overview.totalVehicles.toString(),
      subtitle: 'Registered fleet',
      icon: Truck,
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricsSection;
