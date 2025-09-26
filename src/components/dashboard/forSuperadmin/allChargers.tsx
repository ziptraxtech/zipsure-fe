import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ChargerIcon = new L.DivIcon({
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

interface Charger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'active' | 'inactive' | string;
  charger_type?: string | null;
  description?: string | null;
}

interface ChargerFormData {
  id?: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  status: 'active' | 'inactive';
  charger_type?: string;
}

const Chargers: React.FC = () => {
  const { toast } = useToast();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ChargerFormData>({
    name: '', address: '', latitude: '', longitude: '', status: 'active', charger_type: 'normal'
  });
  const [deleteCharger, setDeleteCharger] = useState<Charger | null>(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const fetchChargers = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API_URL}/api/v1/chargers`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`Failed to fetch chargers: ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChargers(data.data);
        if (!mapCenter && data.data.length > 0) {
          setMapCenter([data.data[0].latitude, data.data[0].longitude]);
        }
      } else {
        throw new Error('Invalid response');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load chargers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChargers();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: '', address: '', latitude: '', longitude: '', status: 'active', charger_type: 'normal' });
    setModalOpen(true);
  };

  const openEditModal = (charger: Charger) => {
    setIsEditing(true);
    setFormData({
      id: charger.id,
      name: charger.name || '',
      address: charger.address || '',
      latitude: String(charger.latitude ?? ''),
      longitude: String(charger.longitude ?? ''),
      status: (charger.status as 'active' | 'inactive') ?? 'active',
      charger_type: (charger.charger_type as string) || 'normal'
    });
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!token) return toast({ title: 'Error', description: 'Not authenticated', className: 'bg-red-500 text-white' });
    if (!deleteCharger) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/chargers/${deleteCharger.id}` , {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
      toast({ title: 'Deleted', description: 'Charger removed', className: 'bg-green-500 text-white' });
      setDeleteCharger(null);
      fetchChargers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Delete failed', className: 'bg-red-500 text-white' });
    }
  };

  const handleSave = async () => {
    if (!token) return toast({ title: 'Error', description: 'Not authenticated', className: 'bg-red-500 text-white' });

    // Basic validation
    if (!formData.name.trim() || !formData.address.trim() || !formData.latitude || !formData.longitude) {
      return toast({ title: 'Validation', description: 'Name, Address, Latitude, Longitude are required', className: 'bg-red-500 text-white' });
    }

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      status: formData.status,
      charger_type: formData.charger_type || null,
    };

    try {
      let res: Response;
      if (isEditing && formData.id) {
        res = await fetch(`${API_URL}/api/v1/chargers/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/api/v1/chargers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      toast({ title: isEditing ? 'Updated' : 'Created', description: `Charger ${isEditing ? 'updated' : 'created'} successfully`, className: 'bg-green-500 text-white' });
      setModalOpen(false);
      fetchChargers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Save failed', className: 'bg-red-500 text-white' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-success border-success">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-muted-foreground border-muted">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Chargers</h1>
        <Button onClick={openAddModal}>
        <Plus className="h-4 w-4 mr-2" />
        Add</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading chargers...</div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="w-full h-[50vh]">
            { (mapCenter || (chargers[0] && [chargers[0].latitude, chargers[0].longitude])) ? (
              <MapContainer 
                center={mapCenter || [chargers[0].latitude, chargers[0].longitude]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
                className="z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {chargers.map((c) => (
                  <Marker key={c.id} position={[c.latitude, c.longitude]} icon={ChargerIcon}>
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-sm">{c.address}</div>
                        <div className="text-xs">{c.charger_type || 'Standard'}</div>
                        <div className="text-xs">{getStatusBadge(c.status)}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full">No chargers to display on map</div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto max-h-[45vh] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Latitude</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Longitude</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chargers.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="text-gray-700 truncate" title={c.address}>{c.address}</div>
                      {c.charger_type ? (
                        <div className="text-xs text-gray-500">{c.charger_type}</div>
         
         ) : null}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-3">{c.latitude}</td>
                    <td className="px-4 py-3">{c.longitude}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(c)}>Edit</Button>
                      <Button color="primary" size="sm" onClick={() => setDeleteCharger(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {chargers.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>No chargers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Charger' : 'Add Charger'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2">
            <div>
              <Label className="mb-4 block">Name *</Label>
              <Input className="bg-gray-100" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-4 block">Description / Address *</Label>
              <Input className="bg-gray-100" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-4 block">Latitude *</Label>
                <Input className="bg-gray-100" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
              </div>
              <div>
                <Label className="mb-4 block">Longitude *</Label>
                <Input className="bg-gray-100" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-4 block">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as 'active' | 'inactive' })}
                >
                  <SelectTrigger className="bg-gray-100">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-4 block">Type</Label>
                <Select
                  value={formData.charger_type || 'normal'}
                  onValueChange={(val) => setFormData({ ...formData, charger_type: val as 'normal' | 'fast' | 'super_fast' })}
                >
                  <SelectTrigger className="bg-gray-100 capitalize">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Fast</SelectItem>
                    <SelectItem value="super_fast">Super Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setFormData({ name: '', address: '', latitude: '', longitude: '', status: 'active', charger_type: 'normal' })}
            >
              Clear
            </Button>
            <Button onClick={handleSave}>{isEditing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteCharger} onOpenChange={() => setDeleteCharger(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Do you really want to delete <span className="font-semibold">{deleteCharger?.name}</span>?
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteCharger(null)}>No</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chargers;