const getProductImage = (product) => {
  const image = product?.images?.[0];

  return typeof image === "string" ? image : image?.url || "";
};

export const getSafeCustomerOrder = (order) => ({
  id: order._id,

  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        product: item.product?._id ?? item.product,
        name: item.name,
        image: item.image || "",
        currentImage: getProductImage(item.product),
        price: item.price,
        quantity: item.quantity,
      }))
    : [],

  shippingAddress: order.shippingAddress
    ? {
        fullName: order.shippingAddress.fullName || "",
        phone: order.shippingAddress.phone || "",
        addressLine1: order.shippingAddress.addressLine1 || "",
        addressLine2: order.shippingAddress.addressLine2 || "",
        city: order.shippingAddress.city || "",
        state: order.shippingAddress.state || "",
        postalCode: order.shippingAddress.postalCode || "",
        country: order.shippingAddress.country || "",
      }
    : null,

  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  orderStatus: order.orderStatus,

  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  discount: order.discount,
  tax: order.tax,
  totalAmount: order.totalAmount,

  couponCode: order.couponCode || "",

  statusHistory: Array.isArray(order.statusHistory)
    ? order.statusHistory.map((history) => ({
        status: history.status,
        note: history.note || "",
        createdAt: history.createdAt,
      }))
    : [],

  deliveredAt: order.deliveredAt || null,
  cancelledAt: order.cancelledAt || null,

  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});