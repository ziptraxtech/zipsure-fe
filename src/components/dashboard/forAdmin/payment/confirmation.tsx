import React from "react";
import { X, Check, AlertCircle } from "lucide-react";
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
    Razorpay: any;
  }
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

  // ✅ handle payment confirm
  const handleConfirm = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error("Failed to load Razorpay. Please try again.");
      return;
    }

    // Normally you call backend to create order → for now mocked
    const orderData = {
      id: "order_mock_123",
      amount: parseFloat(plan.price) * 100, // convert to paise
      currency: "INR",
    };

    const options = {
      key: "rzp_test_xxxxxxxxx", // 🔑 replace with manager’s key later
      amount: orderData.amount,
      currency: orderData.currency,
      name: "FleetTops",
      description: `Subscription - ${plan.name}`,
      order_id: orderData.id,
      handler: async function (response: any) {
        try {
          // ✅ Call backend API after successful payment
          const apiRes = await axios.post(
            "http://localhost:3000/api/v1/subscriptions/plans",
            {
              planId: plan.id,
              paymentId: response.razorpay_payment_id,
            }
          );

          toast.success("Payment successful! Subscription activated.");
          console.log("Backend API Response:", apiRes.data);
          onClose();
        } catch (err) {
          console.error(err);
          toast.error("Payment succeeded but subscription activation failed.");
        }
      },
      modal: {
        ondismiss: () => {
          toast.error("Payment was cancelled.");
        },
      },
      theme: {
        color: "#F97316",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
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
            <AlertCircle className="w-6 h-6 text-orange-500" />
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
