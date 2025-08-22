import React, { useEffect, useState } from "react";
import axios from "axios";

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  model: string;
  make: string;
  year: number;
  color: string;
  status: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const GetAllVehicles: React.FC<Props> = ({ open, onClose }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem("token");
    setLoading(true);

    axios
      .get("http://localhost:3000/api/v1/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setVehicles(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-4xl p-6 relative">
        <h2 className="text-xl font-bold mb-4">All Vehicles</h2>
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        {loading ? (
          <p>Loading vehicles...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 ">Vehicle Number</th>
                  <th className="px-4 py-2 ">Type</th>
                  <th className="px-4 py-2 ">Model</th>
                  <th className="px-4 py-2 ">Year</th>
                  <th className="px-4 py-2 ">Color</th>
                  <th className="px-4 py-2 ">Status</th>
                  <th className="px-4 py-2 ">Created At</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="text-center border-b">
                    <td className="px-4 py-2 ">{v.vehicleNumber}</td>
                    <td className="px-4 py-2 ">{v.vehicleType}</td>
                    <td className="px-4 py-2 ">{v.model}</td>
                    <td className="px-4 py-2 ">{v.year}</td>
                    <td className="px-4 py-2 ">{v.color}</td>
                    <td className="px-4 py-2 ">{v.status}</td>
                    <td className="px-4 py-2 ">{new Date(v.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetAllVehicles;
