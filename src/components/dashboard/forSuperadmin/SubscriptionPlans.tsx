import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DownloadCSV } from "./downloadcsv";

const API_URL = import.meta.env.VITE_API_URL;

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  maxVehicles: number;
  maxUsers: number;
  durationDays: number;
  isActive: boolean;
}

interface Payment {
  id: string;
  subscriptionId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amount: string;
  status: string;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    organizationId: string;
    planId: string;
    startDate: string;
    endDate: string;
    status: string;
    amount: string;
    paymentId: string | null;
    createdAt: string;
    updatedAt: string;
    organization?: {
      name: string;
    };
  };
}

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null); // for delete confirmation
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem("token");

  const fetchPlans = async () => {
    try {
      const url = `${API_URL}/api/v1/subscriptions/plans`;
      console.log('Fetching subscription plans from:', url);
      
      const res = await axios.get(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Subscription plans response status:', res.status);
      setPlans(res.data.data || []);
    } catch (err) {
      console.error("Error fetching plans", err);
      toast({ 
        title: "Error",
        description: "Failed to fetch subscription plans. Please try again.",
        className: "bg-red-500 text-white",
        duration: 5000 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const url = `${API_URL}/api/v1/payments/superadmin`;
      console.log('Fetching payments from:', url);
      
      const res = await axios.get(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Payments response status:', res.status);
      setPayments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching payments", err);
      toast({ 
        title: "Error",
        description: "Failed to fetch payments. Please try again.",
        className: "bg-red-500 text-white",
        duration: 5000 
      });
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchPayments();
  }, []);

  const handleSavePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      maxVehicles: Number(formData.get("maxVehicles")),
      maxUsers: Number(formData.get("maxUsers")),
      durationDays: Number(formData.get("durationDays")),
      isActive: true,
    };

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (editingPlan) {
        const url = `${API_URL}/api/v1/subscriptionPlans/${editingPlan.id}`;
        console.log('Updating plan at:', url);
        await axios.put(url, payload, { headers });
        toast({ 
          title: "Success", 
          description: "Plan updated successfully!", 
          className: "bg-green-500 text-white",
          duration: 5000 
        });
      } else {
        const url = `${API_URL}/api/v1/subscriptionPlans/plan/`;
        console.log('Creating new plan at:', url);
        await axios.post(url, payload, { headers });
        toast({ 
          title: "Success", 
          description: "Plan created successfully!", 
          className: "bg-green-500 text-white",
          duration: 5000 
        });
      }

      fetchPlans();
      setOpen(false);
      setEditingPlan(null);
    } catch (err) {
      console.error("Error saving plan", err);
      const errorMessage = err.response?.data?.message || "Failed to save plan. Please try again.";
      toast({ 
        title: "Error",
        description: errorMessage,
        className: "bg-red-500 text-white",
        duration: 5000 
      });
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlan) return;

    try {
      const url = `${API_URL}/api/v1/subscriptionPlans/${deletePlan.id}`;
      console.log('Deleting plan at:', url);
      
      await axios.delete(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Plan deleted successfully');
      
      toast({ 
        title: "Success",
        description: "Plan deleted successfully!",
        className: "bg-green-500 text-white",
        duration: 5000 
      });
      
      fetchPlans();
    } catch (err) {
      console.error("Error deleting plan", err);
      const errorMessage = err.response?.data?.message || "Failed to delete plan. Please try again.";
      toast({ 
        title: "Error",
        description: errorMessage,
        className: "bg-red-500 text-white",
        duration: 5000 
      });
    } finally {
      setDeletePlan(null);
    }
  };

  return (

    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206, 122, 122, 0.15)_0%,rgba(255,255,255,0)_70%] pointer-events-none"
        aria-hidden="true"
      />

    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Subscription Plans</h1>
        <Button
          onClick={() => {
            setEditingPlan(null);
            setOpen(true);
          }}
        >
          + Add Plan
        </Button>
      </div>

      {loading ? (
        <p>Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-4">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{plan.description}</p>
                <p className="text-lg font-bold mt-2">₹{plan.price}/mo</p>
                <p>Max Vehicles: {plan.maxVehicles}</p>
                <p>Max Users: {plan.maxUsers}</p>
                <p>Billing: {plan.durationDays} days</p>

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setEditingPlan(plan);
                      setOpen(true);
                    }}
                  >
                    Edit Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeletePlan(plan)}
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payments Table */}
      <Card className="shadow-sm border rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Payments</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <DownloadCSV 
              endpoint="payments"
              disabled={isDownloading || payments.length === 0}
              onDownloadStart={() => setIsDownloading(true)}
              onDownloadComplete={() => setIsDownloading(false)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p>Loading payments...</p>
          ) : payments.length === 0 ? (
            <p>No payments found.</p>
          ) : (
            <Table className="text-xs md:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Paid At</TableHead>
                  <TableHead className="hidden lg:table-cell">Razorpay Order ID</TableHead>
                  <TableHead className="hidden lg:table-cell">Razorpay Payment ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const orgName = p.subscription?.organization?.name || "-";
                  const paidAt = p.paidAt
                    ? new Date(p.paidAt).toLocaleString()
                    : <span className="inline-flex items-center justify-center rounded-full border-red-500 border px-2.5 py-0.5 text-red-700">
                        <span className="whitespace-nowrap text-sm">Not Paid Yet</span>
                      </span>;
                  const amount = `${p.currency} ${p.amount}`;
                  const paymentStatus = p.status === 'completed' 
                    ? <span className="inline-flex items-center justify-center rounded-full border-green-500 border px-2.5 py-0.5 text-green-700">
                        <span className="whitespace-nowrap text-sm">Completed</span>
                      </span>
                    : p.status === 'pending'
                    ? <span className="inline-flex items-center justify-center rounded-full border-amber-500 border px-2.5 py-0.5 text-amber-700">
                        <span className="whitespace-nowrap text-sm">Pending</span>
                      </span>
                    : p.status === 'failed'
                    ? <span className="inline-flex items-center justify-center rounded-full border-red-500 border px-2.5 py-0.5 text-red-700">
                        <span className="whitespace-nowrap text-sm">Failed</span>
                      </span>
                    : <span className="inline-flex items-center justify-center rounded-full border-gray-500 border px-2.5 py-0.5 text-gray-700">
                        <span className="whitespace-nowrap text-sm">Refunded</span>
                      </span>;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium whitespace-normal break-words max-w-[180px] md:max-w-none">{orgName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{paymentStatus}</TableCell>
                      <TableCell className="whitespace-normal break-words">{amount}</TableCell>
                      <TableCell className="hidden md:table-cell whitespace-normal break-words">{paidAt}</TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-normal break-all">{p.razorpayOrderId || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-normal break-all">
                        {p.razorpayPaymentId || 
                          <span className="inline-flex items-center justify-center rounded-full border-red-500 border px-2.5 py-0.5 text-red-700">
                            <span className="whitespace-nowrap text-sm">Not Paid Yet</span>
                          </span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Plan" : "Create Plan"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePlan} id="plan-form" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingPlan?.name || ""}
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingPlan?.description || ""}
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  name="price"
                  defaultValue={editingPlan?.price || ""}
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxVehicles">Max Vehicles</Label>
                <Input
                  id="maxVehicles"
                  type="number"
                  name="maxVehicles"
                  defaultValue={editingPlan?.maxVehicles || ""}
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  name="maxUsers"
                  defaultValue={editingPlan?.maxUsers || ""}
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duration Days</Label>
                <Input
                  id="durationDays"
                  type="number"
                  name="durationDays"
                  defaultValue={editingPlan?.durationDays || ""}
                  required
                  className="bg-gray-100"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const form = document.getElementById('plan-form') as HTMLFormElement;
                  if (form) {
                    form.reset();
                  }
                  setEditingPlan(null);
                }}
              >
                Clear
              </Button>
              <Button type="submit">
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletePlan} onOpenChange={() => setDeletePlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Do you really want to delete{" "}
            <span className="font-bold">{deletePlan?.name}</span> plan?
          </p>
          <DialogFooter className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeletePlan(null)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default SubscriptionPlans;
