import React from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentStatusProps {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  message?: string;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  paidAt?: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  message,
  paymentId,
  orderId,
  amount,
  currency = 'INR',
  paidAt
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'refunded':
        return <AlertCircle className="w-8 h-8 text-orange-500" />;
      default:
        return <AlertCircle className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'refunded':
        return 'Payment Refunded';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        <CardTitle className="text-xl">{getStatusText()}</CardTitle>
        {message && (
          <p className="text-sm text-gray-600 mt-2">{message}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge className={`w-full justify-center py-2 ${getStatusColor()}`}>
          {status.toUpperCase()}
        </Badge>
        
        {paymentId && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment ID:</span>
            <span className="font-mono text-gray-900">{paymentId}</span>
          </div>
        )}
        
        {orderId && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-mono text-gray-900">{orderId}</span>
          </div>
        )}
        
        {amount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-gray-900">
              {currency} {amount.toFixed(2)}
            </span>
          </div>
        )}
        
        {paidAt && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Paid At:</span>
            <span className="text-gray-900">
              {new Date(paidAt).toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatus;
