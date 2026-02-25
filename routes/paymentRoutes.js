const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Customer = require("../models/Customer");

const sendSms = require("../utils/sendSms");
const { protectCustomer } = require("../middleware/authMiddleware");
// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===============================
// CREATE ORDER (Customer Pay)
// ===============================
router.post("/create-order", protectCustomer, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID required ❌" });
    }

    const booking = await Booking.findById(bookingId);
    

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }
// Ensure booking belongs to logged-in customer
if (booking.customer.toString() !== req.user.id.toString()) {
  return res.status(403).json({ message: "Unauthorized payment attempt ❌" });
}
    // ✅ Only allow payment after pandit arrived
    if (booking.bookingStatus !== "arrived") {
      return res.status(400).json({
        message: "Payment allowed only after pandit arrived ❌",
      });
    }

    // ✅ If already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Payment already completed ✅",
      });
    }

    const options = {
      amount: booking.fixedPrice * 100, // in paise
      currency: "INR",
      receipt: `receipt_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Save orderId in booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      message: "Order created successfully ✅",
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log("Create Order Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ===============================
// VERIFY PAYMENT (Frontend Payment Success)
// ===============================
router.post("/verify-payment", protectCustomer, async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID required ❌" });
    }

    const booking = await Booking.findById(bookingId);
    

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }
// Ensure booking belongs to logged-in customer
if (booking.customer.toString() !== req.user.id.toString()) {
  return res.status(403).json({ message: "Unauthorized payment attempt ❌" });
}
    // ✅ Payment only allowed if pandit arrived
    if (booking.bookingStatus !== "arrived") {
      return res.status(400).json({
        message: "Pandit has not arrived yet ❌",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed ❌" });
    }

    // ✅ If already paid (avoid double update)
    if (booking.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Payment already verified ✅",
        booking,
      });
    }

    // ✅ Mark booking as paid
    booking.paymentStatus = "paid";
    booking.bookingStatus = "otp_pending";

    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;

    // ✅ Generate OTP only after payment success
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.otp = otp;

    await booking.save();

    // ===============================
    // SEND OTP SMS TO CUSTOMER
    // ===============================
    const customer = await Customer.findById(booking.customer);

    if (customer && customer.phone) {
      const message = `PanditNow OTP is ${otp}. Share OTP with pandit to start Puja. Do not share with anyone else.`;

      await sendSms(customer.phone, message);

      console.log("OTP SMS sent to customer ✅", customer.phone);
    } else {
      console.log("Customer phone not found ❌ OTP SMS not sent");
    }

    res.status(200).json({
      message: "Payment verified successfully ✅ OTP Generated & SMS Sent",
      otp,
      booking,
    });
  } catch (error) {
    console.log("Verify Payment Error:", error.response?.data || error.message);
    res.status(500).json({ message: error.message });
  }
});

// ===============================
// RAZORPAY WEBHOOK (Backup)
// ===============================
router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return res.status(500).json({
        message: "Webhook secret missing in env ❌",
      });
    }

    const razorpaySignature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // raw body buffer
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid webhook signature ❌" });
    }

    const event = JSON.parse(req.body.toString());

    // We only care about payment captured
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      // Find booking by razorpayOrderId
      const booking = await Booking.findOne({ razorpayOrderId });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found ❌" });
      }

      // If already paid, ignore webhook
      if (booking.paymentStatus === "paid") {
        return res.status(200).json({ message: "Already processed ✅" });
      }

      // Update booking
      booking.paymentStatus = "paid";
      booking.bookingStatus = "otp_pending";
      booking.razorpayPaymentId = razorpayPaymentId;

      // Generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      booking.otp = otp;

      await booking.save();

      // Send SMS
      const customer = await Customer.findById(booking.customer);

      if (customer && customer.phone) {
        const message = `PanditNow OTP is ${otp}. Share OTP with pandit to start Puja.`;

        await sendSms(customer.phone, message);

        console.log("Webhook OTP SMS sent to customer ✅", customer.phone);
      }

      console.log("Webhook Payment Captured ✅ Booking Updated:", booking._id);
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.log("Webhook Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
