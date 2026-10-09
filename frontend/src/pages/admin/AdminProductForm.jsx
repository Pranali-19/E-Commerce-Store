import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 ,X , RefreshCw , Upload } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  discountPrice: "",
  category: "",
  brand: "",
  stock: "",
  sku: "",
  images: [""],
  specifications: [{ key: "", value: "" }],
  tags: "",
  isFeatured: false,
  isActive: true,
};

const createSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditMode);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);


  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");

      setCategories(response.data.data?.categories || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      setFetchingProduct(true);

      const response = await api.get(`/products/${id}`);

      const product =
        response.data?.data?.product ||
        response.data?.data;

      if (!product) {
        throw new Error("Product data not found");
      }

      setForm({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price ?? "",
        discountPrice: product.discountPrice ?? "",
        category:
          typeof product.category === "object"
            ? product.category?._id || product.category?.id || ""
            : product.category || "",
        brand: product.brand || "",
        stock: product.stock ?? "",
        sku: product.sku || "",

        images:
          Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : [""],

        specifications:
          Array.isArray(product.specifications) &&
          product.specifications.length > 0
            ? product.specifications.map((spec) => ({
                key: spec.key || "",
                value: spec.value || "",
              }))
            : [{ key: "", value: "" }],

        tags: Array.isArray(product.tags)
          ? product.tags.join(", ")
          : "",

        isFeatured: Boolean(product.isFeatured),
        isActive: product.isActive !== false,
      });
    } catch (error) {
      console.error("Fetch product error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load product"
      );

      navigate("/admin/products");
    } finally {
      setFetchingProduct(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCategories();

    if (isEditMode) {
      fetchProduct();
    }
  }, [isEditMode, fetchCategories, fetchProduct]);

  const handleChange = (e) => {
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
      slug: isEditMode ? prev.slug : createSlug(value),
    }));
  };

  const handleSpecificationChange = (index, field, value) => {
    setForm((prev) => {
      const specifications = [...prev.specifications];

      specifications[index] = {
        ...specifications[index],
        [field]: value,
      };

      return {
        ...prev,
        specifications,
      };
    });
  };

  const addSpecification = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { key: "", value: "" },
      ],
    }));
  };

  const removeSpecification = (index) => {
    setForm((prev) => {
      const specifications = prev.specifications.filter(
        (_, i) => i !== index
      );

      return {
        ...prev,
        specifications: specifications.length
          ? specifications
          : [{ key: "", value: "" }],
      };
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return false;
    }

    if (!form.description.trim()) {
      toast.error("Product description is required");
      return false;
    }

    if (!form.price || Number(form.price) < 0) {
      toast.error("Enter a valid product price");
      return false;
    }

    if (
      form.discountPrice !== "" &&
      Number(form.discountPrice) > Number(form.price)
    ) {
      toast.error("Discount price cannot be greater than regular price");
      return false;
    }

    if (!form.category) {
      toast.error("Please select a category");
      return false;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      toast.error("Enter a valid stock quantity");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || createSlug(form.name),
        description: form.description.trim(),
        price: Number(form.price),
        discountPrice:
          form.discountPrice === ""
            ? null
            : Number(form.discountPrice),
        category: form.category,
        brand: form.brand.trim(),
        stock: Number(form.stock),
        sku: form.sku.trim() || undefined,

        images: form.images
          .map((image) => {
            if (typeof image === "string") {
              return image.trim();
            }

            if (!image || typeof image.url !== "string") {
              return null;
            }

            return {
              ...image,
              url: image.url.trim(),
            };
          })
          .filter((image) =>
            typeof image === "string" ? Boolean(image) : Boolean(image?.url)
          ),

        specifications: form.specifications
          .filter(
            (spec) =>
              spec.key.trim() || spec.value.trim()
          )
          .map((spec) => ({
            key: spec.key.trim(),
            value: spec.value.trim(),
          })),

        tags: form.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),

        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      if (isEditMode) {
        await api.put(`/products/${id}`, payload);

        toast.success("Product updated successfully");
      } else {
        await api.post("/products", payload);

        toast.success("Product created successfully");
      }

      navigate("/admin/products");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} product`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    if (files.length > 8) {
      toast.error("You can upload a maximum of 8 images.");
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast.error("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    const oversizedFiles = files.filter(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      toast.error("Each image must be smaller than 5 MB.");
      return;
    }

    try {
      setUploadingImages(true);
      setImageFiles(files);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post(
        "/upload/products",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedImages =
        response.data?.data?.images || [];

      const uploadedImageObjects = uploadedImages.map(
        (image) => ({
          url: image.url,
          publicId: image.publicId || "",
        })
      );

      setForm((prev) => ({
        ...prev,
        images: [
          ...(prev.images || []),
          ...uploadedImageObjects,
        ].slice(0, 8),
      }));

      toast.success("Images uploaded successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to upload images."
      );
    } finally {
      setUploadingImages(false);

      event.target.value = "";
    }
  };

  if (fetchingProduct) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="text-gray-500">
          Loading product...
        </div>
      </div>
    );
  }

  const imagePreviews = (form.images || [])
    .map((image, index) => ({
      index,
      src: typeof image === "string" ? image : image?.url,
    }))
    .filter(({ src }) => typeof src === "string" && src.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/products"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Product" : "Add Product"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? "Update product information and inventory."
              : "Create a new product for your store."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Name *
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleNameChange}
                placeholder="e.g. Premium Wireless Headphones"
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
                onChange={handleChange}
                placeholder="premium-wireless-headphones"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Brand
              </label>

              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g. Sony"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category *
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white px-4 py-2.5 outline-none focus:border-black"
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                SKU
              </label>

              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="SKU-001"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description *
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Write a detailed product description..."
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>
        </section>

        {/* Pricing & Inventory */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Pricing & Inventory
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Price (₹) *
              </label>

              <input
                type="number"
                min="0"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="999"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Discount Price (₹)
              </label>

              <input
                type="number"
                min="0"
                name="discountPrice"
                value={form.discountPrice}
                onChange={handleChange}
                placeholder="799"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Stock *
              </label>

              <input
                type="number"
                min="0"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="100"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          {/* <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Images
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add image URLs for now. Cloudinary upload will be added later.
              </p>
            </div>

            <button
              type="button"
              onClick={addImageField}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <Plus size={16} />
              Add Image
            </button>
          </div>

          <div className="space-y-3">
            {form.images.map((image, index) => (
              <div
                key={index}
                className="flex gap-2"
              >
                <input
                  type="url"
                  value={image}
                  onChange={(e) =>
                    handleImageChange(index, e.target.value)
                  }
                  placeholder="https://example.com/product-image.jpg"
                  className="flex-1 rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                />

                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="rounded-lg border px-3 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div> */}

          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Images
              </label>

              <label
                htmlFor="product-images"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-gray-500 hover:bg-gray-100"
              >
                {uploadingImages ? (
                  <>
                    <RefreshCw className="mb-2 h-8 w-8 animate-spin text-gray-500" />

                    <p className="text-sm font-medium text-gray-700">
                      Uploading images...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />

                    <p className="text-sm font-medium text-gray-700">
                      Click to upload product images
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG or WEBP · Maximum 5 MB each · Up to 8 images
                    </p>
                  </>
                )}

                <input
                  id="product-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {imagePreviews.map(({ index, src }, previewIndex) => (
                <div
                  key={`${src}-${index}`}
                  className="group relative overflow-hidden rounded-xl border bg-gray-50"
                >
                  <img
                    src={src.trim()}
                    alt={`Product ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />

                  {previewIndex === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                      Main
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        images: prev.images.filter(
                          (_, imageIndex) =>
                            imageIndex !== index
                        ),
                      }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow hover:bg-red-50"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Specifications */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Specifications
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add technical details such as color, size, material, etc.
              </p>
            </div>

            <button
              type="button"
              onClick={addSpecification}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <Plus size={16} />
              Add Specification
            </button>
          </div>

          <div className="space-y-3">
            {form.specifications.map((specification, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
              >
                <input
                  type="text"
                  value={specification.key}
                  onChange={(e) =>
                    handleSpecificationChange(
                      index,
                      "key",
                      e.target.value
                    )
                  }
                  placeholder="Key e.g. Color"
                  className="rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                />

                <input
                  type="text"
                  value={specification.value}
                  onChange={(e) =>
                    handleSpecificationChange(
                      index,
                      "value",
                      e.target.value
                    )
                  }
                  placeholder="Value e.g. Black"
                  className="rounded-lg border px-4 py-2.5 outline-none focus:border-black"
                />

                <button
                  type="button"
                  onClick={() =>
                    removeSpecification(index)
                  }
                  className="rounded-lg border px-3 py-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Tags & Settings */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Tags & Settings
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tags
              </label>

              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="wireless, headphones, audio"
                className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-gray-700">
                  Featured Product
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-gray-700">
                  Active Product
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/products"
            className="rounded-lg border px-5 py-2.5 text-center text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />

            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Product"
              : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;