import React from "react";
import { X, Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner"; // for success/error notification

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

interface SubscriptionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onConfirm?: (planId: string) => void; // not used anymore but kept for compatibility
  isLoading?: boolean;
}

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): RazorpayInstance;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

const Confirmation: React.FC<SubscriptionConfirmationModalProps> = ({
  isOpen,
  onClose,
  plan,
  isLoading = false,
}) => {
  if (!isOpen || !plan) return null;

  // ✅ load Razorpay SDK script dynamically
  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (document.getElementById("razorpay-sdk")) return resolve(true);

      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ✅ Verify payment with backend
  const verifyPayment = async (paymentData: RazorpayResponse, orderData: { amount: number; orderId?: string; id?: string }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      const verifyRes = await axios.post(
        "http://localhost:3000/api/v1/payments/verify",
        {
          razorpayOrderId: paymentData.razorpay_order_id,
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpaySignature: paymentData.razorpay_signature,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!verifyRes.data?.success) {
        throw new Error(verifyRes.data?.message || "Payment verification failed");
      }

      return verifyRes.data;
    } catch (error: unknown) {
      console.error("Payment verification error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? String(error.response.data.message)
        : "Payment verification failed";
      throw new Error(errorMessage);
    }
  };

  // ✅ handle payment confirm
  const handleConfirm = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please log in.", {
        style: { backgroundColor: '#ef4444', color: 'white' }
      });
      return;
    }

    try {
      // Step 1: Create subscription with plan ID
      const subscriptionRes = await axios.post(`http://localhost:3000/api/v1/subscriptions`, {
        planId: plan.id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!subscriptionRes.data?.success) {
        throw new Error(subscriptionRes.data?.message || "Failed to create subscription");
      }

      const { id, amount } = subscriptionRes.data.data;

      // Step 2: Create payment order with subscription ID and amount
      const paymentRes = await axios.post(`http://localhost:3000/api/v1/payments/create-order`, {
        subscriptionId: id,
        amount: Number(amount) // Ensure amount is a number
      },
       {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!paymentRes.data?.success) {
        throw new Error(paymentRes.data?.message || "Failed to create payment order");
      }

      // Load Razorpay for payment processing
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Failed to load Razorpay. Please try again.", {
          style: { backgroundColor: '#ef4444', color: 'white' }
        });
        return;
      }

      const orderData = paymentRes.data.data;

    const options = {
      key: "rzp_live_4QS6rb1lpyfBXF", // 🔑 replace with manager's key later
      amount: orderData.amount * 100, // convert to paise
      currency: "INR",
      name: "Zipsure AI",
      description: `Subscription - ${plan.name}`,
      order_id: orderData.orderId || orderData.id,
      handler: async function (response: RazorpayResponse) {
        try {
          // Step 3: Verify payment with backend
          const verificationResult = await verifyPayment(response, orderData);
          
          if (verificationResult.success) {
            toast.success("Payment verified successfully! Subscription activated.", {
              style: { backgroundColor: '#22c55e', color: 'white' }
            });
            console.log("Payment verified:", verificationResult);
            onClose();
          } else {
            toast.error("Payment succeeded but verification failed. Please contact support.", {
              style: { backgroundColor: '#ef4444', color: 'white' }
            });
          }
        } catch (err: unknown) {
          console.error("Payment verification failed:", err);
          const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
          toast.error(`Payment verification failed: ${errorMessage}`, {
            style: { backgroundColor: '#ef4444', color: 'white' }
          });
        }
      },
      modal: {
        ondismiss: () => {
          toast.error("Payment was cancelled.", {
            style: { backgroundColor: '#ef4444', color: 'white' }
          });
        },
      },
      theme: {
        color: "#F97316",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
         } catch (err: unknown) {
       console.error("Error processing subscription:", err);
       const errorMessage = err instanceof Error 
         ? err.message 
         : err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
         ? String(err.response.data.message)
         : "An error occurred while processing your subscription.";
       toast.error(errorMessage, {
         style: { backgroundColor: '#ef4444', color: 'white' }
       });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Check className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Confirm Subscription Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please confirm that you want to {plan.isActive ? 'purchase' : 'subscribe to'} the following plan:
          </p>

          {/* Plan Details Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  ${parseFloat(plan.price).toFixed(2)}
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/mo</span>
                </p>
              </div>
              {plan.isActive && (
                <span className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {plan.description}
            </p>

            {/* Plan Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Max Vehicles:</span>
                <span className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-1" />
                  {plan.maxVehicles}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Max Users:</span>
                <span className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-1" />
                  {plan.maxUsers}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Billing Cycle:</span>
                <span className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-1" />
                  {plan.durationDays === 30 ? 'Monthly' : `${plan.durationDays} days`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>{plan.isActive ? 'Purchase' : 'Confirm Subscription'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
