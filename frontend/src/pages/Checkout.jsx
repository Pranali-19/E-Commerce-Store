import { useEffect, useState } from "react";
import {
  Check,
  Home,
  MapPin,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";

import Button from "../components/common/Button";
import Input from "../components/common/Input";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductImage from "../components/common/ProductImage";

import { useCart } from "../context/CartContext";
import loadRazorpay from "../utils/loadRozorpay";

const Checkout = () => {
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);

  const { cart, loading: cartLoading } =
    useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const [storeSettings, setStoreSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    type: "home",
    isDefault: false,
  });

  const fetchStoreSettings = async () => {
    try {
      setSettingsLoading(true);

      const response = await api.get("/store-settings");

      setStoreSettings(response.data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load store settings."
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      const response =
        await api.get("/addresses");

      const data = response.data.data;

      setAddresses(data);

      const defaultAddress =
        data.find(
          (address) => address.isDefault
        ) || data[0];

      if (defaultAddress) {
        setSelectedAddress(
          defaultAddress.id
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load addresses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchStoreSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post(
        "/addresses",
        form
      );

      const newAddress =
        response.data.data;

      toast.success(
        "Address added successfully."
      );

      setShowAddressForm(false);

      setForm({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        type: "home",
        isDefault: false,
      });

      await fetchAddresses();

      setSelectedAddress(
        newAddress.id
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to add address."
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (minimumOrderNotMet) {
      toast.error(
        `Minimun order amount is ₹${minimumOrderAmount.toLocaleString(
          "en-IN"
        )}.`
      );
      return;
    }

    if (!selectedAddress) {
      toast.error(
        "Please select a delivery address."
      );
      return;
    }

    if (paymentMethod === "razorpay") {
      await handleRazorpayPayment();
      return;
    }

    try {
      setPaymentLoading(true);

      const response = await api.post(
        "/orders",
        {
          addressId: selectedAddress,
          paymentMethod: "cod",
          couponCode:
            appliedCoupon?.code || "",
        }
      );

      toast.success(
        "Order placed successfully!"
      );

      navigate("/order-confirmation", {
        state: {
          order: response.data.data,
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to place order."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
        toast.error("Please enter a coupon code.");
        return;
    }
    try {
        setCouponLoading(true);
        const response = await api.post(
        "/coupons/validate",
        {
            code: couponCode,
            subtotal: cart.subtotal,
        });

        setAppliedCoupon(response.data.data);
        toast.success("Coupon applied successfully.");
    } catch (error) {
        setAppliedCoupon(null);

        toast.error(
        error.response?.data?.message ||
            "Invalid coupon."
        );
    } finally {
        setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");

    toast.success("Coupon removed.");
  };

  
  const selectedAddressObject =
  addresses.find(
    (address) => address.id === selectedAddress
  );

  const handleRazorpayPayment = async () => {
    try {
      setPaymentLoading(true);

      const loaded = await loadRazorpay();

      if (!loaded) {
        toast.error(
          "Razorpay failed to load. Please try again."
        );
        return;
      }

      const orderResponse = await api.post(
        "/payments/razorpay/create-order",
        {
          couponCode:
            appliedCoupon?.code || "",
        }
      );

      const razorpayOrder =
        orderResponse.data.data;

      const options = {
        key: razorpayOrder.keyId,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        name: storeSettings?.storeName || "NOVA",

        description: `${storeSettings?.storeName || "NOVA"} E-Commerce Order`,

        order_id:
          razorpayOrder.razorpayOrderId,

        handler: async function (response) {
          try {
            const verifyResponse =
              await api.post(
                "/payments/razorpay/verify",
                {
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  addressId: selectedAddress,

                  couponCode:
                    appliedCoupon?.code || "",
                }
              );

            toast.success(
              "Payment successful!"
            );

            navigate("/order-confirmation", {
              state: {
                order: verifyResponse.data.data,
              },
            });
          } catch (error) {
            toast.error(
              error.response?.data?.message ||
                "Payment verification failed."
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        prefill: {
          name: selectedAddressObject?.fullName || "",
          contact: selectedAddressObject?.phone || "",
        },

        theme: {
          color: "#000000",
        },

        modal: {
          ondismiss: function () {
            setPaymentLoading(false);

            toast.error(
              "Payment cancelled."
            );
          },
        },
      };

      const paymentObject =
        new window.Razorpay(options);

      paymentObject.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          toast.error(
            response.error?.description ||
              "Payment failed."
          );

          setPaymentLoading(false);
        }
      );

      paymentObject.open();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to start payment."
      );

      setPaymentLoading(false);
    }
  };

  const subtotal = Number(cart.subtotal || 0);
  
  const discount = appliedCoupon
    ? Number(appliedCoupon.discount || 0)
    : 0;

  const shippingEnabled =
    storeSettings?.shippingEnabled ?? true;

  const shippingCharge =
    Number(storeSettings?.shippingCharge || 0);

  const freeShippingMinimum =
    Number(storeSettings?.freeShippingMinimum || 0);

  const shippingFee =
    !shippingEnabled
      ? 0
      : freeShippingMinimum > 0 &&
          subtotal >= freeShippingMinimum
        ? 0
        : shippingCharge;

  const taxEnabled =
    storeSettings?.taxEnabled ?? false;

  const taxPercentage =
    Number(storeSettings?.taxPercentage || 0);

  const taxableAmount =
    Math.max(0, subtotal + shippingFee - discount);

  const tax =
    taxEnabled
      ? (taxableAmount * taxPercentage) / 100
      : 0;

  const checkoutTotal =
    Math.max(
      0,
      subtotal + shippingFee - discount + tax
    );

  const minimumOrderAmount =
    Number(storeSettings?.minimumOrderAmount || 0);

  const minimumOrderNotMet =
    minimumOrderAmount > 0 &&
    subtotal < minimumOrderAmount;

  if (cartLoading || loading || settingsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">
          Your cart is empty
        </h1>

        <p className="mt-3 text-gray-500">
          Add products before proceeding to
          checkout.
        </p>

        <Link
          to="/shop"
          className="mt-8 inline-block"
        >
          <Button>
            Continue Shopping
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Secure Checkout
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Checkout
        </h1>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Address */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Delivery Address
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Where should we deliver your order?
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddressForm(
                    !showAddressForm
                  )
                }
                className="flex items-center gap-1 text-sm font-semibold"
              >
                <Plus size={16} />
                Add New
              </button>
            </div>

            {/* Add address */}
            {showAddressForm && (
              <form
                onSubmit={handleAddAddress}
                className="mt-6 border-t border-gray-100 pt-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Address"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Apartment / Area"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                  />

                  <Input
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Postal Code"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mt-5 flex gap-3">
                  <Button type="submit">
                    Save Address
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setShowAddressForm(false)
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Existing addresses */}
            <div className="mt-6 grid gap-4">
              {addresses.map((address) => (
                <button
                  type="button"
                  key={address.id}
                  onClick={() =>
                    setSelectedAddress(
                      address.id
                    )
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedAddress ===
                    address.id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {address.type ===
                      "office" ? (
                        <MapPin size={17} />
                      ) : (
                        <Home size={17} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {address.fullName}
                        </h3>

                        {address.isDefault && (
                          <span className="rounded-full bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {address.addressLine1}
                        {address.addressLine2 &&
                          `, ${address.addressLine2}`}
                      </p>

                      <p className="text-sm text-gray-600">
                        {address.city},{" "}
                        {address.state}{" "}
                        {address.postalCode}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Phone: {address.phone}
                      </p>
                    </div>

                    {selectedAddress ===
                      address.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Payment Method
            </h2>

            <div className="space-y-3">

              <label
                className={`flex items-center gap-4 border rounded-xl p-4 cursor-pointer ${
                  paymentMethod === "cod"
                    ? "border-black bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() =>
                    setPaymentMethod("cod")
                  }
                />

                <div>
                  <p className="font-medium">
                    Cash on Delivery
                  </p>

                  <p className="text-sm text-gray-500">
                    Pay when your order arrives.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-4 border rounded-xl p-4 cursor-pointer ${
                  paymentMethod === "razorpay"
                    ? "border-black bg-gray-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={
                    paymentMethod === "razorpay"
                  }
                  onChange={() =>
                    setPaymentMethod("razorpay")
                  }
                />

                <div>
                  <p className="font-medium">
                    Online Payment
                  </p>

                  <p className="text-sm text-gray-500">
                    Secure payment with Razorpay.
                  </p>
                </div>
              </label>

            </div>
          </div>
        </div>

        {/* RIGHT */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
          <h2 className="text-xl font-bold">
            Order Summary
          </h2>

          <div className="mt-6 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3"
              >
                <ProductImage
                  image={item.product.images?.[0]}
                  alt={item.product.name}
                  className="h-16 w-16 shrink-0 rounded-lg"
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">
                    {item.product.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <p className="text-sm font-semibold">
                  ₹
                  {(
                    item.price *
                    item.quantity
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>

          {/* Appiled Coupon */}
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold mb-3">
                Apply Coupon
            </h3>

            {!appliedCoupon ? (
                <div className="flex gap-2">
                <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                    setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code"
                    className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                />

                <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    loading={couponLoading}
                >
                    Apply
                </Button>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                <div>
                    <p className="font-semibold text-green-700">
                    {appliedCoupon.code}
                    </p>

                    <p className="text-sm text-green-600">
                    You saved ₹
                    {appliedCoupon.discount.toFixed(2)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-sm font-medium text-red-600 hover:underline"
                >
                    Remove
                </button>
                </div>
            )}
          </div>

        {/* <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
            <div className="flex justify-between text-sm">
            <span className="text-gray-500">
                Subtotal
            </span>

            <span>
                ₹
                {cart.subtotal.toLocaleString(
                "en-IN"
                )}
            </span>
            </div>

            <div className="flex justify-between text-sm">
            <span className="text-gray-500">
                Shipping
            </span>

            <span
                className={
                cart.subtotal >= 999
                    ? "font-semibold text-green-600"
                    : ""
                }
            >
                {cart.subtotal >= 999
                ? "FREE"
                : "₹79"}
            </span>
            </div>

            <div className="flex justify-between text-sm">
            <span className="text-gray-500">
                Discount
            </span>

            <span className="text-green-600">
                - ₹
                {cart.discount.toLocaleString(
                "en-IN"
                )}
            </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
                <span className="font-semibold">
                Total
                </span>

                <span className="text-2xl font-bold">
                ₹
                {(
                    cart.total +
                    (cart.subtotal < 999
                    ? 79
                    : 0)
                ).toLocaleString(
                    "en-IN"
                )}
                </span>
            </div>
            </div>
            
        </div> */}

        <div className="mt-5 flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm mt-3">
            <span>Discount</span>
            <span className="text-green-600">
                -₹{discount.toFixed(2)}
            </span>
        </div>

        <div className="flex justify-between text-sm mt-3">
          <span>Shipping</span>

          <span
            className={
              shippingFee === 0
                ? "font-semibold text-green-600"
                : ""
            }
          >
            {shippingFee === 0
              ? "Free"
              : `₹${shippingFee.toFixed(2)}`}
          </span>
        </div>

        {taxEnabled && (
          <div className="flex justify-between text-sm mt-3">
            <span>
              Tax ({taxPercentage}%)
            </span>

            <span>
              ₹{tax.toFixed(2)}
            </span>
          </div>
        )}

        {minimumOrderNotMet && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Minimum order amount is ₹
            {minimumOrderAmount.toLocaleString("en-IN")}.
            Please add more items to continue.
          </div>
        )}

        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{checkoutTotal.toFixed(2)}</span>
        </div>

          <Button
            type="button"
            onClick={handlePlaceOrder}
            loading={paymentLoading}
            disabled={
              !selectedAddress ||
              minimumOrderNotMet ||
              settingsLoading
            }
            className="w-full"
          >
            {paymentMethod === "razorpay"
              ? `Pay ₹${checkoutTotal.toFixed(2)}`
              : "Place Order"}
          </Button>

          <p className="mt-4 text-center text-xs text-gray-500">
            By placing your order, you agree to our
            terms and conditions.
          </p>
        </aside>
      </div>
    </section>
  );
};

export default Checkout;