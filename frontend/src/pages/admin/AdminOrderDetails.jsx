import { useEffect, useState } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import ProductImage from "../../components/common/ProductImage";
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const formatStatus = (status) => {
  if (typeof status !== "string" || !status.trim()) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/admin/orders/${id}`);
        const orderData =
          response.data?.data?.order ?? response.data?.data;

        setOrder(orderData);
        setSelectedStatus(orderData?.orderStatus || "");
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load order"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    if (selectedStatus === order.orderStatus) {
      toast.error("Please select a different status");
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await api.patch(
        `/admin/orders/${id}/status`,
        {
          status: selectedStatus,
          note: statusNote,
        }
      );

      setOrder(response.data?.data?.order ?? response.data?.data);
      setStatusNote("");

      toast.success("Order status updated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update order status"
      );

      setSelectedStatus(order.orderStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <Package
          size={45}
          className="mx-auto mb-3 text-gray-300"
        />

        <h2 className="text-lg font-semibold">
          Order not found
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/orders")}
          className="rounded-lg border border-gray-300 bg-white p-2.5 hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order._id?.slice(-8).toUpperCase()}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* CUSTOMER */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          Customer
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">
              Name
            </p>

            <p className="mt-1 font-medium">
              {order.user?.name || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Email
            </p>

            <p className="mt-1 font-medium">
              {order.user?.email || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Phone
            </p>

            <p className="mt-1 font-medium">
              {order.user?.phone || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          Order Items
        </h2>

        <div className="mt-4 divide-y divide-gray-100">
          {order.items?.map((item, index) => (
            <div
              key={`${item.product}-${index}`}
              className="flex items-center gap-4 py-4"
            >
              <ProductImage
                image={item.image}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-lg"
              />

              <div className="flex-1">
                <p className="font-medium">
                  {item.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
              </div>

              <p className="font-semibold">
                {formatCurrency(
                  item.price * item.quantity
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          Order Summary
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">
              Subtotal
            </span>

            <span>
              {formatCurrency(order.subtotal)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">
              Shipping
            </span>

            <span>
              {formatCurrency(order.shippingFee)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">
              Discount
            </span>

            <span>
              -{formatCurrency(order.discount || 0)}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>

              <span>
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS MANAGEMENT */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={20} />

          <h2 className="text-lg font-semibold">
            Order Status
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">

          {/* CURRENT STATUS */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Current Status
            </label>

            <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium">
              {formatStatus(order.orderStatus)}
            </div>
          </div>

          {/* NEW STATUS */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Update Status
            </label>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
              disabled={
                updatingStatus ||
                order.orderStatus === "cancelled"
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
            >
              {STATUS_OPTIONS.map((item) => (
                <option
                  key={item}
                  value={item}
                  disabled={
                    order.orderStatus === "cancelled" &&
                    item !== "cancelled"
                  }
                >
                  {formatStatus(item)}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* NOTE */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status Note
          </label>

          <textarea
            value={statusNote}
            onChange={(event) =>
              setStatusNote(event.target.value)
            }
            rows={3}
            maxLength={500}
            placeholder="Add a note about this status update..."
            disabled={updatingStatus}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {statusNote.length}/500
          </p>
        </div>

        {/* UPDATE BUTTON */}
        <button
          onClick={handleStatusUpdate}
          disabled={
            updatingStatus ||
            selectedStatus === order.orderStatus ||
            order.orderStatus === "cancelled"
          }
          className="mt-4 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {updatingStatus
            ? "Updating..."
            : "Update Order Status"}
        </button>

        {order.orderStatus === "cancelled" && (
          <p className="mt-3 text-sm text-red-600">
            This order has been cancelled and cannot be reactivated.
          </p>
        )}
      </div>

      {/* STATUS HISTORY */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={20} />

          <h2 className="text-lg font-semibold">
            Status History
          </h2>
        </div>

        <div className="mt-6 space-y-6">
          {order.statusHistory?.length > 0 ? (
            [...order.statusHistory]
              .reverse()
              .map((history, index) => (
                <div
                  key={`${history.status}-${history.createdAt}-${index}`}
                  className="relative flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                      {history.status === "delivered" ? (
                        <CheckCircle
                          size={18}
                          className="text-green-600"
                        />
                      ) : history.status === "cancelled" ? (
                        <XCircle
                          size={18}
                          className="text-red-600"
                        />
                      ) : history.status === "shipped" ||
                        history.status === "out_for_delivery" ? (
                        <Truck
                          size={18}
                          className="text-blue-600"
                        />
                      ) : (
                        <Package size={18} />
                      )}
                    </div>

                    {index <
                      order.statusHistory.length - 1 && (
                      <div className="mt-2 h-full min-h-8 w-px bg-gray-200" />
                    )}
                  </div>

                  <div className="pb-4">
                    <p className="font-semibold text-gray-900">
                      {formatStatus(history.status)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(
                        history.createdAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {history.note && (
                      <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                        {history.note}
                      </p>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <p className="text-sm text-gray-500">
              No status history available.
            </p>
          )}
        </div>
      </div>



    </div>
  );
};

export default AdminOrderDetails;