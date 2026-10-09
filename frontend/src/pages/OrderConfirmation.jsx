import {
  CheckCircle,
  Package,
  ShoppingBag,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";

import Button from "../components/common/Button";

const OrderConfirmation = () => {
  const location = useLocation();

  const order = location.state?.order;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle
          size={42}
          className="text-green-600"
        />
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-green-600">
        Order Confirmed
      </p>

      <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
        Thank you for your order!
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-gray-500">
        Your order has been placed successfully.
        We'll keep you updated about your delivery.
      </p>

      {order?._id && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
          <div className="flex items-center gap-3">
            <Package size={22} />

            <div>
              <p className="text-xs text-gray-500">
                Order ID
              </p>

              <p className="font-semibold">
                #{order._id}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex justify-between">
              <span className="text-gray-500">
                Total
              </span>

              <span className="font-bold">
                ₹
                {order.totalAmount?.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            <div className="mt-2 flex justify-between">
              <span className="text-gray-500">
                Payment
              </span>

              <span className="font-medium uppercase">
                {order.paymentMethod}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {order?._id && (
          <Link
            to={`/orders/${order._id}`}
          >
            <Button>
              View Order
              <Package size={18} />
            </Button>
          </Link>
        )}

        <Link to="/shop">
          <Button variant="outline">
            Continue Shopping
            <ShoppingBag size={18} />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default OrderConfirmation;