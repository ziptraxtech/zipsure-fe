import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import { debounce } from "lodash";

const API_URL = import.meta.env.VITE_API_URL;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pickupIcon = new L.DivIcon({
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
        <g transform="translate(4, 6)">
          <path 
            d="M9 13a1 1 0 0 0-1-1H5.061a1 1 0 0 1-.75-1.811l6.836-6.835a1.207 1.207 0 0 1 1.707 0l6.835 6.835a1 1 0 0 1-.75 1.811H16a1 1 0 0 0-1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" 
            fill="white"
          />
        </g>
      </svg>
    </div>
  `,
  className: 'pickup-marker',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -41]
});

const deliveryIcon = new L.DivIcon({
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
          fill="#f59e0b"
          stroke="#d97706"
          stroke-width="1"
        />
        <g transform="translate(4, 6)">
          <path 
            d="M15 11a1 1 0 0 0 1 1h2.939a1 1 0 0 1 .75 1.811l-6.835 6.836a1.207 1.207 0 0 1-1.707 0L4.31 13.81a1 1 0 0 1 .75-1.811H8a1 1 0 0 0 1-1V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1z" 
            fill="white"
          />
        </g>
      </svg>
    </div>
  `,
  className: 'delivery-marker',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -41]
});

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onJobAdded: (newJob?: any) => void;
}

const RoutingMachine: React.FC<{ from: [number, number]; to: [number, number] }> = React.memo(({ from, to }) => {
  const map = useMap();
  const routingControlRef = useRef<any>(null);
  
  useEffect(() => {
    if (!map || !from || !to) return;
    
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
      }
    }
    
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
      show: false,
    });
    
    routingControlRef.current = control;
    control.addTo(map);
    
    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
        }
        routingControlRef.current = null;
      }
    };
  }, [map, from?.[0], from?.[1], to?.[0], to?.[1]]);
  
  return null;
});

