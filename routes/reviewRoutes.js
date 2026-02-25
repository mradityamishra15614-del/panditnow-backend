const express = require("express");
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Pandit from "../models/Pandit.js"; // ⭐ Added

const router = express.Router();

// POST REVIEW
router.post("/", async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.bookingStatus !== "completed") {
      return res.status(400).json({ message: "Booking not completed" });
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "Review already submitted" });
    }

    const review = await Review.create({
      customer: booking.customer,
      pandit: booking.pandit,
      booking: bookingId,
      rating,
      comment,
    });

    // ⭐⭐⭐⭐⭐ UPDATE PANDIT RATING (ADDED SAFELY)
    const pandit = await Pandit.findById(booking.pandit);

    if (pandit) {
      pandit.totalRating += rating;
      pandit.totalReviews += 1;
      pandit.averageRating =
        pandit.totalRating / pandit.totalReviews;

      await pandit.save();
    }

    res.json({ message: "Review submitted successfully", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL REVIEWS
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;