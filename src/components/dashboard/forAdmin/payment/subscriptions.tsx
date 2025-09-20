import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SubscriptionConfirmationModal from './confirmation';

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

export interface SubscriptionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onConfirm: (planId: string) => void;
  isLoading: boolean;
}

const Subscriptions = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPlans = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/v1/subscriptions/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setPlans(res.data.data);
      } else {
        setError("Failed to load subscription plans. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching subscription plans:", err);
      setError("An error occurred while fetching subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleConfirmSubscription = async (planId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in.");
      return;
    }

    setIsProcessing(true);
    try {
      const subscriptionRes = await axios.post(`${API_URL}/api/v1/subscriptions`, {
        planId: planId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!subscriptionRes.data?.success) {
        throw new Error(subscriptionRes.data?.message || "Failed to create subscription");
      }

      const { subscriptionId, amount } = subscriptionRes.data.data;

      const paymentRes = await axios.post(`${API_URL}/api/v1/payments/create-order`, {
        subscriptionId: subscriptionId,
        amount: Number(amount)
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!paymentRes.data?.success) {
        throw new Error(paymentRes.data?.message || "Failed to create payment order");
      }

      alert('Subscription and payment order created successfully!');
      console.log('Payment order data:', paymentRes.data.data);
      
      await fetchPlans();
      handleCloseModal();
    } catch (err: unknown) {
      console.error("Error processing subscription:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
        ? String(err.response.data.message)
        : "An error occurred while processing your subscription.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (

    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Gradient overlay */}
      <div 
        className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(206, 122, 122, 0.15)_0%,rgba(255,255,255,0)_70%] pointer-events-none"
        aria-hidden="true"
      />

    <div className="p-6 space-y-6 items-center">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-4">Subscription Plans</h1>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.length > 0 ? (
          plans.map((plan) => (
            <Card 
              key={plan.id} 
              className="border hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-3xl font-bold mt-2">
                    ₹{parseFloat(plan.price).toFixed(2)}
                      <span className="text-sm text-muted-foreground font-normal">/mo</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Max Vehicles:</span>
                    <span className="font-medium">{plan.maxVehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Users:</span>
                    <span className="font-medium">{plan.maxUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing Cycle:</span>
                    <span className="font-medium">
                      {plan.durationDays === 30 ? 'Monthly' : `${plan.durationDays} days`}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handlePlanClick(plan)}
                  className="mt-6 w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  {plan.isActive ? 'Buy Plan' : 'Get Started'}
                </button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-muted-foreground">No subscription plans available at the moment.</p>
          </div>
        )}
      </div>

      <SubscriptionConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plan={selectedPlan}
        onConfirm={handleConfirmSubscription}
        isLoading={isProcessing}
      />
    </div>
    </div>
  );
};

export default Subscriptions;