const AddJobModal: React.FC<AddJobModalProps> = ({ open, onClose, onJobAdded }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "", description: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupPin: "",
    deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryPin: "",
    pickupLongitude: "", pickupLatitude: "", deliveryLongitude: "", deliveryLatitude: "", scheduleTime: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<{ [key: string]: boolean }>({});
  
  const geocodingInProgress = useRef<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const geocodeAddress = useCallback(async (
    address: string, 
    city: string, 
    state: string, 
    pin: string,
    type: string
  ): Promise<{ lat: number; lng: number } | null> => {
    if (!address?.trim() || !city?.trim() || !state?.trim() || !pin?.trim()) return null;
    
    const geocodeKey = `${type}-${address}-${city}-${state}-${pin}`;
    
    if (abortControllers.current.has(type)) {
      abortControllers.current.get(type)?.abort();
    }
    
    const controller = new AbortController();
    abortControllers.current.set(type, controller);
    
    try {
      const fullAddress = `${address}, ${city}, ${state} ${pin}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=in`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'YourAppName/1.0 (your-email@example.com)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data?.[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    } catch (error: any) {
      if (error.name === 'AbortError') return null;
      console.error("Geocoding error:", error);
      return null;
    } finally {
      abortControllers.current.delete(type);
    }
  }, []);

  const debouncedGeocode = useCallback(
    debounce(async (type: 'pickup' | 'delivery', formData: any) => {
      const key = `${type}Address`;
      if (geocodingInProgress.current.has(type)) return;
      
      geocodingInProgress.current.add(type);
      setGeocodingLoading(true);
      
      try {
        const coords = await geocodeAddress(
          formData[`${type}Address`],
          formData[`${type}City`],
          formData[`${type}State`],
          formData[`${type}Pin`],
          type
        );
        
        if (coords) {
          setFormData(prev => ({ 
            ...prev, 
            [`${type}Latitude`]: coords.lat.toString(), 
            [`${type}Longitude`]: coords.lng.toString() 
          }));
        }
      } catch (error) {
        console.error(`Error geocoding ${type}:`, error);
      } finally {
        geocodingInProgress.current.delete(type);
        setGeocodingLoading(false);
      }
    }, 2000),
    [geocodeAddress]
  );

  const isComplete = useCallback((type: 'pickup' | 'delivery') => {
    const prefix = type === 'pickup' ? 'pickup' : 'delivery';
    return !!(formData[`${prefix}Address`]?.trim() && 
             formData[`${prefix}City`]?.trim() && 
             formData[`${prefix}State`]?.trim() && 
             formData[`${prefix}Pin`]?.trim());
  }, [formData.pickupAddress, formData.pickupCity, formData.pickupState, formData.pickupPin,
      formData.deliveryAddress, formData.deliveryCity, formData.deliveryState, formData.deliveryPin]);

  const routeCoordinates = useMemo(() => {
    if (formData.pickupLatitude && formData.pickupLongitude && 
        formData.deliveryLatitude && formData.deliveryLongitude) {
      return [
        [parseFloat(formData.pickupLatitude), parseFloat(formData.pickupLongitude)] as [number, number],
        [parseFloat(formData.deliveryLatitude), parseFloat(formData.deliveryLongitude)] as [number, number]
      ];
    }
    return null;
  }, [formData.pickupLatitude, formData.pickupLongitude, formData.deliveryLatitude, formData.deliveryLongitude]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.endsWith('Pin')) {
      if (value !== '' && !/^\d{0,6}$/.test(value)) return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldTouched[name]) {
      validateField(name, value);
    }
  }, [fieldTouched]);
  const validateField = useCallback((name: string, value: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      
      if (['title', 'description'].includes(name)) {
        if (!value.trim()) {
          newErrors[name] = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        } else if (value.trim().length < 5) {
          newErrors[name] = `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least 5 characters`;
        } else {
          delete newErrors[name];
        }
      } else if (name.endsWith('Pin')) {
        if (!value.trim()) {
          newErrors[name] = "PIN code is required";
        } else if (!/^\d{6}$/.test(value)) {
          newErrors[name] = "PIN must be 6 digits";
        } else {
          delete newErrors[name];
        }
      } else if (['pickupAddress', 'deliveryAddress', 'pickupCity', 'deliveryCity', 
                  'pickupState', 'deliveryState'].includes(name)) {
        if (!value.trim()) {
          newErrors[name] = "This field is required";
        } else {
          delete newErrors[name];
        }
      }
      
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setFieldTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, e.target.value);
  }, [validateField]);

  useEffect(() => {
    if (isComplete('pickup')) {
      debouncedGeocode('pickup', formData);
    } else {
      setFormData(prev => ({ ...prev, pickupLatitude: "", pickupLongitude: "" }));
    }
    
    if (isComplete('delivery')) {
      debouncedGeocode('delivery', formData);
    } else {
      setFormData(prev => ({ ...prev, deliveryLatitude: "", deliveryLongitude: "" }));
    }
  }, [
    formData.pickupAddress, formData.pickupCity, formData.pickupState, formData.pickupPin,
    formData.deliveryAddress, formData.deliveryCity, formData.deliveryState, formData.deliveryPin,
    debouncedGeocode, isComplete
  ]);

  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
      geocodingInProgress.current.clear();
      debouncedGeocode.cancel();
    };
  }, [debouncedGeocode]);

  const renderAddressSection = useCallback((type: 'pickup' | 'delivery') => {
    const isPickup = type === 'pickup';
    const color = isPickup ? 'green' : 'red';
    const complete = isComplete(type);
  
    const fields = [
      { name: 'Address', inputType: 'text' },
      { name: 'City', inputType: 'text' },
      { name: 'State', inputType: 'text' },
      { name: 'Pin', inputType: 'text' },
    ];
  
    return (
      <div className="space-y-2">
        <Label className={`block text-${color}-600 font-semibold`}>
          {isPickup ? 'Pickup' : 'Delivery'} Details (Point {isPickup ? 'A' : 'B'})
          {complete && " ✓"}
        </Label>
        {fields.map(({ name, inputType }) => {
          const fullFieldName = `${type}${name}` as keyof typeof formData;
          const error = errors[fullFieldName];
          const touched = fieldTouched[fullFieldName] || formData[fullFieldName];
  
          return (
            <div key={fullFieldName}>
              <Input
                placeholder={`${name}${name === 'Address' ? ' (e.g., Home / Building)' : ''} *`}
                name={fullFieldName}
                value={formData[fullFieldName] || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${complete ? `border-${color}-500` : ''} ${touched && error ? 'border-red-500' : ''}`}
                type={inputType}
                maxLength={name === 'Pin' ? 6 : undefined}
              />
              {touched && error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          );
        })}
        <p className="text-xs text-gray-500">Fill all fields to see Point {isPickup ? 'A' : 'B'} on map</p>
      </div>
    );
  }, [formData, errors, fieldTouched, handleChange, handleBlur, isComplete]);

  const handleSubmit = useCallback(async () => {
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
  }, [formData, toast, onJobAdded, onClose]);

  const resetForm = useCallback(() => {
    setFormData({
      title: "", description: "", pickupAddress: "", pickupCity: "", pickupState: "", pickupPin: "",
      deliveryAddress: "", deliveryCity: "", deliveryState: "", deliveryPin: "",
      pickupLongitude: "", pickupLatitude: "", deliveryLongitude: "", deliveryLatitude: "", scheduleTime: "",
    });
    setErrors({});
    setFieldTouched({});
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=in`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'YourAppName/1.0 (your-email@example.com)',
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-4xl">
        <DialogHeader><DialogTitle>Add New Job</DialogTitle></DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label className="mb-2 block">Job Title *</Label>
            <Input 
              name="title" 
              value={formData.title} 
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldTouched.title && errors.title ? 'border-red-500' : ''}
            />
            {fieldTouched.title && errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Job Description *</Label>
            <Input 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              onBlur={handleBlur}
              className={fieldTouched.description && errors.description ? 'border-red-500' : ''}
            />
            {fieldTouched.description && errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          {renderAddressSection('pickup')}
          {renderAddressSection('delivery')}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-lg font-semibold">Route Map</Label>
            {geocodingLoading && <span className="text-blue-500 text-sm">Locating address...</span>}
          </div>
          
          <MapContainer 
            center={[28.6139, 77.209]} 
            zoom={10} 
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            
            {isComplete('pickup') && formData.pickupLatitude && formData.pickupLongitude && (
              <Marker 
                position={[parseFloat(formData.pickupLatitude), parseFloat(formData.pickupLongitude)]} 
                icon={pickupIcon} 
                draggable
                eventHandlers={{ 
                  dragend: async (e) => {
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
                  }
                }}
              >
                <Popup>
                  <strong>Point A - Pickup Location (Green)</strong><br />
                  {formData.pickupAddress}<br />
                  {formData.pickupCity}, {formData.pickupState} {formData.pickupPin}
                </Popup>
              </Marker>
            )}

            {isComplete('delivery') && formData.deliveryLatitude && formData.deliveryLongitude && (
              <Marker 
                position={[parseFloat(formData.deliveryLatitude), parseFloat(formData.deliveryLongitude)]} 
                icon={deliveryIcon} 
                draggable
                eventHandlers={{ 
                  dragend: async (e) => {
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
                  }
                }}
              >
                <Popup>
                  <strong>Point B - Delivery Location (Red)</strong><br />
                  {formData.deliveryAddress}<br />
                  {formData.deliveryCity}, {formData.deliveryState} {formData.deliveryPin}
                </Popup>
              </Marker>
            )}

            {routeCoordinates && (
              <RoutingMachine from={routeCoordinates[0]} to={routeCoordinates[1]} />
            )}
          </MapContainer>
          
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>Green: Pickup (Starting Point)</p>
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Red: Delivery (Ending Point)</p>
            <p><span className="inline-block w-3 h-0.5 bg-blue-600 mr-2" style={{width: '12px'}}></span>Blue: Road Route</p>
            <p className="text-xs text-gray-500 mt-2">💡 Drag pins to update address fields automatically</p>
            {geocodingLoading && (
              <p className="text-xs text-blue-500 mt-1">🔍 Finding location on map...</p>
            )}
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