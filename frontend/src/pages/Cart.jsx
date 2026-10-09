import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductImage from "../components/common/ProductImage";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const navigate = useNavigate();

  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag size={36} className="text-gray-500" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-3 text-gray-500">
            Looks like you haven't added anything to your cart yet.
          </p>

          <Link to="/shop" className="mt-8 inline-block">
            <Button>
              Start Shopping
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) {
      return;
    }

    const productId = item.product._id ?? item.product.id;
    await updateQuantity(
      productId,
      item.quantity - 1
    );
  };

  const handleIncrease = async (item) => {
    if (item.quantity >= item.product.stock) {
      toast.error(
        `Only ${item.product.stock} items available.`
      );
      return;
    }

    const productId = item.product._id ?? item.product.id;
    await updateQuantity(
      productId,
      item.quantity + 1
    );
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Shopping
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Your Cart
          </h1>

          <p className="mt-2 text-gray-500">
            {cart.items.length}{" "}
            {cart.items.length === 1 ? "product" : "products"}{" "}
            in your cart
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
        >
          <Trash2 size={17} />
          Clear Cart
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Cart Items */}
        <div className="space-y-4">
          {cart.items.map((item) => {
            const product = item.product;
            const productId = product._id ?? product.id;

            return (
              <div
                key={productId}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    to={`/products/${productId}`}
                    className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-36 sm:w-36"
                  >
                    <ProductImage
                      image={product.images?.[0]}
                      alt={product.name}
                      className="h-full w-full"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {product.brand && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {product.brand}
                          </p>
                        )}

                        <Link
                          to={`/products/${productId}`}
                          className="mt-1 block text-base font-semibold text-gray-900 hover:underline sm:text-lg"
                        >
                          {product.name}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(productId)
                        }
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                      {/* Quantity */}
                      <div>
                        <p className="mb-2 text-xs text-gray-500">
                          Quantity
                        </p>

                        <div className="flex items-center rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              handleDecrease(item)
                            }
                            disabled={item.quantity <= 1}
                            className="p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={16} />
                          </button>

                          <span className="w-10 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleIncrease(item)
                            }
                            disabled={
                              item.quantity >= product.stock
                            }
                            className="p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹
                          {(
                            item.price * item.quantity
                          ).toLocaleString("en-IN")}
                        </p>

                        <p className="text-xs text-gray-500">
                          ₹
                          {item.price.toLocaleString("en-IN")}{" "}
                          each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
          <h2 className="text-xl font-bold text-gray-900">
            Order Summary
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-semibold text-gray-900">
                ₹{cart.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Discount
              </span>

              <span className="font-semibold text-green-600">
                - ₹{cart.discount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Shipping
              </span>

              <span className="font-semibold text-green-600">
                FREE
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">
                  Total
                </span>

                <span className="text-2xl font-bold text-gray-900">
                  ₹{cart.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            Taxes and final shipping charges will be calculated
            during checkout.
          </p>
        </aside>
      </div>
    </section>
  );
};

export default Cart;