import { useState } from "react";
import {
  BarChart3,
  ShoppingBag,
  Users,
  Package,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import getImageUrl from "../../utils/getImageUrl.js";
import ProductImage from "../../components/common/ProductImage";

const RANGE_OPTIONS = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 12 Months", value: "12m" },
];

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load analytics."
  );
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const AdminDashboard = () => {
  const [range, setRange] = useState("30d");

  const {
    data: analyticsData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: async () => {
      const [
        overviewResponse,
        revenueResponse,
        ordersResponse,
        productsResponse,
        categoriesResponse,
      ] = await Promise.all([
        api.get(`/admin/analytics/overview?range=${range}`),
        api.get(`/admin/analytics/revenue?range=${range}`),
        api.get(`/admin/analytics/orders?range=${range}`),
        api.get(`/admin/analytics/top-products?range=${range}`),
        api.get(`/admin/analytics/categories?range=${range}`),
      ]);

      return {
        overview: overviewResponse.data?.data || null,
        revenueData: revenueResponse.data?.data || [],
        orderData: ordersResponse.data?.data || [],
        topProducts: productsResponse.data?.data || [],
        categoryData: categoriesResponse.data?.data || [],
      };
    },
    staleTime: 30 * 1000,
    retry: 1,
  });

  const overview = analyticsData?.overview || null;
  const revenueData = analyticsData?.revenueData || [];
  const orderData = analyticsData?.orderData || [];
  const topProducts = analyticsData?.topProducts || [];
  const categoryData = analyticsData?.categoryData || [];
  const errorMessage = error ? getErrorMessage(error) : "";

  const orderStatusChartData = orderData.map(
    (item) => ({
      name:
        statusLabels[item.status] ||
        item.status,
      value: item.count,
    })
  );

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor your store performance and sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) =>
              setRange(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-gray-900"
          >
            {RANGE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
            title="Refresh analytics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(
            overview?.revenue
          )}
          icon={IndianRupee}
          description="Selected period"
        />

        <StatCard
          title="Orders"
          value={overview?.totalOrders || 0}
          icon={ShoppingBag}
          description="Non-cancelled orders"
        />

        <StatCard
          title="Customers"
          value={
            overview?.totalCustomers || 0
          }
          icon={Users}
          description="Registered customers"
        />

        <StatCard
          title="Products"
          value={
            overview?.totalProducts || 0
          }
          icon={Package}
          description="Active products"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SmallStat
          title="Subtotal"
          value={formatCurrency(
            overview?.subtotal
          )}
        />

        <SmallStat
          title="Discounts"
          value={formatCurrency(
            overview?.discount
          )}
        />

        <SmallStat
          title="Cancelled Orders"
          value={
            overview?.cancelledOrders || 0
        }
        />
      </div>

      {/* Revenue + Order Status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenue */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Revenue Overview
              </h2>

              <p className="text-sm text-gray-500">
                Revenue and order activity
              </p>
            </div>

            <TrendingUp className="h-5 w-5 text-gray-500" />
          </div>

          <div className="h-80">
            {revenueData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={revenueData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    fontSize={12}
                  />

                  <YAxis
                    fontSize={12}
                    tickFormatter={(value) =>
                      `₹${value}`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                    labelFormatter={(label) =>
                      formatDate(label)
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="currentColor"
                    className="text-gray-900"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Order Status
          </h2>

          <p className="mb-4 text-sm text-gray-500">
            Orders by current status
          </p>

          <div className="h-80">
            {orderStatusChartData.length ===
            0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      orderStatusChartData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={95}
                    label
                  >
                    {orderStatusChartData.map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${
                            index * 55
                          }, 65%, 50%)`}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Products + Categories */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Top Selling Products
              </h2>

              <p className="text-sm text-gray-500">
                Based on units sold
              </p>
            </div>

            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>

          {topProducts.length === 0 ? (
            <EmptyList text="No product sales available." />
          ) : (
            <div className="space-y-4">
              {topProducts.map(
                (product, index) => (
                  <div
                    key={
                      product.productId ||
                      index
                    }
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold">
                      {index + 1}
                    </div>

                    <ProductImage
                      image={product.image}
                      fallbackImage={product.currentImage}
                      alt={product.name}
                      className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 bg-gray-50"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {product.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {product.unitsSold} units
                        sold
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        product.revenue
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Category Sales */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900">
              Category Sales
            </h2>

            <p className="text-sm text-gray-500">
              Revenue by product category
            </p>
          </div>

          {categoryData.length === 0 ? (
            <EmptyList text="No category sales available." />
          ) : (
            <div className="h-75">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    fontSize={12}
                  />

                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    width={100}
                    fontSize={12}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Bar
                    dataKey="revenue"
                    fill="currentColor"
                    className="text-gray-900"
                    radius={[
                      0, 6, 6, 0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Order status summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">
            Order Summary
          </h2>

          <p className="text-sm text-gray-500">
            Current order distribution
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(
            statusLabels
          ).map(([status, label]) => {
            const count =
              overview?.orderStatus?.[
                status
              ] || 0;

            return (
              <div
                key={status}
                className="rounded-lg bg-gray-50 p-4"
              >
                <p className="text-xs text-gray-500">
                  {label}
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {count}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>
    </div>
  );
};

const SmallStat = ({ title, value }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-lg font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
};

const EmptyChart = () => {
  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      No analytics data available.
    </div>
  );
};

const EmptyList = ({ text }) => {
  return (
    <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-400">
      {text}
    </div>
  );
};

export default AdminDashboard;