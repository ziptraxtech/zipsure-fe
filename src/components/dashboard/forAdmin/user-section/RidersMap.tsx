import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

const RiderLocation = new L.DivIcon({
  html: `
    <div style="position: relative; width: 32px; height: 41px;">
      <svg 
        width="32" 
        height="41" 
        viewBox="0 0 32 41" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 41 16 41C16 41 32 24.837 32 16C32 7.163 24.837 0 16 0Z" 
          fill="#6366f1"
          stroke="#4f46e5"
          stroke-width="1"
        />
        <g transform="translate(8, 8)">
          <circle cx="8" cy="7" r="3" fill="white" stroke="white" stroke-width="1"/>
          <path d="M2 21c0-3.5 2.5-7 6-7s6 3.5 6 7" fill="none" stroke="white" stroke-width="2"/>
        </g>
      </svg>
    </div>
  `,
  className: 'rider-marker',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -41]
});

const SelectedRiderLocation = new L.DivIcon({
  html: `
    <div style="position: relative; width: 40px; height: 52px;">
      <svg 
        width="40" 
        height="52" 
        viewBox="0 0 32 41" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
      >
        <path 
          d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 41 16 41C16 41 32 24.837 32 16C32 7.163 24.837 0 16 0Z" 
          fill="#ef4444"
          stroke="#dc2626"
          stroke-width="1"
        />
        <g transform="translate(8, 8) scale(1.1)">
          <circle cx="8" cy="7" r="3" fill="white" stroke="white" stroke-width="1"/>
          <path d="M2 21c0-3.5 2.5-7 6-7s6 3.5 6 7" fill="none" stroke="white" stroke-width="2"/>
        </g>
      </svg>
    </div>
  `,
  className: 'rider-marker selected',
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52]
});

interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  role: string;
}

interface Charger {
  id: string;
  name: string;
  location: string;
  distance: string;
  status: 'available' | 'occupied' | 'maintenance';
  type: string;
  power: string;
}

type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
};

