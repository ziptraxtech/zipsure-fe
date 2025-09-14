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
}

const API_URL = import.meta.env.VITE_API_URL;

export const NearbyChargerTable: React.FC<NearbyChargerTableProps> = ({
  currentLatitude,
  currentLongitude,
  onChargerClick,
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

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Nearby Charging Stations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardContent className="py-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchNearbyChargers}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5" />
            Nearby Charging Stations
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchNearbyChargers}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="md:table-cell">Name</TableHead>
              <TableHead className="md:table-cell">Address</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="md:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chargers.length > 0 ? (
              chargers.map((charger) => (
                <TableRow 
                  key={charger.id}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedChargerId === charger.id ? 'ring-2 ring-green-500' : ''}`}
                  onClick={(e) => handleRowClick(charger, e)}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No charging stations found nearby
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NearbyChargerTable;