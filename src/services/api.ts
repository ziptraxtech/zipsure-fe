// src/services/api.ts
import axios from "axios";

const API_BASE = "http://localhost:3000"; // replace with your real backend URL later

export async function confirmSubscription(planId: string, paymentId: string) {
  // This is where your manager’s endpoint will be used
  const response = await axios.post(`${API_BASE}/b-1/subscription/plan`, {
    planId,
    paymentId,
  });

  return response.data;
}
