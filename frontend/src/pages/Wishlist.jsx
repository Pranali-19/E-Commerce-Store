import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductImage from "../components/common/ProductImage";

import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const Wishlist = () => {
  const {
    wishlist,
    loading,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const handleAddToCart = async (product) => {
    const result = await addToCart(product._id, 1);

    if (result.success) {
      await removeFromWishlist(product._id);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!wishlist.products.length) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Heart
              size={36}
              className="text-gray-500"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Your wishlist is empty
          </h1>

          <p className="mt-3 text-gray-500">
            Save products you love and come back to them
            later.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-block"
          >
            <Button>
              Continue Shopping
              <ShoppingBag size={18} />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Saved Products
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            My Wishlist
          </h1>

          <p className="mt-2 text-gray-500">
            {wishlist.products.length}{" "}
            {wishlist.products.length === 1
              ? "product"
              : "products"}{" "}
            saved
          </p>
        </div>

        <button
          type="button"
          onClick={clearWishlist}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
        >
          <Trash2 size={17} />
          Clear Wishlist
        </button>
      </div>

      {/* Products */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wishlist.products.map((product) => {
          const price =
            product.discountPrice ?? product.price;

          const hasDiscount =
            product.discountPrice &&
            product.discountPrice < product.price;

          return (
            <article
              key={product._id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Link
                  to={`/products/${product._id}`}
                >
                  <ProductImage
                    image={product.images?.[0]}
                    alt={product.name}
                    className="h-full w-full"
                    imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    removeFromWishlist(product._id)
                  }
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-red-50"
                  aria-label="Remove from wishlist"
                >
                  <Heart
                    size={19}
                    className="fill-red-500 text-red-500"
                  />
                </button>

                {hasDiscount && (
                  <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    Sale
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-4">
                {product.brand && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {product.brand}
                  </p>
                )}

                <Link
                  to={`/products/${product._id}`}
                  className="mt-1 block line-clamp-2 font-semibold text-gray-900 hover:underline"
                >
                  {product.name}
                </Link>

                <div className="mt-3 flex items-center gap-2">
                  <span className="font-bold text-gray-900">
                    ₹{price.toLocaleString("en-IN")}
                  </span>

                  {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    handleAddToCart(product)
                  }
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Wishlist;