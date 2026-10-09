import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import api from "../../services/api";
import ProductImage from "../../components/common/ProductImage";

const stockStatusConfig = {
  in_stock: {
    label: "In Stock",
    className: "bg-green-100 text-green-700",
  },
  low: {
    label: "Low Stock",
    className: "bg-yellow-100 text-yellow-700",
  },
  critical: {
    label: "Critical",
    className: "bg-orange-100 text-orange-700",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-100 text-red-700",
  },
};

const AdminInventory = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("restock");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const inventoryParams = useMemo(
    () => ({
      page,
      appliedSearch,
      status,
      category,
    }),
    [page, appliedSearch, status, category]
  );

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-inventory-overview"],
    queryFn: async () => {
      const response = await api.get("/admin/inventory/overview");
      return response.data?.data;
    },
    staleTime: 30 * 1000,
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to load inventory overview"
      );
    },
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["admin-inventory-categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      const data =
        response.data?.data?.categories ||
        response.data?.data ||
        [];

      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-inventory", inventoryParams],
    queryFn: async () => {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "10");

      if (appliedSearch) {
        params.set("search", appliedSearch);
      }

      if (status) {
        params.set("status", status);
      }

      if (category) {
        params.set("category", category);
      }

      const response = await api.get(
        `/admin/inventory?${params.toString()}`
      );

      return response.data?.data || {
        products: [],
        pagination: { page: 1, pages: 1, total: 0 },
      };
    },
    staleTime: 30 * 1000,
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to load inventory"
      );
    },
  });

  const products = (inventoryData?.products || []).map((product) => ({
    ...product,
    _id: product._id ?? product.id,
  }));

  const pagination = inventoryData?.pagination || {
    page: 1,
    pages: 1,
    total: 0,
  };

  const categories = categoriesData;
  const loading = overviewLoading || inventoryLoading;
  const productsLoading = isFetching && !inventoryLoading;

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setAppliedSearch(search.trim());
  };

  const openAdjustmentModal = (product) => {
    setSelectedProduct(product);
    setAdjustmentType("restock");
    setQuantity("");
    setReason("");
    setShowAdjustmentModal(true);
  };

  const closeAdjustmentModal = () => {
    if (adjusting) return;

    setShowAdjustmentModal(false);
    setSelectedProduct(null);
    setQuantity("");
    setReason("");
  };

  const handleAdjustment = async (event) => {
    event.preventDefault();

    if (!selectedProduct) return;

    const parsedQuantity = Number(quantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    if (
      adjustmentType !== "set" &&
      parsedQuantity === 0
    ) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (
      adjustmentType === "remove" &&
      parsedQuantity > selectedProduct.stock
    ) {
      toast.error(
        "Cannot remove more stock than currently available"
      );
      return;
    }

    try {
      setAdjusting(true);

      const productId = selectedProduct._id ?? selectedProduct.id;

      if (!productId) {
        toast.error("Cannot adjust inventory: missing product ID.");
        return;
      }

      const response = await api.patch(
        `/admin/inventory/${productId}/adjust`,
        {
          adjustmentType,
          quantity: parsedQuantity,
          reason: reason.trim(),
        }
      );

      toast.success(
        response.data?.message ||
          "Inventory updated successfully"
      );

      closeAdjustmentModal();
      queryClient.invalidateQueries({ queryKey: ["admin-inventory-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    } catch (error) {
      const responseData = error.response?.data;
      const validationDetails = Array.isArray(responseData?.errors)
        ? responseData.errors
            .map(({ field, message }) =>
              field && message ? `${field}: ${message}` : message
            )
            .filter(Boolean)
            .join("; ")
        : "";

      console.error("Inventory adjustment failed:", responseData || error);
      toast.error(
        validationDetails
          ? `${responseData?.message || "Validation failed."} ${validationDetails}`
          : responseData?.message || "Failed to update inventory"
      );
    } finally {
      setAdjusting(false);
    }
  };

  const getStatus = (product) => {
    return (
      stockStatusConfig[product.stockStatus] ||
      stockStatusConfig.in_stock
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor stock levels and manage inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-inventory-overview"] });
            queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
            refetch();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <OverviewCard
          title="Total Products"
          value={overview?.totalProducts || 0}
          icon={<Package className="h-5 w-5" />}
        />

        <OverviewCard
          title="Total Units"
          value={overview?.totalUnits || 0}
          icon={<Package className="h-5 w-5" />}
        />

        <OverviewCard
          title="In Stock"
          value={overview?.inStock || 0}
          icon={<Package className="h-5 w-5" />}
        />

        <OverviewCard
          title="Low Stock"
          value={overview?.lowStock || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <OverviewCard
          title="Out of Stock"
          value={overview?.outOfStock || 0}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product, SKU or brand..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="critical">Critical</option>
            <option value="out_of_stock">
              Out of Stock
            </option>
          </select>

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Categories</option>

            {categories.map((item) => (
              <option
                key={item._id}
                value={item._id}
              >
                {item.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 md:col-span-4"
          >
            Search Inventory
          </button>
        </form>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Product
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  SKU
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stock
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No inventory products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const statusInfo = getStatus(product);

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            image={product.images?.[0]}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border"
                          />

                          <div>
                            <p className="font-medium text-gray-900">
                              {product.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {product.brand || "No brand"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product.category?.name || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-lg font-semibold text-gray-900">
                          {product.stock}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openAdjustmentModal(product)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 className="h-4 w-4" />
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          loading={productsLoading}
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {products.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No inventory products found.
          </div>
        ) : (
          products.map((product) => {
            const statusInfo = getStatus(product);

            return (
              <div
                key={product._id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <ProductImage
                    image={product.images?.[0]}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-lg border"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">
                      {product.name}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {product.sku || "No SKU"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {product.category?.name || "No category"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      Current Stock
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {product.stock}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openAdjustmentModal(product)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Adjust Inventory
                </button>
              </div>
            );
          })
        )}

        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          loading={productsLoading}
        />
      </div>

      {/* Adjustment modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Adjust Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedProduct.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAdjustmentModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleAdjustment}
              className="space-y-5 p-5"
            >
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Current Stock
                  </span>

                  <span className="text-xl font-bold text-gray-900">
                    {selectedProduct.stock}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Adjustment Type
                </label>

                <select
                  value={adjustmentType}
                  onChange={(event) =>
                    setAdjustmentType(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                >
                  <option value="restock">
                    Restock (+)
                  </option>

                  <option value="remove">
                    Remove (-)
                  </option>

                  <option value="set">
                    Set Exact Stock
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Reason
                </label>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  rows="3"
                  placeholder="Example: New supplier shipment"
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdjustmentModal}
                  disabled={adjusting}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adjusting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Update Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const OverviewCard = ({ title, value, icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>

        <p className="mt-2 text-2xl font-bold text-gray-900">
          {value}
        </p>
      </div>

      <div className="rounded-lg bg-gray-100 p-3 text-gray-700">
        {icon}
      </div>
    </div>
  </div>
);

const Pagination = ({
  pagination,
  page,
  setPage,
  loading,
}) => {
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
      <p className="text-sm text-gray-500">
        Page {pagination.page} of {pagination.pages}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() =>
            setPage((current) => current - 1)
          }
          className="rounded-lg border border-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={
            page >= pagination.pages || loading
          }
          onClick={() =>
            setPage((current) => current + 1)
          }
          className="rounded-lg border border-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminInventory;