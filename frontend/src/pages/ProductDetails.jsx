import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ProductReviews from "../components/product/ProductReviews";

import api from "../services/api";
import ProductCard from "../components/product/ProductCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductImage from "../components/common/ProductImage";
import getImageUrl from "../utils/getImageUrl.js";

const ProductDetails = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    isInWishlist,
    toggleWishlist,
    } = useWishlist();

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/products/${id}`);

      const rawProduct = response.data.data?.product;
      const productData = rawProduct
        ? {
            ...rawProduct,
            _id: rawProduct._id ?? rawProduct.id,
            category: rawProduct.category
              ? {
                  ...rawProduct.category,
                  _id: rawProduct.category._id ?? rawProduct.category.id,
                }
              : null,
          }
        : null;

      setProduct(productData);

      if (productData?.category?._id) {
        const relatedResponse = await api.get(
          `/products?category=${productData.category._id}&limit=4`
        );

        const related =
          relatedResponse.data.data?.products || [];

        setRelatedProducts(
          related.filter(
            (item) => (item._id ?? item.id) !== productData._id
          )
        );
      }
    } catch (error) {
      console.error("Product details error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load product."
      );

      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = () => {
    if (!product) return;

    if (quantity < product.stock) {
      setQuantity((current) => current + 1);
    } else {
      toast.error("Maximum available stock reached.");
    }
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const handleAddToCart = async () => {
    if(!user) {
        navigate("/login", {
            state: {
                from: `/products/${product._id}`,
            },
        });

        return;
    }
    
    await addToCart(product._id,quantity)
    toast.success(
      `${quantity} item${quantity > 1 ? "s" : ""} selected. Cart functionality coming next.`
    );
  };


  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Product Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            The product you're looking for doesn't exist or is
            no longer available.
          </p>

          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white"
          >
            <ArrowLeft size={18} />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const productImages = (product.images || [])
    .map(getImageUrl)
    .filter(Boolean);
  const images = productImages;

  const displayPrice =
    product.discountPrice || product.price;

  const hasDiscount =
    product.discountPrice &&
    Number(product.discountPrice) < Number(product.price);

  const discountPercentage = hasDiscount
    ? Math.round(
        ((Number(product.price) -
          Number(product.discountPrice)) /
          Number(product.price)) *
          100
      )
    : 0;

  const isOutOfStock = product.stock <= 0;

  return (
    <main className="bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link
              to="/"
              className="hover:text-black"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              to="/shop"
              className="hover:text-black"
            >
              Shop
            </Link>

            <span>/</span>

            <span className="text-gray-900">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <div className="grid gap-4 sm:grid-cols-[90px_1fr]">
            {/* Thumbnails */}
            <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
              {images.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                    selectedImage === index
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  <ProductImage
                    image={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="order-1 overflow-hidden rounded-3xl bg-gray-100 sm:order-2">
              <div className="aspect-square">
                <ProductImage
                  image={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              {product.brand || "NOVA"}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={17}
                    fill={star <= Math.round(product.ratings?.average || 0) ? "currentColor" : "none"}
                  />
                ))}
              </div>

              <span className="text-sm font-medium">
                {product.ratings?.average?.toFixed(1) ||
                  "0.0"}
              </span>

              <span className="text-sm text-gray-500">
                ({product.ratings?.count || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-black">
                ₹
                {Number(displayPrice).toLocaleString(
                  "en-IN"
                )}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ₹
                    {Number(product.price).toLocaleString(
                      "en-IN"
                    )}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mt-5">
              {isOutOfStock ? (
                <span className="font-semibold text-red-600">
                  Out of stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="font-semibold text-orange-600">
                  Only {product.stock} left in stock
                </span>
              ) : (
                <span className="font-semibold text-green-600">
                  In stock
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mt-7 border-y border-gray-200 py-7">
              <h2 className="font-bold">
                Description
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                {product.description}
              </p>
            </div>

            {/* Quantity + Cart */}
            {!isOutOfStock && (
              <div className="mt-7">
                <p className="mb-3 text-sm font-semibold">
                  Quantity
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex h-12 w-fit items-center rounded-xl border border-gray-300">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="px-4 text-gray-600 hover:text-black"
                    >
                      <Minus size={18} />
                    </button>

                    <span className="w-10 text-center font-semibold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="px-4 text-gray-600 hover:text-black"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-black px-6 font-semibold text-white transition hover:bg-gray-800"
                  >
                    <ShoppingBag size={19} />
                    Add to Cart
                  </button>

                  {/* <button
                    type="button"
                    onClick={handleWishlist}
                    className="flex h-12 items-center justify-center rounded-xl border border-gray-300 px-5 transition hover:bg-gray-100"
                    aria-label="Add to wishlist"
                  >
                    <Heart size={20} />
                  </button> */}

                  <button
                    type="button"
                    onClick={() =>
                        toggleWishlist(product._id)
                    }
                    className="..."
                    >
                    <Heart
                        className={
                        isInWishlist(product._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }
                    />
                    </button>
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-200 pt-7 text-sm">
              {product.sku && (
                <div>
                  <p className="text-gray-500">
                    SKU
                  </p>
                  <p className="mt-1 font-semibold">
                    {product.sku}
                  </p>
                </div>
              )}

              <div>
                <p className="text-gray-500">
                  Category
                </p>

                <p className="mt-1 font-semibold">
                  {product.category?.name || "General"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-12 border-t pt-10">
        <ProductReviews
          productId={product._id}
          onRatingUpdate={fetchProduct}
        />
      </div>

      {/* Specifications */}
      {product.specifications?.length > 0 && (
        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-bold">
              Specifications
            </h2>

            <div className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {product.specifications.map(
                (specification, index) => (
                  <div
                    key={`${specification.key}-${index}`}
                    className="grid grid-cols-2 border-b border-gray-200 last:border-0"
                  >
                    <div className="bg-gray-50 px-5 py-4 font-semibold">
                      {specification.key}
                    </div>

                    <div className="px-5 py-4 text-gray-600">
                      {specification.value}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              You may also like
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Related Products
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetails;