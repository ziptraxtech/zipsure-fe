import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface JobStatusChartProps {
  jobStatuses: { [key: string]: number }; 
}

const JobStatusChart: React.FC<JobStatusChartProps> = ({ jobStatuses }) => {
  const assignedCount = jobStatuses["assigned"] || 0;
  const yetToBeAssignedCount = jobStatuses["yet to be assigned"] || 0;

  const data = {
    labels: ["Assigned", "Yet to be assigned"],
    datasets: [
      {
        data: [assignedCount, yetToBeAssignedCount],
        backgroundColor: ["#4CAF50", "#FFA500"],
        borderWidth: 1,
      },
    ],
  };
  const options: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { display: true, position: "right" },
    },
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
  };

  return (
    <Card className="fleet-card-gradient border rounded-lg hover:fleet-shadow fleet-transition cursor-pointer">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Job Status
        </CardTitle>
      </CardHeader>
      <CardContent className="h-28">
        <Doughnut data={data} options={options} />
      </CardContent>
    </Card>
  );
};

export default JobStatusChart;
