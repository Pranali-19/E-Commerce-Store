import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn(
      "Email configuration is missing. Email was not sent."
    );

    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `📧 Email sent successfully: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      "Email sending failed:",
      error.message
    );

    // Email failure should not break the main application flow.
    return null;
  }
};

export default sendEmail;