type RidersApiResponse = {
  success: boolean;
  data: ApiUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const MapController = ({ riders, selectedRiderId }: { riders: Rider[]; selectedRiderId: string | null }) => {
  const map = useMap();

  useEffect(() => {
    const ridersWithCoords = riders.filter(r => r.latitude !== null && r.longitude !== null);
    if (ridersWithCoords.length > 0) {
      const bounds = L.latLngBounds(ridersWithCoords.map(r => [r.latitude!, r.longitude!]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [riders, map]);

  useEffect(() => {
    if (selectedRiderId) {
      const selectedRider = riders.find(r => r.id === selectedRiderId && r.latitude !== null && r.longitude !== null);
      if (selectedRider) {
        map.setView([selectedRider.latitude!, selectedRider.longitude!], 15, {
          animate: true,
          duration: 1
        });
      }
    }
  }, [selectedRiderId, riders, map]);

  return null;
};

const RidersMap = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [chargers] = useState<Charger[]>([
    {
      id: '1',
      name: 'City Mall Charging Station',
      location: 'Sector 14, Gurgaon',
      distance: '0.5 km',
      status: 'available',
      type: 'Fast Charging',
      power: '50kW'
    },
    {
      id: '2',
      name: 'Metro Station Charger',
      location: 'Huda City Centre',
      distance: '1.2 km',
      status: 'occupied',
      type: 'Rapid Charging',
      power: '120kW'
    },
    {
      id: '3',
      name: 'Shopping Complex',
      location: 'MG Road, Sector 28',
      distance: '2.1 km',
      status: 'available',
      type: 'Standard Charging',
      power: '22kW'
    },
    {
      id: '4',
      name: 'Business Park Hub',
      location: 'Cyber City, DLF Phase 3',
      distance: '3.5 km',
      status: 'maintenance',
      type: 'Fast Charging',
      power: '75kW'
    }
  ]);

  const fetchRiders = useCallback(async (isAutoRefresh = false, pageParam?: number) => {
    try {
      if (isAutoRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const currentPage = pageParam ?? page;

      const url = new URL(`https://app.zipsureai.com/api/api/v1/users`);
      url.searchParams.set('role', 'rider');
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('limit', String(limit));
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expired. Please log in again.');
        }
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: RidersApiResponse = await response.json();

      if (data.success && data.data) {
        const allRiders: Rider[] = data.data.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          latitude: user.latitude,
          longitude: user.longitude,
        }));

        setRiders(allRiders);
        setLastUpdated(new Date());
        setError(null);

        if (data.pagination) {
          setTotalPages(data.pagination.pages);
          setTotalCount(data.pagination.total);
          setPage(data.pagination.page);
        } else {
          setTotalPages(1);
          setTotalCount(data.data.length);
        }
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err: unknown) {
      console.error('Error in fetchRiders:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to load rider locations: ${message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchRiders(false, page);
  }, [fetchRiders, page]);

  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      fetchRiders(true);
    }, 60000);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchRiders]);

  const handleRiderClick = (rider: Rider) => {
    if (rider.latitude === null || rider.longitude === null) return;
    setSelectedRiderId(rider.id);
  };

  const handleRiderSelect = (riderId: string) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider || rider.latitude === null || rider.longitude === null) return;
    setSelectedRiderId(riderId);
  };

  const gotoPrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const gotoNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading rider locations...</p>
      </div>
    );
  }

  if (error && riders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p style={{ color: 'red' }}>{error}</p>
          <button
            onClick={() => fetchRiders(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (riders.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No riders found.</p>
      </div>
    );
  }

  const ridersWithLocation = riders.filter(r => r.latitude !== null && r.longitude !== null);
  const defaultCenter: [number, number] = ridersWithLocation.length > 0
    ? [ridersWithLocation[0].latitude!, ridersWithLocation[0].longitude!]
    : [28.6139, 77.2090];

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-orange-50 pb-[100px]">
      <div className="p-4 space-y-6 min-h-full">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl lg:text-3xl font-bold">Riders Map</h1>
        </div>

        {/* Map Section */}
        <div className="w-full">
          <div className="h-96 rounded-lg overflow-hidden shadow-md">
            <MapContainer
              center={defaultCenter}
              zoom={10}
              scrollWheelZoom={false}
              style={{
                height: '100%',
                width: '100%',
                zIndex: 0,
                position: 'relative',
                touchAction: 'pan-y',
              }}
              className="leaflet-container"
              ref={mapRef}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <MapController
                riders={riders}
                selectedRiderId={selectedRiderId}
              />

              {ridersWithLocation.map((rider) => (
                <Marker
                  key={rider.id}
                  position={[rider.latitude!, rider.longitude!]}
                  icon={
                    selectedRiderId === rider.id
                      ? SelectedRiderLocation
                      : RiderLocation
                  }
                  zIndexOffset={selectedRiderId === rider.id ? 1000 : 0}
                  eventHandlers={{
                    click: () => handleRiderClick(rider),
                  }}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[200px]">
                      <h4 className="font-semibold text-base">
                        {rider.firstName} {rider.lastName}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">{rider.email}</span>
                        </div>
                        {rider.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-700">{rider.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">
                            {rider.latitude!.toFixed(4)}, {rider.longitude!.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Badge
                          variant="outline"
                          className={`${rider.isActive
                              ? 'text-green-500 border-green-500'
                              : 'text-red-500 border-red-500'
                            }`}
                        >
                          {rider.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Riders Section */}
        <div className="w-full">
          <Card className="shadow-md border rounded-lg">
            <CardHeader className="pb-3 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" /> Riders
                  {refreshing && (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500 ml-2" />
                  )}
                </CardTitle>

                {/* Pagination */}
                <div className="flex items-center gap-3 text-sm">
                  <button
                    onClick={gotoPrevPage}
                    disabled={page === 1}
                    className={`px-2 py-1.5 rounded border ${page === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-primary text-white'
                      }`}
                    aria-label="Previous page"
                  >
                    Prev
                  </button>
                  <span className="min-w-[40px] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={gotoNextPage}
                    disabled={page === totalPages}
                    className={`px-2 py-1.5 rounded border ${page === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-primary text-white'
                      }`}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedRiderId === rider.id
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white hover:bg-gray-50'
                      }`}
                    onClick={() => handleRiderSelect(rider.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-sm">
                        {rider.firstName} {rider.lastName}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`${rider.isActive
                            ? 'text-green-500 border-green-500'
                            : 'text-red-500 border-red-500'
                          }`}
                      >
                        {rider.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{rider.email}</span>
                      </div>
                      {rider.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{rider.phone}</span>
                        </div>
                      )}
                      {rider.latitude === null || rider.longitude === null ? (
                        <div className="text-xs text-red-400 italic">
                          No location available
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

  );
};

export default RidersMap;