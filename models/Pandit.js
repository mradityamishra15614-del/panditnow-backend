const mongoose = require("mongoose");

const panditSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    introVideo: {
      type: String,
      default: "",
    },

    experienceYears: {
      type: Number,
      default: 0,
    },

    languages: {
      type: [String],
      default: [],
    },

    templeName: {
      type: String,
      default: "",
    },

    isTempleVerified: {
      type: Boolean,
      default: false,
    },

    services: {
      type: [String],
      default: [],
    },

    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },

      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },

    pricingType: {
      type: String,
      enum: ["fixed", "premium"],
      default: "fixed",
    },

    basePrice: {
      type: Number,
      default: 0,
    },

    verification: {
      aadharNumber: { type: String, default: "" },
      aadharPhoto: { type: String, default: "" },
      panditPhoto: { type: String, default: "" },
      isVerified: { type: Boolean, default: false },
    },

    trustScore: {
      type: Number,
      default: 0,
    },

    onTimeScore: {
      type: Number,
      default: 0,
    },

    cancellationCount: {
      type: Number,
      default: 0,
    },

    // ⭐⭐⭐⭐⭐ REVIEW SYSTEM FIELDS (ADDED SAFELY)
    totalRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    agreementSigned: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pandit", panditSchema);