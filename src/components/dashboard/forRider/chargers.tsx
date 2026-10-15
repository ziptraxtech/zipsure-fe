import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import NearbyChargerTable from './nearbyChargerTable';

const API_URL = import.meta.env.VITE_API_URL;

declare module 'leaflet' {
  namespace Routing {
    function control(config?: any): any;
  }
}

const defaultIcon = L.Icon.Default.prototype as any;
delete defaultIcon._getIconUrl;

const MyLocation = new L.DivIcon({
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
          fill="#3b82f6"
          stroke="#2563eb"
          stroke-width="1"
        />
        <g transform="translate(8, 8)">
          <path 
            d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 8 20 8 20C8 20 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z" 
            fill="white"
            stroke="white"
            stroke-width="1.5"
          />
          <circle cx="8" cy="8" r="2" fill="#3b82f6" />
        </g>
      </svg>
    </div>
  `,
  className: 'my-location-marker',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -41]
});

const ChargerLocation = new L.DivIcon({
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
          fill="#10b981"
          stroke="#0d9f6e"
          stroke-width="1"
        />
        <g transform="translate(6, 6) scale(0.9)">
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" fill="none" stroke="white" stroke-width="2"/>
          <path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" fill="none" stroke="white" stroke-width="2"/>
          <path d="M2 21h13" stroke="white" stroke-width="2"/>
          <path d="M3 7h11" stroke="white" stroke-width="2"/>
          <path d="m9 11-2 3h3l-2 3" fill="none" stroke="white" stroke-width="2"/>
        </g>
      </svg>
    </div>
  `,
  className: 'ev-charger-marker',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -41]
});

