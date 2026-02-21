const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    pandit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pandit",
      default: null,
    },

    // ✅ store rejected pandits to avoid assigning again
    rejectedPandits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pandit",
      },
    ],

    bookingType: {
      type: String,
      enum: ["quick", "premium"],
      required: true,
    },

    pujaType: {
      type: String,
      required: true,
    },

    bookingDate: {
      type: String,
      required: true,
    },

    bookingTime: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    // ✅ CITY (IMPORTANT FOR AUTO REMATCH)
    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    fixedPrice: {
      type: Number,
      required: true,
    },

    priceLocked: {
      type: Boolean,
      default: true,
    },

    // ✅ PAYMENT STATUS
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    // ✅ RAZORPAY PAYMENT DETAILS
    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    // ✅ BOOKING STATUS FLOW
    bookingStatus: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "arrived",
        "otp_pending",
        "started",
        "completed",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },

    arrivedAt: {
      type: Date,
      default: null,
    },

    otp: {
      type: String,
      default: "",
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    replacementRequested: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
