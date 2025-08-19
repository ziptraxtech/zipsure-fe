// src/hooks/usePayment.ts
import { useState } from "react";
import axios from "axios";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function usePayment() {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve(true);

      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const initiatePayment = async (
    planId: string,
    amount: number,
    onSuccess: (paymentId: string) => void,
    onFailure: (error: any) => void
  ) => {
    setLoading(true);

    const res = await loadRazorpayScript();
    if (!res) {
      onFailure("Razorpay SDK failed to load");
      setLoading(false);
      return;
    }

    // Normally, you'd call backend to create order. For now mocking.
    const orderData = {
      id: "order_mock_123",
      amount: amount * 100, // in paise
      currency: "INR",
    };

    const options = {
      key: "rzp_test_xxxxxxxxx", // replace with manager’s key later
      amount: orderData.amount,
      currency: orderData.currency,
      name: "FleetTops",
      description: "Subscription Purchase",
      order_id: orderData.id,
      handler: function (response: any) {
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          onFailure("Payment Cancelled");
        },
      },
      theme: {
        color: "#F97316",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setLoading(false);
  };

  return { initiatePayment, loading };
}
