import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import ProductImage from "../common/ProductImage";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const productId = product._id ?? product.id;
  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login", {
        state: {
          from: `/products/${productId}`,
        },
      });

      return;
    }

    await addToCart(productId, 1);
  };

  
  const displayPrice = product.discountPrice || product.price;
  const hasDiscount =
    product.discountPrice &&
    Number(product.discountPrice) < Number(product.price);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <ProductImage
          image={product.images?.[0]}
          alt={product.name}
          className="h-full w-full"
          imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
            SALE
          </span>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(productId);
          }}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50"
          aria-label="Add to wishlist"
        >
          <Heart
            size={19}
            className={
              isInWishlist(productId)
                ? "fill-red-500 text-red-500"
                : "text-gray-600"
            }
          />
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className="absolute bottom-3 left-3 right-3 translate-y-16 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <span className="flex items-center justify-center gap-2">
            <ShoppingBag size={17} />
            Add to Cart
          </span>
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
          {product.brand || "NOVA"}
        </p>

        <Link to={`/products/${productId}`}>
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold text-gray-900 transition hover:text-gray-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <Star size={15} fill="currentColor" />

          <span className="text-sm font-medium">
            {product.ratings?.average?.toFixed(1) || "0.0"}
          </span>

          <span className="text-xs text-gray-500">
            ({product.ratings?.count || 0})
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ₹{Number(displayPrice).toLocaleString("en-IN")}
          </span>

          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;