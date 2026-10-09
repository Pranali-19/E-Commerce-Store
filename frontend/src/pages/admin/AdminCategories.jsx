import { useEffect, useState, useCallback } from "react";
import {
  Edit,
  Image,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Upload, X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import getImageUrl from "../../utils/getImageUrl.js";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: 0,
  isActive: true,
};

const createSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCategories = useCallback( async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        search: appliedSearch,
        status,
        page,
        limit: 10,
      });

      const response = await api.get(
        `/categories/admin/list?${params.toString()}`
      );

      const data = response.data?.data;

      setCategories(
        (data?.categories || []).map((category) => ({
          ...category,
          _id: category._id ?? category.id,
        }))
      );

      setPagination(
        data?.pagination || {
          page: 1,
          pages: 1,
          total: 0,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedSearch, status, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleClearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setStatus("");
    setPage(1);
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || "",
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCategory(null);
    setForm(initialForm);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      name: value,
      slug: editingCategory
        ? prev.slug
        : createSlug(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || createSlug(form.name),
        description: form.description.trim(),
        image: form.image,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editingCategory) {
        const categoryId = editingCategory._id ?? editingCategory.id;

        if (!categoryId) {
          toast.error("Cannot update category: missing category ID.");
          return;
        }

        await api.put(
          `/categories/${categoryId}`,
          payload
        );

        toast.success("Category updated successfully");
      } else {
        await api.post("/categories", payload);

        toast.success("Category created successfully");
      }

      closeForm();

      setPage(1);
      fetchCategories(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      setTogglingId(category._id);

      await api.patch(
        `/categories/admin/${category._id}/status`
      );

      toast.success(
        `Category ${
          category.isActive ? "deactivated" : "activated"
        } successfully`
      );

      fetchCategories(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update category status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category._id);

      await api.delete(`/categories/${category._id}`);

      toast.success("Category deleted successfully");

      fetchCategories(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete category"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCategoryImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG, and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");

      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("image", file);

      const response = await api.post(
        "/upload/categories",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const image =
        response.data?.data?.image;

      if (!image?.url) {
        throw new Error("Image URL was not returned.");
      }

      // setForm((prev) => ({
      //   ...prev,
      //   image: image.url,
      // }));
      
      setForm((prev) => ({
        ...prev,
        image: {
          url: image.url,
          publicId: image.publicId || "",
        },
      }));

      toast.success(
        "Category image uploaded successfully."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to upload category image."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage product categories for your store.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form
            onSubmit={handleSearch}
            className="flex flex-1 gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Search
            </button>
          </form>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Clear
          </button>

          <button
            onClick={() => fetchCategories(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* Category count */}
      <div className="text-sm text-gray-500">
        Showing {categories.length} of{" "}
        {pagination.total || 0} categories
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm lg:block">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No categories found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Slug
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Sort Order
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {categories.map((category) => (
                  <tr
                    key={category._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                          {getImageUrl(category.image) ? (
                            <img
                              src={getImageUrl(category.image)}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <Image size={20} />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {category.name}
                          </p>

                          {category.description && (
                            <p className="max-w-xs truncate text-xs text-gray-500">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {category.slug}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {category.sortOrder}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          category.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            openEditForm(category)
                          }
                          className="rounded-lg border p-2 text-gray-600 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleToggleStatus(category)
                          }
                          disabled={
                            togglingId === category._id
                          }
                          className={`rounded-lg border p-2 ${
                            category.isActive
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={
                            category.isActive
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <Power size={17} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(category)
                          }
                          disabled={
                            deletingId === category._id
                          }
                          className="rounded-lg border p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            No categories found.
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category._id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {getImageUrl(category.image) ? (
                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <Image size={22} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {category.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {category.slug}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  {category.description && (
                    <p className="mt-2 text-sm text-gray-500">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-xs text-gray-500">
                  Sort order: {category.sortOrder}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      openEditForm(category)
                    }
                    className="rounded-lg border p-2 text-gray-600"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() =>
                      handleToggleStatus(category)
                    }
                    className={`rounded-lg border p-2 ${
                      category.isActive
                        ? "text-orange-500"
                        : "text-green-600"
                    }`}
                  >
                    <Power size={16} />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(category)
                    }
                    className="rounded-lg border p-2 text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of{" "}
            {pagination.pages}
          </span>

          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b px-6 py-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory
                  ? "Edit Category"
                  : "Add Category"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {editingCategory
                  ? "Update category information."
                  : "Create a new product category."}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Electronics"
                  className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Slug
                </label>

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleFormChange}
                  placeholder="electronics"
                  className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Describe this category..."
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Image URL
                </label>

                <input
                  type="url"
                  name="image"
                  value={form.image}
                  onChange={handleFormChange}
                  placeholder="https://example.com/category.jpg"
                  className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                />

                {form.image && (
                  <div className="mt-3 h-32 w-32 overflow-hidden rounded-lg border bg-gray-50">
                    <img
                      src={form.image}
                      alt="Category preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                )}
              </div> */}

              {/* Images */}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Category Image
                </label>

                <label
                  htmlFor="category-image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-center hover:bg-gray-100"
                >
                  {uploadingImage ? (
                    <>
                      <RefreshCw className="mb-2 h-7 w-7 animate-spin text-gray-500" />

                      <p className="text-sm text-gray-600">
                        Uploading...
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-7 w-7 text-gray-400" />

                      <p className="text-sm font-medium text-gray-700">
                        Upload category image
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG or WEBP · Maximum 5 MB
                      </p>
                    </>
                  )}

                  <input
                    id="category-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCategoryImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                {form.image && (
                  <div className="relative w-32">
                    <img
                      src={
                        typeof form.image === "string"
                          ? form.image
                          : form.image?.url
                      }
                      alt="Category preview"
                      className="h-32 w-32 rounded-xl border object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          image: "",
                        }))
                      }
                      className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="sortOrder"
                    value={form.sortOrder}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleFormChange}
                      className="h-4 w-4"
                    />

                    <span className="text-sm font-medium text-gray-700">
                      Active Category
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;