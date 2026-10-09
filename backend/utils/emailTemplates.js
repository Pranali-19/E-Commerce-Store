const emailLayout = ({
  title,
  content,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${title}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,Helvetica,sans-serif;
  color:#222;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 2px 12px rgba(0,0,0,0.08);
  ">

    <div style="
      background:#111111;
      color:#ffffff;
      padding:24px;
      text-align:center;
    ">
      <h1 style="
        margin:0;
        font-size:26px;
        letter-spacing:1px;
      ">
        NOVA
      </h1>

      <p style="
        margin:8px 0 0;
        color:#cccccc;
        font-size:13px;
      ">
        Your trusted shopping destination
      </p>
    </div>

    <div style="
      padding:32px 28px;
    ">
      ${content}
    </div>

    <div style="
      border-top:1px solid #eeeeee;
      padding:20px;
      text-align:center;
      color:#888888;
      font-size:12px;
    ">
      <p style="margin:0;">
        Thank you for shopping with NOVA.
      </p>

      <p style="margin:8px 0 0;">
        This is an automated email. Please do not reply.
      </p>
    </div>

  </div>

</body>
</html>
`;
};

export const orderConfirmedEmail = ({
  customerName,
  orderId,
  totalAmount,
  paymentMethod,
}) => {
  const content = `
    <h2 style="margin-top:0;">
      Order Confirmed 🎉
    </h2>

    <p>
      Hi ${customerName},
    </p>

    <p>
      Thank you for your order. Your order has been successfully
      confirmed.
    </p>

    <div style="
      background:#f7f7f7;
      border-radius:8px;
      padding:18px;
      margin:24px 0;
    ">
      <p style="margin:6px 0;">
        <strong>Order ID:</strong> ${orderId}
      </p>

      <p style="margin:6px 0;">
        <strong>Total:</strong> ₹${Number(totalAmount).toFixed(2)}
      </p>

      <p style="margin:6px 0;">
        <strong>Payment:</strong> ${paymentMethod}
      </p>
    </div>

    <p>
      We'll keep you updated about your order status.
    </p>
  `;

  return emailLayout({
    title: "Order Confirmed",
    content,
  });
};

export const paymentSuccessEmail = ({
  customerName,
  orderId,
  totalAmount,
}) => {
  const content = `
    <h2 style="margin-top:0;">
      Payment Successful 💳
    </h2>

    <p>
      Hi ${customerName},
    </p>

    <p>
      Your payment has been successfully received.
    </p>

    <div style="
      background:#f7f7f7;
      border-radius:8px;
      padding:18px;
      margin:24px 0;
    ">
      <p style="margin:6px 0;">
        <strong>Order ID:</strong> ${orderId}
      </p>

      <p style="margin:6px 0;">
        <strong>Amount Paid:</strong>
        ₹${Number(totalAmount).toFixed(2)}
      </p>

      <p style="margin:6px 0;">
        <strong>Status:</strong> Paid
      </p>
    </div>

    <p>
      Your order is now being processed.
    </p>
  `;

  return emailLayout({
    title: "Payment Successful",
    content,
  });
};

export const orderCancelledEmail = ({
  customerName,
  orderId,
  totalAmount,
}) => {
  const content = `
    <h2 style="margin-top:0;">
      Order Cancelled
    </h2>

    <p>
      Hi ${customerName},
    </p>

    <p>
      Your order has been cancelled successfully.
    </p>

    <div style="
      background:#f7f7f7;
      border-radius:8px;
      padding:18px;
      margin:24px 0;
    ">
      <p style="margin:6px 0;">
        <strong>Order ID:</strong> ${orderId}
      </p>

      <p style="margin:6px 0;">
        <strong>Order Total:</strong>
        ₹${Number(totalAmount).toFixed(2)}
      </p>

      <p style="margin:6px 0;">
        <strong>Status:</strong> Cancelled
      </p>
    </div>
  `;

  return emailLayout({
    title: "Order Cancelled",
    content,
  });
};

export const orderStatusEmail = ({
  customerName,
  orderId,
  status,
  message,
}) => {
  const content = `
    <h2 style="margin-top:0;">
      ${status}
    </h2>

    <p>
      Hi ${customerName},
    </p>

    <p>
      ${message}
    </p>

    <div style="
      background:#f7f7f7;
      border-radius:8px;
      padding:18px;
      margin:24px 0;
    ">
      <p style="margin:6px 0;">
        <strong>Order ID:</strong> ${orderId}
      </p>

      <p style="margin:6px 0;">
        <strong>Current Status:</strong> ${status}
      </p>
    </div>

    <p>
      You can view your order details from your NOVA account.
    </p>
  `;

  return emailLayout({
    title: status,
    content,
  });
};