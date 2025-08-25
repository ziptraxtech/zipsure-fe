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
import { Trash2 } from "lucide-react"; // delete icon
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const { toast } = useToast();

  const token = localStorage.getItem("token");

  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/v1/subscriptions/plans",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPlans(res.data.data || []);
    } catch (err) {
      console.error("Error fetching plans", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:3000/api/v1/payments/superadmin",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPayments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching payments", err);
      toast({ title: "Error fetching payments", variant: "destructive" });
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
      if (editingPlan) {
        await axios.put(
          `http://localhost:3000/api/v1/subscriptionPlans/${editingPlan.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: "Plan updated successfully!" });
      } else {
        await axios.post(
          "http://localhost:3000/api/v1/subscriptionPlans/plan/",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: "Plan created successfully!" });
      }

      fetchPlans();
      setOpen(false);
      setEditingPlan(null);
    } catch (err) {
      console.error("Error saving plan", err);
      toast({ title: "Error saving plan", variant: "destructive" });
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlan) return;

    try {
      await axios.delete(
        `http://localhost:3000/api/v1/subscriptionPlans/${deletePlan.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Plan deleted successfully!" });
      fetchPlans();
    } catch (err) {
      console.error("Error deleting plan", err);
      toast({ title: "Error deleting plan", variant: "destructive" });
    } finally {
      setDeletePlan(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Subscription Plans</h1>
        <Button
          onClick={() => {
            setEditingPlan(null);
            setOpen(true);
          }}
        >
          + Add New Plan
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
                <p className="text-lg font-bold mt-2">${plan.price}/mo</p>
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
      <Card className="">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const orgName = p.subscription?.organization?.name || "-";
                  const paidAt = p.paidAt
                    ? new Date(p.paidAt).toLocaleString()
                    : "-";
                  const amount = `${p.currency} ${p.amount}`;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium whitespace-normal break-words max-w-[180px] md:max-w-none">{orgName}</TableCell>
                      <TableCell className="capitalize whitespace-normal break-words">{p.status}</TableCell>
                      <TableCell className="whitespace-normal break-words">{amount}</TableCell>
                      <TableCell className="hidden md:table-cell whitespace-normal break-words">{paidAt}</TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-normal break-all">{p.razorpayOrderId || "-"}</TableCell>
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

          <form onSubmit={handleSavePlan} className="space-y-4">
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
  );
};

export default SubscriptionPlans;
