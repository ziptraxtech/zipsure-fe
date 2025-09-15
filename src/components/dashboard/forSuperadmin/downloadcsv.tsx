import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface DownloadCSVProps {
  endpoint: 'organizations' | 'users' | 'payments' | 'jobs';
  disabled?: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
}

export function DownloadCSV({ 
  endpoint, 
  disabled = false, 
  onDownloadStart, 
  onDownloadComplete 
}: DownloadCSVProps) {
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;

  const getDefaultFilename = () => {
    const filenames = {
      organizations: 'organizations_export.csv',
      users: 'users_export.csv',
      payments: 'payments_export.csv',
      jobs: 'jobs_export.csv'
    };
    return filenames[endpoint];
  };

  const getSuccessMessage = () => {
    const messages = {
      organizations: "Organizations data has been downloaded successfully.",
      users: "Users data has been downloaded successfully.",
      payments: "Payments data has been downloaded successfully.",
      jobs: "Jobs data has been downloaded successfully."
    };
    return messages[endpoint];
  };

  const handleDownload = async () => {
    try {
      onDownloadStart?.();
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpointPaths = {
        organizations: 'organizations/csv',
        users: 'users/csv',
        payments: 'payments/superadmin/csv',
        jobs: 'jobs/superadmin/csv'
      };

      const response = await fetch(`${API_URL}/api/v1/${endpointPaths[endpoint]}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = getDefaultFilename();
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onDownloadComplete?.();
      
      toast({
        title: "Download complete",
        description: getSuccessMessage(),
        variant: "default",
        duration: 5000,
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : `Failed to download ${endpoint} data`,
        variant: "destructive",
        duration: 5000,
        className: "bg-red-500 text-white",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2"
      onClick={handleDownload}
      disabled={disabled}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}