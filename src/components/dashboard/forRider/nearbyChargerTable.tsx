import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Zap, AlertCircle, Route } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Charger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'active' | 'inactive';
  charger_type: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NearbyChargerTableProps {
  currentLatitude: number;
  currentLongitude: number;
  onChargerClick: (charger: Charger, e: React.MouseEvent) => void;
  className?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export const NearbyChargerTable: React.FC<NearbyChargerTableProps> = ({
  currentLatitude,
  currentLongitude,
  onChargerClick,
  className = ''
}) => {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);

  const fetchNearbyChargers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/chargers/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentLatitude,
          currentLongitude
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch nearby chargers');
      }

      const { data } = await response.json();
      setChargers(data);
    } catch (err) {
      console.error('Error fetching nearby chargers:', err);
      setError(err.message || 'Failed to load nearby chargers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentLatitude && currentLongitude) {
      fetchNearbyChargers();
    }
  }, [currentLatitude, currentLongitude]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-success border-success">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-muted-foreground border-muted">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRouteClick = (charger: Charger, e: React.MouseEvent) => {
    e.stopPropagation();
    onChargerClick(charger, e);
  };

  const handleRowClick = (charger: Charger, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChargerId(charger.id === selectedChargerId ? null : charger.id);
    if (onChargerClick) {
      onChargerClick(charger, e);
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Nearby Charging Stations
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={fetchNearbyChargers}
                >
                  Retry
                </Button>
              </div>
            ) : chargers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Zap className="h-8 w-8 mb-2" />
                <p className="text-sm">No charging stations found nearby</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
              <TableHead className="md:table-cell">Name</TableHead>
              <TableHead className="md:table-cell">Address</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="md:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chargers.map((charger) => (
                    <TableRow 
                      key={charger.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedChargerId === charger.id 
                          ? 'bg-primary/5' 
                          : ''
                      }`}
                      onClick={(e) => {
                        setSelectedChargerId(charger.id);
                        onChargerClick(charger, e);
                      }}
                    >
                  <TableCell className="font-medium">{charger.name}</TableCell>
                  <TableCell className="md:table-cell min-w-[150px] max-w-[300px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="break-words" title={charger.address}>
                            {charger.address}
                          </span>
                        </div>
                      </TableCell>
                  <TableCell className="hidden md:table-cell capitalize">
                    {charger.charger_type || 'Standard'}
                      </TableCell>
                  <TableCell>
                    {getStatusBadge(charger.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NearbyChargerTable;