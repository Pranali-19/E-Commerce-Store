import express from "express";
import protect from "../middleware/authMiddleware.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

router.post("/test", protect, async (req, res) => {
  const email = req.user.email;

  const result = await sendEmail({
    to: email,
    subject: "NOVA Email Test",
    text: "Your NOVA email system is working.",
    html: `
      <div style="font-family:Arial;padding:30px;">
        <h1>NOVA Email Test ✅</h1>
        <p>
          Your e-commerce email notification system is working correctly.
        </p>
      </div>
    `,
  });

  res.json({
    success: true,
    message: result
      ? "Test email sent successfully"
      : "Email was not sent. Check SMTP configuration.",
  });
});

export default router;