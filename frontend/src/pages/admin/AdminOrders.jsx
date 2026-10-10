import { useEffect, useState } from "react";
import { Eye, Search, RefreshCw, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const PAYMENT_OPTIONS = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

const formatStatus = (status) => {
  const normalized = String(status ?? "pending");

  return normalized
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getOrderId = (order, index) => {
  return order?._id || order?.id || `order-${index}`;
};

const getOrderCode = (order, index) => {
  const id = getOrderId(order, index);
  return typeof id === "string" && id ? id.slice(-8).toUpperCase() : "N/A";
};

const getStatusClasses = (status) => {
  const classes = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
};

const getPaymentClasses = (status) => {
  const classes = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-purple-100 text-purple-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (paymentStatus) {
        params.append("paymentStatus", paymentStatus);
      }

      params.append("page", page);
      params.append("limit", 10);

      const response = await api.get(
        `/admin/orders?${params.toString()}`
      );

      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, paymentStatus]);

  const handleSearch = (event) => {
    event.preventDefault();

    if (page !== 1) {
      setPage(1);
    } else {
      fetchOrders();
    }
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handlePaymentChange = (event) => {
    setPaymentStatus(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setPage(1);
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage and track customer orders
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">

          {/* SEARCH */}
          <form
            onSubmit={handleSearch}
            className="relative lg:col-span-2"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer or order ID..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
          </form>

          {/* STATUS */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            <option value="">All Order Status</option>

            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>

          {/* PAYMENT */}
          <select
            value={paymentStatus}
            onChange={handlePaymentChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            <option value="">All Payment Status</option>

            {PAYMENT_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>
        </div>

        {(search || status || paymentStatus) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-gray-600 hover:text-black"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ORDER COUNT */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {pagination.total}{" "}
          {pagination.total === 1 ? "order" : "orders"} found
        </p>
      </div>

      {/* ORDERS */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
            <Package
              size={42}
              className="mb-3 text-gray-300"
            />

            <h3 className="font-semibold text-gray-900">
              No orders found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {orders.map((order, index) => {
                    const orderId = getOrderId(order, index);

                    return (
                      <tr
                        key={orderId}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              #{getOrderCode(order, index)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {order.items?.length || 0} item
                              {order.items?.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {order.user?.name || "Unknown"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {order.user?.email || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPaymentClasses(
                              order.paymentStatus
                            )}`}
                          >
                            {formatStatus(order.paymentStatus)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                              order.orderStatus
                            )}`}
                          >
                            {formatStatus(order.orderStatus)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/orders/${orderId}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-900 hover:text-white"
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="divide-y divide-gray-200 lg:hidden">
              {orders.map((order, index) => {
                const orderId = getOrderId(order, index);

                return (
                  <div key={orderId} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          #{getOrderCode(order, index)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          order.orderStatus
                        )}`}
                      >
                        {formatStatus(order.orderStatus)}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="font-medium text-gray-900">
                        {order.user?.name || "Unknown"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {order.user?.email || "-"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Payment</p>

                        <p className="text-sm font-medium capitalize">
                          {formatStatus(order.paymentStatus)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total</p>

                        <p className="font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <button
                        onClick={() => navigate(`/admin/orders/${orderId}`)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white"
                    >
                      <Eye size={16} />
                      View Order
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={page === pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;