import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface JobStatusChartProps {
  jobStatuses: { assigned: number; in_progress: number };
}

const JobStatusChart: React.FC<JobStatusChartProps> = ({ jobStatuses }) => {
  const data = {
    labels: ["Assigned", "In Progress"],
    datasets: [
      {
        data: [jobStatuses.assigned || 0, jobStatuses.in_progress || 0],
        backgroundColor: ["#4CAF50", "#FFA500"],
        borderWidth: 1,
      },
    ],
  };

  // ✅ Use proper typing for Chart.js options
  const options: ChartOptions<"doughnut"> = {
    plugins: {
      legend: { display: true, position: "right" }, // now "right" matches the union type
    },
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
  };

  return (
    <Card className="shadow-md border rounded-lg hover:shadow-primary">
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
