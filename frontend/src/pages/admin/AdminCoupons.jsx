import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrderAmount: "0",
  maximumDiscount: "",
  usageLimit: "",
  expiryDate: "",
  isActive: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [discountType, setDiscountType] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status) {
        params.append("status", status);
      }

      if (discountType) {
        params.append("discountType", discountType);
      }

      params.append("page", page);
      params.append("limit", 10);

      const response = await api.get(
        `/admin/coupons?${params.toString()}`
      );

      setCoupons(
        (response.data?.data?.coupons || []).map((coupon) => ({
          ...coupon,
          _id: coupon._id ?? coupon.id,
        }))
      );

      setPagination(
        response.data?.data?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        }
      );
    } catch (error) {
      console.error("Failed to fetch coupons:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load coupons"
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, discountType, page]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue ?? "",
      minimumOrderAmount: coupon.minimumOrderAmount ?? "0",
      maximumDiscount: coupon.maximumDiscount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate)
            .toISOString()
            .slice(0, 16)
        : "",
      isActive: coupon.isActive ?? true,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCoupon(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (!form.discountValue) {
      toast.error("Discount value is required");
      return;
    }

    if (!form.expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderAmount:
          Number(form.minimumOrderAmount) || 0,
        maximumDiscount:
          form.maximumDiscount === ""
            ? null
            : Number(form.maximumDiscount),
        usageLimit:
          form.usageLimit === ""
            ? null
            : Number(form.usageLimit),
        expiryDate: new Date(form.expiryDate).toISOString(),
        isActive: form.isActive,
      };

      if (editingCoupon) {
        await api.put(
          `/admin/coupons/${editingCoupon._id}`,
          payload
        );

        toast.success("Coupon updated successfully");
      } else {
        await api.post("/admin/coupons", payload);

        toast.success("Coupon created successfully");
      }

      closeModal();
      fetchCoupons();
    } catch (error) {
      console.error("Failed to save coupon:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to save coupon"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      setActionLoading(coupon._id);

      await api.patch(
        `/admin/coupons/${coupon._id}/status`
      );

      toast.success(
        coupon.isActive
          ? "Coupon deactivated successfully"
          : "Coupon activated successfully"
      );

      fetchCoupons();
    } catch (error) {
      console.error(
        "Failed to update coupon status:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update coupon status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (coupon) => {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}" permanently?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(coupon._id);

      await api.delete(`/admin/coupons/${coupon._id}`);

      toast.success("Coupon deleted successfully");

      if (coupons.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchCoupons();
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to delete coupon"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (date) => {
    return new Date(date) <= new Date();
  };

  const formatDiscount = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }

    return `₹${Number(
      coupon.discountValue
    ).toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Coupon Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage discount coupons.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search coupon..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-900"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Discount Type */}
          <select
            value={discountType}
            onChange={(e) => {
              setDiscountType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Discount Types</option>
            <option value="percentage">
              Percentage
            </option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {pagination.total} coupon
          {pagination.total !== 1 ? "s" : ""}
        </p>

        <button
          onClick={fetchCoupons}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <Loader2
              size={28}
              className="animate-spin text-gray-500"
            />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
            <Tag
              size={42}
              className="mb-3 text-gray-300"
            />

            <h3 className="text-lg font-semibold text-gray-900">
              No coupons found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first coupon or change your filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Coupon
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Discount
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Minimum Order
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Usage
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Expiry
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => (
                    <tr
                      key={coupon._id}
                      className="hover:bg-gray-50"
                    >
                      {/* Coupon */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold tracking-wide text-gray-900">
                            {coupon.code}
                          </p>

                          {coupon.description && (
                            <p className="mt-1 max-w-55 text-xs text-gray-500">
                              {coupon.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatDiscount(coupon)}
                          </p>

                          <p className="text-xs capitalize text-gray-500">
                            {coupon.discountType}
                          </p>

                          {coupon.maximumDiscount !==
                            null &&
                            coupon.discountType ===
                              "percentage" && (
                              <p className="mt-1 text-xs text-gray-500">
                                Max ₹
                                {Number(
                                  coupon.maximumDiscount
                                ).toLocaleString("en-IN")}
                              </p>
                            )}
                        </div>
                      </td>

                      {/* Minimum */}
                      <td className="px-5 py-4 text-sm text-gray-700">
                        ₹
                        {Number(
                          coupon.minimumOrderAmount || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      {/* Usage */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {coupon.usedCount || 0}
                          {" / "}
                          {coupon.usageLimit ?? "∞"}
                        </p>
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4">
                        <p
                          className={`text-sm font-medium ${
                            isExpired(coupon.expiryDate)
                              ? "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          {formatDate(coupon.expiryDate)}
                        </p>

                        {isExpired(coupon.expiryDate) && (
                          <p className="text-xs text-red-500">
                            Expired
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            handleToggleStatus(coupon)
                          }
                          disabled={
                            actionLoading === coupon._id
                          }
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            coupon.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {coupon.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEditModal(coupon)
                            }
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(coupon)
                            }
                            disabled={
                              actionLoading === coupon._id
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading === coupon._id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {coupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="space-y-4 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold tracking-wide text-gray-900">
                        {coupon.code}
                      </p>

                      {coupon.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        handleToggleStatus(coupon)
                      }
                      disabled={
                        actionLoading === coupon._id
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        coupon.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {coupon.isActive
                        ? "Active"
                        : "Inactive"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">
                        Discount
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatDiscount(coupon)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Minimum Order
                      </p>
                      <p className="font-semibold text-gray-900">
                        ₹
                        {Number(
                          coupon.minimumOrderAmount || 0
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Usage
                      </p>
                      <p className="font-semibold text-gray-900">
                        {coupon.usedCount || 0}
                        {" / "}
                        {coupon.usageLimit ?? "∞"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Expiry
                      </p>
                      <p
                        className={`font-semibold ${
                          isExpired(coupon.expiryDate)
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        {formatDate(coupon.expiryDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        openEditModal(coupon)
                      }
                      className="rounded-lg border border-gray-200 p-2 text-gray-600"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(coupon)
                      }
                      disabled={
                        actionLoading === coupon._id
                      }
                      className="rounded-lg border border-red-200 p-2 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    prev + 1,
                    pagination.pages
                  )
                )
              }
              disabled={page >= pagination.pages}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCoupon
                    ? "Edit Coupon"
                    : "Create Coupon"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Configure your discount coupon.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Coupon Code *
                </label>

                <input
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  placeholder="e.g. SAVE20"
                  maxLength={30}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-gray-900"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Describe the coupon..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Discount */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Discount Type *
                  </label>

                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="percentage">
                      Percentage
                    </option>
                    <option value="fixed">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Discount Value *
                  </label>

                  <input
                    type="number"
                    name="discountValue"
                    value={form.discountValue}
                    onChange={handleFormChange}
                    min="0"
                    max={
                      form.discountType === "percentage"
                        ? "100"
                        : undefined
                    }
                    step="0.01"
                    placeholder={
                      form.discountType === "percentage"
                        ? "20"
                        : "200"
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Order limits */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Minimum Order Amount
                  </label>

                  <input
                    type="number"
                    name="minimumOrderAmount"
                    value={form.minimumOrderAmount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="500"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Maximum Discount
                  </label>

                  <input
                    type="number"
                    name="maximumDiscount"
                    value={form.maximumDiscount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="1000"
                    disabled={
                      form.discountType === "fixed"
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Usage / expiry */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Usage Limit
                  </label>

                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleFormChange}
                    min="1"
                    placeholder="Leave empty for unlimited"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Expiry Date *
                  </label>

                  <input
                    type="datetime-local"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Active */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Active Coupon
                  </p>

                  <p className="text-xs text-gray-500">
                    Customers can use this coupon when active.
                  </p>
                </div>
              </label>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingCoupon
                    ? "Update Coupon"
                    : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;