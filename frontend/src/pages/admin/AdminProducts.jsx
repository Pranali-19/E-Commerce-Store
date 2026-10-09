import { useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Power,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";
import getImageUrl from "../../utils/getImageUrl.js";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Products",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const getProductId = (product, index) => {
  return product?._id || product?.id || `product-${index}`;
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const filterKey = useMemo(
    () => ({
      search: search.trim(),
      category,
      status,
      page,
    }),
    [search, category, status, page]
  );

  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000,
    onError: () => {
      toast.error("Failed to load categories");
    },
  });

  const {
    data: productsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-products", filterKey],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (category) {
        params.append("category", category);
      }

      if (status) {
        params.append("status", status);
      }

      params.append("page", String(page));
      params.append("limit", "10");

      const response = await api.get(
        `/products/admin/list?${params.toString()}`
      );

      return response.data.data;
    },
    staleTime: 30 * 1000,
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to load products"
      );
    },
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };
  const categories = categoriesData;
  const loading = isLoading || categoriesLoading;
  const refreshing = isFetching && !isLoading;

  const handleSearch = (event) => {
    event.preventDefault();

    if (page !== 1) {
      setPage(1);
    }
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
  };

  const handleToggleStatus = async (product) => {
    const productId = product._id ?? product.id;

    if (!productId) {
      toast.error("Cannot update product: missing product ID.");
      return;
    }

    try {
      setTogglingId(productId);

      const response = await api.patch(
        `/products/admin/${productId}/status`
      );

      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update product status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (product) => {
    const productId = product._id ?? product.id;

    if (!productId) {
      toast.error("Cannot delete product: missing product ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);

      const response = await api.delete(
        `/products/${productId}`
      );

      toast.success(
        response.data.message ||
          "Product deleted successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your store products and inventory
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={17} />
            Add Product
          </Link>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

          {/* SEARCH */}
          <form
            onSubmit={handleSearch}
            className="relative lg:col-span-1"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, brand or SKU..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </form>

          {/* CATEGORY */}
          <select
            value={category}
            onChange={handleCategoryChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            <option value="">
              All Categories
            </option>

            {categories.map((item) => (
              <option
                key={item._id}
                value={item._id}
              >
                {item.name}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
            {STATUS_OPTIONS.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {(search || category || status) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-gray-600 hover:text-black"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* COUNT */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {pagination.total}{" "}
          {pagination.total === 1
            ? "product"
            : "products"}{" "}
          found
        </p>
      </div>

      {/* PRODUCTS */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {loading ? (
          <div className="flex min-h-87.5 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-87.5 flex-col items-center justify-center px-6 text-center">
            <Package
              size={45}
              className="mb-3 text-gray-300"
            />

            <h3 className="font-semibold text-gray-900">
              No products found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>

            <Link
              to="/admin/products/new"
              className="mt-4 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white"
            >
              Add Product
            </Link>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Price
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {products.map((product, index) => {
                    const productId = getProductId(product, index);

                    return (
                      <tr
                        key={productId}
                        className="transition hover:bg-gray-50"
                      >
                        {/* PRODUCT */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                              {getImageUrl(product.images?.[0]) ? (
                                <img
                                  src={getImageUrl(product.images[0])}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Package size={20} className="text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {product.brand || "No brand"}
                              </p>

                              {product.sku && (
                                <p className="mt-1 text-xs text-gray-400">
                                  SKU: {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {product.category?.name || "Uncategorized"}
                        </td>

                        {/* PRICE */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(product.discountPrice ?? product.price)}
                          </p>

                          {product.discountPrice && product.discountPrice < product.price && (
                            <p className="mt-1 text-xs text-gray-400 line-through">
                              {formatCurrency(product.price)}
                            </p>
                          )}
                        </td>

                        {/* STOCK */}
                        <td className="px-5 py-4">
                          <span
                            className={`font-medium ${
                              product.stock <= 5
                                ? "text-red-600"
                                : product.stock <= 10
                                ? "text-orange-600"
                                : "text-gray-700"
                            }`}
                          >
                            {product.stock}
                          </span>

                          {product.stock <= 5 && (
                            <p className="mt-1 text-xs text-red-500">Low stock</p>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                product.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>

                            {product.isFeatured && (
                              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/products/${productId}`}
                              target="_blank"
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
                              title="View product"
                            >
                              <Eye size={16} />
                            </Link>

                            <Link
                              to={`/admin/products/edit/${productId}`}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
                              title="Edit product"
                            >
                              <Edit size={16} />
                            </Link>

                            <button
                              onClick={() => handleToggleStatus(product)}
                              disabled={togglingId === productId}
                              className={`rounded-lg border p-2 ${
                                product.isActive
                                  ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                  : "border-green-200 text-green-600 hover:bg-green-50"
                              } disabled:opacity-50`}
                              title={product.isActive ? "Deactivate" : "Activate"}
                            >
                              <Power size={16} />
                            </button>

                            <button
                              onClick={() => handleDelete(product)}
                              disabled={deletingId === productId}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title="Delete product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-gray-200 lg:hidden">
              {products.map((product, index) => {
                const productId = getProductId(product, index);

                return (
                  <div key={productId} className="p-4">
                    <div className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {getImageUrl(product.images?.[0]) ? (
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package size={22} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>

                        <p className="mt-1 text-sm text-gray-500">
                          {product.brand || "No brand"}
                        </p>

                        <p className="mt-2 font-semibold">
                          {formatCurrency(product.discountPrice ?? product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="mt-1 font-medium">
                          {product.category?.name || "Uncategorized"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p
                          className={`mt-1 font-medium ${
                            product.stock <= 5 ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>

                      {product.isFeatured && (
                        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <Link
                        to={`/products/${productId}`}
                        target="_blank"
                        className="flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600"
                      >
                        <Eye size={16} />
                      </Link>

                      <Link
                        to={`/admin/products/edit/${productId}`}
                        className="flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600"
                      >
                        <Edit size={16} />
                      </Link>

                      <button
                        onClick={() => handleToggleStatus(product)}
                        disabled={togglingId === productId}
                        className="flex items-center justify-center rounded-lg border border-gray-300 p-2 disabled:opacity-50"
                      >
                        <Power size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === productId}
                        className="flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
            Page {pagination.page} of{" "}
            {pagination.pages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={page === pagination.pages}
              onClick={() =>
                setPage((current) => current + 1)
              }
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

export default AdminProducts;