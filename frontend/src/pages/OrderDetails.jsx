import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  MapPin,
  CreditCard,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import ProductImage from "../components/common/ProductImage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Button from "../components/common/Button";

const statusSteps = [
  {
    key: "confirmed",
    label: "Order Confirmed",
    icon: CheckCircle2,
  },
  {
    key: "processing",
    label: "Processing",
    icon: Package,
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: CheckCircle2,
  },
];

const statusOrder = [
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status) => {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelling, setCancelling] = useState(false);

  const {
    data: order,
    isLoading: loading,
  } = useQuery({
    queryKey: ["order-details", id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data.data;
    },
    staleTime: 30 * 1000,
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to load order."
      );
      navigate("/orders");
    },
  });

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);

      const response = await api.patch(
        `/orders/${id}/cancel`
      );

      queryClient.setQueryData(["order-details", id], response.data.data);
      queryClient.invalidateQueries({ queryKey: ["orders-my"] });
      toast.success("Order cancelled successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to cancel order."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) return null;

  const orderId = order.id ?? order._id;
  const isCancelled = order.orderStatus === "cancelled";

  const currentStatusIndex =
    statusOrder.indexOf(order.orderStatus);

  const canCancel = [
    "pending",
    "confirmed",
    "processing",
  ].includes(order.orderStatus);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">

        {/* Back */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Order ID
              </p>

              <h1 className="text-2xl font-bold">
                #{(orderId ?? "").toUpperCase()}
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isCancelled
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {formatStatus(order.orderStatus)}
              </span>

              {canCancel && (
                <Button
                  variant="danger"
                  loading={cancelling}
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tracking */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">
            Order Tracking
          </h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 rounded-xl p-4">
              <XCircle className="w-6 h-6" />

              <div>
                <p className="font-semibold">
                  Order Cancelled
                </p>

                {order.cancelledAt && (
                  <p className="text-sm">
                    {formatDateTime(order.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {statusSteps.map((step) => {
                const Icon = step.icon;

                const stepIndex = statusOrder.indexOf(
                  step.key
                );

                const completed =
                  currentStatusIndex >= stepIndex;

                return (
                  <div
                    key={step.key}
                    className="flex items-start gap-4"
                  >
                    <div>
                      {completed ? (
                        <Icon className="w-6 h-6 text-black" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-medium ${
                          completed
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      {order.statusHistory
                        ?.filter(
                          (history) =>
                            history.status === step.key
                        )
                        .map((history, historyIndex) => (
                          <p
                            key={historyIndex}
                            className="text-sm text-gray-500 mt-1"
                          >
                            {history.note} •{" "}
                            {formatDateTime(
                              history.createdAt
                            )}
                          </p>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Items */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-5">
              Order Items
            </h2>

            <div className="space-y-5">
              {order.items.map((item) => (
                <div
                  key={`${orderId}-${item.product}`}
                  className="flex gap-4 border-b pb-5 last:border-b-0 last:pb-0"
                >
                  <ProductImage
                    image={item.image}
                    fallbackImage={item.currentImage}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-xl border"
                  />

                  <div className="flex-1">
                    <h3 className="font-medium">
                      {item.name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </p>

                    <p className="font-semibold mt-2">
                      ₹
                      {(
                        item.price * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">

            {/* Address */}
            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                <h2 className="font-semibold">
                  Delivery Address
                </h2>
              </div>

              <p className="font-medium">
                {order.shippingAddress.fullName}
              </p>

              <p className="text-sm text-gray-600 mt-2">
                {order.shippingAddress.addressLine1}
              </p>

              {order.shippingAddress.addressLine2 && (
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.addressLine2}
                </p>
              )}

              <p className="text-sm text-gray-600">
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}
              </p>

              <p className="text-sm text-gray-600">
                {order.shippingAddress.postalCode}
              </p>

              <p className="text-sm text-gray-600 mt-2">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5" />
                <h2 className="font-semibold">
                  Payment
                </h2>
              </div>

              <div className="flex justify-between text-sm">
                <span>Method</span>
                <span className="font-medium uppercase">
                  {order.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between text-sm mt-3">
                <span>Status</span>
                <span className="font-medium">
                  {formatStatus(order.paymentStatus)}
                </span>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-semibold mb-4">
                Price Summary
              </h2>

              <div className="flex justify-between text-sm mb-3">
                <span>Subtotal</span>
                <span>
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm mb-3">
                <span>Shipping</span>
                <span>
                  {order.shippingFee === 0
                    ? "Free"
                    : `₹${order.shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  ₹{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;