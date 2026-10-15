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
    const filenames: Record<typeof endpoint, string> = {
      organizations: "organizations_export.csv",
      users: "users_export.csv",
      payments: "payments_export.csv",
      jobs: "jobs_export.csv",
    };
    return filenames[endpoint];
  };

  const getSuccessMessage = () => {
    const messages: Record<typeof endpoint, string> = {
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

      const endpointPaths: Record<typeof endpoint, string> = {
        organizations: "organizations/csv",
        users: "users/csv",
        payments: "payments/superadmin/csv",
        jobs: "jobs/superadmin/csv",
      };

      const response = await fetch(`${API_URL}/api/v1/${endpointPaths[endpoint]}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result as string;

        if ((window as any).Android?.saveCSV) {
          // Call Android interface
          (window as any).Android.saveCSV(base64data, getDefaultFilename());
        } else {
          // Fallback for desktop browsers
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
          link.download = getDefaultFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
        }
      };

      reader.readAsDataURL(blob);
      
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