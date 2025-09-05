import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";

const API_URL = import.meta.env.VITE_API_URL;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: (newJob?: any) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ open, onClose, onJobAdded }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "", description: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupPin: "",
    deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryPin: "",
    pickupLongitude: "", pickupLatitude: "", deliveryLongitude: "", deliveryLatitude: "", scheduleTime: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  const geocodeAddress = async (address: string, city: string, state: string, pin: string) => {
    if (!address || !city || !state || !pin) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address}, ${city}, ${state} ${pin}`)}&limit=1`
      );
      const data = await response.json();
      return data?.[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const addr = data?.address || {};
      const houseNumber = addr.house_number ? `${addr.house_number} ` : "";
      const road = addr.road || "";
      const suburb = addr.suburb || addr.neighbourhood || "";
      const composedAddress = (houseNumber + road).trim() || data?.display_name || "";
      const city = addr.city || addr.town || addr.village || suburb || "";
      const state = addr.state || addr.region || "";
      const pin = addr.postcode || "";
      return { address: composedAddress, city, state, pin };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return { address: "", city: "", state: "", pin: "" };
    }
  };

  const isComplete = (type: 'pickup' | 'delivery') => {
    const prefix = type === 'pickup' ? 'pickup' : 'delivery';
    return formData[`${prefix}Address`]?.trim() && formData[`${prefix}City`]?.trim() && 
           formData[`${prefix}State`]?.trim() && formData[`${prefix}Pin`]?.trim();
  };

  const RoutingMachine: React.FC<{ from: [number, number]; to: [number, number] }> = ({ from, to }) => {
    const map = useMap();
    useEffect(() => {
      if (!map || !from || !to) return;
      const control = L.Routing.control({
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        lineOptions: { 
          styles: [{ color: "blue", weight: 4, opacity: 0.7 }], 
          extendToWaypoints: true, 
          missingRouteTolerance: 0 
        },
        addWaypoints: false,
        routeWhileDragging: false,
        createMarker: () => null,
      }).addTo(map);
      return () => {
        map.removeControl(control);
      };
    }, [map, from, to]);
    return null;
  };
  useEffect(() => {
    const geocodeAndUpdate = async (type: 'pickup' | 'delivery') => {
      if (!isComplete(type)) {
        setFormData(prev => ({ ...prev, [`${type}Latitude`]: "", [`${type}Longitude`]: "" }));
        return;
      }
      
      setGeocodingLoading(true);
      const coords = await geocodeAddress(
        formData[`${type}Address`], formData[`${type}City`], 
        formData[`${type}State`], formData[`${type}Pin`]
      );
      
      if (coords) {
        setFormData(prev => ({ ...prev, [`${type}Latitude`]: coords.lat.toString(), [`${type}Longitude`]: coords.lng.toString() }));
      } else {
        toast({ title: "Geocoding Error", description: `Could not find ${type} location. Please check the address.`, className: "bg-yellow-500 text-white" });
      }
      setGeocodingLoading(false);
    };

    geocodeAndUpdate('pickup');
    geocodeAndUpdate('delivery');
  }, [formData.pickupAddress, formData.pickupCity, formData.pickupState, formData.pickupPin,
      formData.deliveryAddress, formData.deliveryCity, formData.deliveryState, formData.deliveryPin]);

  useEffect(() => {
    if (formData.pickupLatitude && formData.pickupLongitude && formData.deliveryLatitude && formData.deliveryLongitude) {
      setRouteCoordinates([
        [parseFloat(formData.pickupLatitude), parseFloat(formData.pickupLongitude)],
        [parseFloat(formData.deliveryLatitude), parseFloat(formData.deliveryLongitude)]
      ]);
    } else {
      setRouteCoordinates([]);
    }
  }, [formData.pickupLatitude, formData.pickupLongitude, formData.deliveryLatitude, formData.deliveryLongitude]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim()) newErrors.description = "Job description is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({ title: "Validation Error", description: "Please fix errors before submitting", className: "bg-red-500 text-white" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Not authenticated", className: "bg-red-500 text-white" });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/v1/jobs`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201 || response.status === 200) {
        toast({ title: "Success", description: "Job created successfully", className: "bg-green-500 text-white" });
        onJobAdded(response.data);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create job", className: "bg-red-500 text-white" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "", description: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupPin: "",
      deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryPin: "",
      pickupLongitude: "", pickupLatitude: "", deliveryLongitude: "", deliveryLatitude: "", scheduleTime: "",
    });
    setRouteCoordinates([]);
  };

  const renderAddressSection = (type: 'pickup' | 'delivery') => {
    const isPickup = type === 'pickup';
    const color = isPickup ? 'green' : 'red';
    const complete = isComplete(type);
    
    return (
      <div className="space-y-2">
        <Label className={`block text-${color}-600 font-semibold`}>
          {isPickup ? 'Pickup' : 'Delivery'} Details (Point {isPickup ? 'A' : 'B'})
          {complete && " ✓"}
        </Label>
        {['Address', 'City', 'State', 'Pin'].map(field => (
          <Input key={field}
            placeholder={`${field === 'Address' ? 'Home / Address / Building' : field}${field !== 'Address' ? '' : ''} *`}
            name={`${type}${field}`}
            value={formData[`${type}${field}`]}
            onChange={handleChange}
            className={complete ? `border-${color}-500` : ""}
          />
        ))}
        <p className="text-xs text-gray-500">Fill all fields to see Point {isPickup ? 'A' : 'B'} on map</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-4xl">
        <DialogHeader><DialogTitle>Add New Job</DialogTitle></DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label className="mb-2 block">Job Title</Label>
            <Input name="title" value={formData.title} onChange={handleChange} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Job Description</Label>
            <Input name="description" value={formData.description} onChange={handleChange} />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          {renderAddressSection('pickup')}
          {renderAddressSection('delivery')}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-lg font-semibold">Route Map</Label>
            {geocodingLoading && <span className="text-blue-500 text-sm">Locating address...</span>}
          </div>
          
          <MapContainer center={[28.6139, 77.209]} zoom={10} style={{ height: "400px", width: "100%" }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {isComplete('pickup') && formData.pickupLatitude && formData.pickupLongitude && (
              <Marker position={[parseFloat(formData.pickupLatitude), parseFloat(formData.pickupLongitude)]} icon={pickupIcon} draggable
                eventHandlers={{ dragend: async (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  setFormData(prev => ({ ...prev, pickupLatitude: lat.toString(), pickupLongitude: lng.toString() }));
                  const details = await reverseGeocode(lat, lng);
                  setFormData(prev => ({
                    ...prev,
                    pickupAddress: details.address || prev.pickupAddress,
                    pickupCity: details.city || prev.pickupCity,
                    pickupState: details.state || prev.pickupState,
                    pickupPin: details.pin || prev.pickupPin,
                  }));
                }}}>
                <Popup><strong>Point A - Pickup Location (Green)</strong><br />{formData.pickupAddress}<br />{formData.pickupCity}, {formData.pickupState} {formData.pickupPin}</Popup>
              </Marker>
            )}

            {isComplete('delivery') && formData.deliveryLatitude && formData.deliveryLongitude && (
              <Marker position={[parseFloat(formData.deliveryLatitude), parseFloat(formData.deliveryLongitude)]} icon={deliveryIcon} draggable
                eventHandlers={{ dragend: async (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  setFormData(prev => ({ ...prev, deliveryLatitude: lat.toString(), deliveryLongitude: lng.toString() }));
                  const details = await reverseGeocode(lat, lng);
                  setFormData(prev => ({
                    ...prev,
                    deliveryAddress: details.address || prev.deliveryAddress,
                    deliveryCity: details.city || prev.deliveryCity,
                    deliveryState: details.state || prev.deliveryState,
                    deliveryPin: details.pin || prev.deliveryPin,
                  }));
                }}}>
                <Popup><strong>Point B - Delivery Location (Red)</strong><br />{formData.deliveryAddress}<br />{formData.deliveryCity}, {formData.deliveryState} {formData.deliveryPin}</Popup>
              </Marker>
            )}

            {routeCoordinates.length === 2 && (
              <RoutingMachine from={routeCoordinates[0]} to={routeCoordinates[1]} />
            )}
          </MapContainer>
          
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>Green: Pickup (Starting Point)</p>
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Red: Delivery (Ending Point)</p>
            <p><span className="inline-block w-3 h-0.5 bg-blue-600 mr-2" style={{width: '12px'}}></span>Blue: Road Route</p>
            <p className="text-xs text-gray-500 mt-2">💡 Drag pins to update address fields automatically</p>
          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Schedule Date & Time</Label>
          <Input 
            type="datetime-local" 
            name="scheduleTime" 
            value={formData.scheduleTime} 
            onChange={handleChange} 
            className="w-1/1.5 cursor-pointer" 
            onClick={(e) => e.currentTarget.showPicker?.()}
          />
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={resetForm}>Clear All</Button>
          <Button onClick={handleSubmit} disabled={loading || geocodingLoading}>
            {loading ? "Adding..." : "Add Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;