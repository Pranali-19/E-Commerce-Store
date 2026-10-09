import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ChevronRight,
  ShoppingBag,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import ProductImage from "../components/common/ProductImage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Button from "../components/common/Button";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClass = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "shipped":
    case "out_for_delivery":
      return "bg-blue-100 text-blue-700";

    case "processing":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Orders = () => {
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ["orders-my"],
    queryFn: async () => {
      const response = await api.get("/orders/my");
      return response.data.data || [];
    },
    staleTime: 30 * 1000,
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to load orders."
      );
    },
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
      <Link
        to="/account"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Orders
          </h1>

          <p className="text-gray-500 mt-2">
            View and track your orders
          </p>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <ShoppingBag className="w-14 h-14 mx-auto text-gray-400" />

            <h2 className="text-xl font-semibold mt-5">
              No orders yet
            </h2>

            <p className="text-gray-500 mt-2 mb-6">
              Your placed orders will appear here.
            </p>

            <Link to="/shop">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const orderId = order._id ?? order.id;

              return (
                <div
                key={orderId}
                className="bg-white rounded-2xl border shadow-sm p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      {/* <Package className="w-6 h-6 text-gray-700" /> */}
                        <div className="flex gap-3 ">
                          {order.items.slice(0, 4).map((item) => (
                            <div
                              key={`${orderId}-${item.product}`}
                              className="shrink-0"
                            >
                              <ProductImage
                                image={item.image}
                                fallbackImage={item.currentImage}
                                alt={item.name}
                                className="h-16 w-16 shrink-0 rounded-lg border"
                              />
                            </div>
                          ))}

                          {order.items.length > 4 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                      </div>

                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Order #{orderId?.slice(-8).toUpperCase()}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </span>

                        <span>
                          {order.items.length}{" "}
                          {order.items.length === 1
                            ? "item"
                            : "items"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <span
                      className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                        order.orderStatus
                      )}`}
                    >
                      {formatStatus(order.orderStatus)}
                    </span>

                    <p className="font-bold text-lg">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Product Preview */}
                {/* <div className="border-t mt-5 pt-5">
                  <div className="flex gap-3 overflow-x-auto">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={`${orderId}-${item.product}`}
                        className="shrink-0"
                      >
                        <ProductImage
                          image={item.image}
                          fallbackImage={item.currentImage}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-lg border"
                        />
                      </div>
                    ))}

                    {order.items.length > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div> */}

                {/* Actions */}
                <div className="border-t mt-8 pt-5 flex justify-end">
                  <Link
                    to={`/orders/${orderId}`}
                    className="inline-flex items-center gap-2 font-medium text-black hover:underline"
                  >
                    View Order
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;