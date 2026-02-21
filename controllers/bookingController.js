const { getDistance } = require("geolib");

const Booking = require("../models/Booking");
const Pandit = require("../models/Pandit");

// ===============================
// CREATE BOOKING (Customer)
// ===============================
exports.createBooking = async (req, res) => {
  try {
    let {
      customerId,
      bookingType,
      pujaType,
      bookingDate,
      bookingTime,
      address,
      latitude,
      longitude,
      fixedPrice,
      panditId,
      city, // ✅ add city from frontend
    } = req.body;

    // ✅ Customer can only book for himself
    if (req.user?.role === "customer") {
      if (req.user.id.toString() !== customerId.toString()) {
        return res.status(403).json({ message: "Not allowed ❌" });
      }
    }

    // normalize
    bookingType = bookingType?.trim().toLowerCase();
    pujaType = pujaType?.trim();
    bookingDate = bookingDate?.trim();
    bookingTime = bookingTime?.trim();
    address = address?.trim();
    city = city?.trim().toLowerCase();

    latitude = Number(latitude);
    longitude = Number(longitude);
    fixedPrice = Number(fixedPrice);

    if (
      !customerId ||
      !bookingType ||
      !pujaType ||
      !bookingDate ||
      !bookingTime ||
      !address ||
      !city ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      isNaN(fixedPrice)
    ) {
      return res.status(400).json({ message: "All booking fields required ❌" });
    }

    let assignedPandit = null;

    // Premium booking must have panditId
    if (bookingType === "premium") {
      if (!panditId) {
        return res
          .status(400)
          .json({ message: "Pandit ID required for premium booking ❌" });
      }
      assignedPandit = panditId;
    }

    const newBooking = new Booking({
      customer: customerId,
      pandit: assignedPandit,
      bookingType,
      pujaType,
      bookingDate,
      bookingTime,
      address,
      city, // ✅ store city in booking
      latitude,
      longitude,
      fixedPrice,
      bookingStatus: "pending",
      paymentStatus: "pending",
      rejectedPandits: [],
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully ✅",
      booking: newBooking,
    });
  } catch (error) {
    console.log("Create Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// QUICK BOOKING MATCH (Assign Nearest Pandit)
// ===============================
exports.assignNearestPandit = async (req, res) => {
  try {
    let { bookingId, city, latitude, longitude } = req.body;

    city = city?.trim().toLowerCase();
    latitude = Number(latitude);
    longitude = Number(longitude);

    if (!bookingId || !city || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message: "bookingId, city, latitude, longitude required ❌",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }

    // Find verified available pandits in same city
    const pandits = await Pandit.find({
      "location.city": city,
      isAvailable: true,
      "verification.isVerified": true,
      "location.latitude": { $ne: 0 },
      "location.longitude": { $ne: 0 },
      _id: { $nin: booking.rejectedPandits || [] },
    });

    if (!pandits || pandits.length === 0) {
      return res.status(404).json({
        message: "No verified pandits available ❌",
      });
    }

    // Calculate distance for each pandit
    const panditsWithDistance = pandits.map((p) => {
      const distance = getDistance(
        { latitude, longitude },
        { latitude: p.location.latitude, longitude: p.location.longitude }
      );

      return { pandit: p, distance };
    });

    // Sort nearest first
    panditsWithDistance.sort((a, b) => a.distance - b.distance);

    const nearestPandit = panditsWithDistance[0].pandit;

    // Assign nearest pandit
    booking.pandit = nearestPandit._id;
    booking.bookingStatus = "pending";
    booking.city = city; // ✅ store city

    await booking.save();

    res.status(200).json({
      message: "Nearest pandit assigned successfully ✅",
      pandit: nearestPandit,
      distance: panditsWithDistance[0].distance,
      booking,
    });
  } catch (error) {
    console.log("Assign Nearest Pandit Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// PANDIT ACCEPT BOOKING
// ===============================
exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }

    if (!booking.pandit) {
      return res.status(400).json({
        message: "No pandit assigned to this booking ❌",
      });
    }

    // Only assigned pandit can accept
    if (booking.pandit.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    if (booking.bookingStatus !== "pending") {
      return res.status(400).json({
        message: `Booking already ${booking.bookingStatus} ❌`,
      });
    }

    booking.bookingStatus = "accepted";
    await booking.save();

    await Pandit.findByIdAndUpdate(req.user.id, {
      isAvailable: false,
    });

    res.status(200).json({
      message: "Booking accepted ✅",
      booking,
    });
  } catch (error) {
    console.log("Accept Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// PANDIT REJECT BOOKING (AUTO REMATCH)
// ===============================
exports.rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }

    if (!booking.pandit) {
      return res.status(400).json({ message: "No pandit assigned ❌" });
    }

    if (booking.pandit.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    if (booking.bookingStatus !== "pending") {
      return res.status(400).json({
        message: `Booking already ${booking.bookingStatus} ❌`,
      });
    }

    // Save rejected pandit
    booking.rejectedPandits = booking.rejectedPandits || [];
    booking.rejectedPandits.push(booking.pandit);

    // Make current pandit available again
    await Pandit.findByIdAndUpdate(req.user.id, {
      isAvailable: true,
    });

    // Find next nearest pandit (same city)
    const pandits = await Pandit.find({
      "location.city": booking.city, // ✅ correct city filter
      isAvailable: true,
      "verification.isVerified": true,
      "location.latitude": { $ne: 0 },
      "location.longitude": { $ne: 0 },
      _id: { $nin: booking.rejectedPandits },
    });

    if (!pandits || pandits.length === 0) {
      booking.bookingStatus = "cancelled";
      booking.pandit = null;
      booking.cancellationReason =
        reason || "No pandits available after rejection";

      await booking.save();

      return res.status(200).json({
        message: "No pandits available. Booking cancelled ❌",
        booking,
      });
    }

    // Distance calculate
    const panditsWithDistance = pandits.map((p) => {
      const distance = getDistance(
        { latitude: booking.latitude, longitude: booking.longitude },
        { latitude: p.location.latitude, longitude: p.location.longitude }
      );

      return { pandit: p, distance };
    });

    panditsWithDistance.sort((a, b) => a.distance - b.distance);

    const nextPandit = panditsWithDistance[0].pandit;

    // Assign next pandit
    booking.pandit = nextPandit._id;
    booking.bookingStatus = "pending";
    booking.cancellationReason = "";

    await booking.save();

    res.status(200).json({
      message: "Booking rejected. Assigned next nearest pandit ✅",
      nextPandit,
      booking,
    });
  } catch (error) {
    console.log("Reject Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// PANDIT ARRIVED
// ===============================
exports.panditArrived = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }

    if (!booking.pandit) {
      return res.status(400).json({ message: "No pandit assigned ❌" });
    }

    if (booking.pandit.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    if (booking.bookingStatus !== "accepted") {
      return res.status(400).json({
        message: "Pandit can arrive only after accepting booking ❌",
      });
    }

    booking.bookingStatus = "arrived";
    booking.arrivedAt = new Date();

    await booking.save();

    res.status(200).json({
      message: "Pandit arrived successfully ✅",
      booking,
    });
  } catch (error) {
    console.log("Pandit Arrived Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// OTP VERIFY START
// ===============================
exports.verifyOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }

    if (!booking.pandit) {
      return res.status(400).json({ message: "No pandit assigned ❌" });
    }

    if (booking.pandit.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    if (booking.bookingStatus !== "otp_pending") {
      return res.status(400).json({
        message: "OTP can be verified only after payment ❌",
      });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        message: "Payment not completed ❌",
      });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required ❌" });
    }

    if (booking.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP ❌" });
    }

    booking.otpVerified = true;
    booking.bookingStatus = "started";

    await booking.save();

    res.status(200).json({
      message: "OTP verified. Puja started ✅",
      booking,
    });
  } catch (error) {
    console.log("Verify OTP Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// COMPLETE BOOKING
// ===============================
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found ❌" });
    }

    if (!booking.pandit) {
      return res.status(400).json({ message: "No pandit assigned ❌" });
    }

    if (booking.pandit.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    if (booking.bookingStatus !== "started") {
      return res.status(400).json({
        message: "Booking must be started before completion ❌",
      });
    }

    booking.bookingStatus = "completed";
    await booking.save();

    await Pandit.findByIdAndUpdate(req.user.id, {
      isAvailable: true,
    });

    res.status(200).json({
      message: "Booking completed successfully ✅",
      booking,
    });
  } catch (error) {
    console.log("Complete Booking Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET CUSTOMER BOOKINGS
// ===============================
exports.getCustomerBookings = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (req.user.id.toString() !== customerId.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    const bookings = await Booking.find({ customer: customerId })
      .populate(
        "pandit",
        "name phone profilePhoto templeName experienceYears location verification services languages"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.log("Get Customer Bookings Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET PANDIT BOOKINGS
// ===============================
exports.getPanditBookings = async (req, res) => {
  try {
    const { panditId } = req.params;

    if (req.user.id.toString() !== panditId.toString()) {
      return res.status(403).json({ message: "Not allowed ❌" });
    }

    const bookings = await Booking.find({ pandit: panditId })
      .populate("customer", "name phone email")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.log("Get Pandit Bookings Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