const SelectedChargerLocation = new L.DivIcon({
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
          fill="#ff0000"
          stroke="#047857"
          stroke-width="1"
        />
        <g transform="translate(6, 6) scale(1.05)">
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" fill="none" stroke="white" stroke-width="2"/>
          <path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" fill="none" stroke="white" stroke-width="2"/>
          <path d="M2 21h13" stroke="white" stroke-width="2"/>
          <path d="M3 7h11" stroke="white" stroke-width="2"/>
          <path d="m9 11-2 3h3l-2 3" fill="none" stroke="white" stroke-width="2"/>
        </g>
      </svg>
    </div>
  `,
  className: 'ev-charger-marker selected',
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52]
});

const RouteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createRoutingControl = (map: L.Map, waypoints: L.LatLng[]) => {
  const control = L.Routing.control({
    waypoints: waypoints,
    lineOptions: { 
      styles: [{ color: '#3b82f6', weight: 4, opacity: 0.7 }],
      extendToWaypoints: true,
      missingRouteTolerance: 0
    },
    addWaypoints: false,
    routeWhileDragging: false,
    createMarker: () => null,
    show: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    showAlternatives: false
  });
  
  control.addTo(map);
  return control;
};

interface Charger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  charger_type: string | null;
}

const MapController = ({ onMapReady, routingControl, setRoutingControl }: any) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    return () => {
      if (routingControl && map) {
        try {
          map.removeControl(routingControl);
        } catch (error) {
          console.warn('Error removing routing control:', error);
        }
      }
    };
  }, [routingControl, map]);

  return null;
};

const MapComponent = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const [selectedChargerLatLng, setSelectedChargerLatLng] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentLocation = () => {
    return new Promise<[number, number]>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  };

  useEffect(() => {
    getCurrentLocation()
      .then((coords) => {
        setPosition(coords);
      })
      .catch((error) => {
        console.error('Error fetching initial location:', error);
        setError('Failed to get your location. Please enable location services.');
      });
  }, []);

  useEffect(() => {
    if (position) {
      locationIntervalRef.current = setInterval(() => {
        getCurrentLocation()
          .then((coords) => {
            setPosition(coords);
            console.log('Location updated:', coords);
          })
          .catch((error) => {
            console.warn('Error updating location:', error);
          });
      }, 10000);

      return () => {
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
      };
    }
  }, [position]);

  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchChargers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_URL}/api/v1/chargers`, {
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
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setChargers(data.data);
        } else {
          throw new Error('Invalid data format received from server');
        }
      } catch (err: any) {
        console.error('Error in fetchChargers:', err);
        setError(`Failed to load charger locations: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChargers();
  }, []);

  const handleMapReady = (mapInstance: L.Map) => {
    console.log('Map is ready:', mapInstance);
    setMap(mapInstance);
    mapRef.current = mapInstance;
  };

  const handleChargerClick = (charger: Charger, e: any) => {
    const currentMap = mapRef.current || map;
    
    if (!currentMap || !position) {
      console.warn('Map or position not available');
      return;
    }

    setSelectedChargerId(charger.id);
    setSelectedChargerLatLng([charger.latitude, charger.longitude]);

    console.log('Creating route from', position, 'to', [charger.latitude, charger.longitude]);

    if (routingControl) {
      try {
        currentMap.removeControl(routingControl);
      } catch (error) {
        console.warn('Error removing existing routing control:', error);
      }
    }

    const waypoints = [
      L.latLng(position[0], position[1]), 
      L.latLng(charger.latitude, charger.longitude)
    ];

    try {
      const control = createRoutingControl(currentMap, waypoints);
      setRoutingControl(control);

      setTimeout(() => {
        currentMap.fitBounds(L.latLngBounds(waypoints), { padding: [50, 50] });
      }, 100);
    } catch (error) {
      console.error('Error creating routing control:', error);
      setError('Failed to create route. Please try again.');
    }
  };

  useEffect(() => {
    const currentMap = mapRef.current || map;
    if (!position || !selectedChargerLatLng || !currentMap) return;

    const newWaypoints = [
      L.latLng(position[0], position[1]),
      L.latLng(selectedChargerLatLng[0], selectedChargerLatLng[1])
    ];

    try {
      if (routingControl) {
        routingControl.setWaypoints(newWaypoints);
      } else {
        const control = createRoutingControl(currentMap, newWaypoints);
        setRoutingControl(control);
      }
    } catch (err) {
      console.warn('Error updating route with new position:', err);
    }
  }, [position, selectedChargerLatLng, map]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading charger locations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="bg-[radial-gradient(circle_at_100%_0%,rgba(206,122,122,0.15)_0%,rgba(255,255,255,0)_70%)] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 h-screen flex flex-col p-4 overflow-hidden h-screen ">
        <h1 className="text-2xl lg:text-3xl font-bold mb-4">Chargers Map</h1>
        <div className="h-full w-full">
          {position ? (
            <MapContainer 
              center={position} 
              zoom={15} 
              style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
              className="leaflet-container"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              
              <MapController 
                onMapReady={handleMapReady}
                routingControl={routingControl}
                setRoutingControl={setRoutingControl}
              />
              
              {/* Current location marker */}
              <Marker 
                position={position}
                icon={MyLocation}
              >
                <Popup>Your Location</Popup>
              </Marker>

              {/* Charger markers */}
              {chargers.map((charger) => (
                <Marker 
                  key={charger.id} 
                  position={[charger.latitude, charger.longitude]}
                  icon={selectedChargerId === charger.id ? SelectedChargerLocation : ChargerLocation}
                  zIndexOffset={selectedChargerId === charger.id ? 1000 : 0}
                  eventHandlers={{
                    click: (e) => handleChargerClick(charger, e)
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <h4 className="font-semibold">{charger.name}</h4>
                      <p className="text-sm">{charger.address}</p>
                      <p className="text-sm">{charger.charger_type}</p>
                      <p className="text-sm">{charger.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Loading map...</p>
            </div>
          )}
        </div>
        <br/>

        {/* Nearby Chargers Table Section */}
        <div className="h-1/2 w-full">
          {position ? (
            <NearbyChargerTable 
              currentLatitude={position[0]} 
              currentLongitude={position[1]}
              onChargerClick={handleChargerClick}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Getting your location to find nearby chargers...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;