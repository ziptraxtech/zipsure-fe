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

const MyLocation = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const ChargerLocation = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
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
  return L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: true,
    show: true,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    showAlternatives: false,
    lineOptions: {
      styles: [{ color: '#3b82f6', opacity: 0.7, weight: 5 }]
    },
    createMarker: (i: number, wp: any, n: number) => {
      return L.marker(wp.latLng, {
        icon: i === 0 ? MyLocation : RouteIcon,
        draggable: false
      });
    }
  }).addTo(map);
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
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (error) => {
        console.error('Error fetching location:', error);
        setError('Failed to get your location. Please enable location services.');
      }
    );
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
    <div className="flex flex-col h-full w-full p-4 space-y-4">
      <div className="h-1/2 w-full rounded-lg overflow-hidden shadow relative z-0">
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
                  icon={ChargerLocation}
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
      </div>

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
  );
};

export default MapComponent;