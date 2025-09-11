import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL;

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

interface Charger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  charger_type: string | null;
}

const MapComponent = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (error) => {
        console.error('Error fetching location:', error);
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
      } catch (err) {
        console.error('Error in fetchChargers:', err);
        setError(`Failed to load charger locations: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChargers();
  }, []);

  if (!position) {
    return <p>Getting your location...</p>;
  }

  if (loading) {
    return <p>Loading charger locations...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
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
          >
            <Popup>
              <div>
                <h4>{charger.name}</h4>
                <p>{charger.address}</p>
                {charger.charger_type && (
                  <p>Type: {charger.charger_type}</p>
                )}
                <p>Status: {charger.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
