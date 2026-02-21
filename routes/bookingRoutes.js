const express = require("express");
const router = express.Router();

const {
  createBooking,
  assignNearestPandit,
  acceptBooking,
  rejectBooking,
  panditArrived,
  verifyOTP,
  completeBooking,
  getCustomerBookings,
  getPanditBookings,
} = require("../controllers/bookingController");

const Booking = require("../models/Booking");
const Pandit = require("../models/Pandit");

const { protectCustomer, protectPandit } = require("../middleware/authMiddleware");

// ===============================
// CUSTOMER BOOKING
// ===============================
router.post("/create", protectCustomer, createBooking);

// ===============================
// QUICK BOOKING (ASSIGN NEAREST PANDIT)
// ===============================
router.post("/assign", protectCustomer, assignNearestPandit);

// ===============================
// CANCEL BOOKING (CUSTOMER)
// ===============================
router.put("/:bookingId/cancel", protectCustomer, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ❌ Do NOT allow cancel after arrival
    if (booking.bookingStatus === "arrived") {
      return res.status(400).json({
        message: "Cancellation not allowed after pandit arrival",
      });
    }

    // ❌ Do NOT allow cancel if already started or completed
    if (
      booking.bookingStatus === "started" ||
      booking.bookingStatus === "completed"
    ) {
      return res.status(400).json({
        message: "Cannot cancel this booking",
      });
    }
await Booking.findByIdAndUpdate(req.params.bookingId, {
  bookingStatus: "cancelled",
});

    // Make pandit available again
    if (booking.pandit) {
      await Pandit.findByIdAndUpdate(booking.pandit, {
        isAvailable: true,
      });
    }

    res.json({ message: "Booking cancelled successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================
// PANDIT ACTIONS (PROTECTED)
// ===============================
router.put("/:bookingId/accept", protectPandit, acceptBooking);
router.put("/:bookingId/reject", protectPandit, rejectBooking);
router.put("/:bookingId/arrived", protectPandit, panditArrived);

// ===============================
// OTP VERIFY (PROTECTED PANDIT)
// ===============================
router.put("/:bookingId/verify-otp", protectPandit, verifyOTP);

// ===============================
// COMPLETE BOOKING (PROTECTED PANDIT)
// ===============================
router.put("/:bookingId/complete", protectPandit, completeBooking);

// ===============================
// FETCH BOOKINGS
// ===============================
router.get("/customer/:customerId", protectCustomer, getCustomerBookings);
router.get("/pandit/:panditId", protectPandit, getPanditBookings);

module.exports = router;