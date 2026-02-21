const express = require("express");
const router = express.Router();

const {
  getVerifiedPandits,
  updatePanditProfile,
  toggleAvailability,
} = require("../controllers/panditController");

const { protectPandit } = require("../middleware/authMiddleware");

// Multer middleware import
const upload = require("../middleware/multer");

// ===============================
// GET Verified + Available Pandits
// ===============================
router.get("/verified", getVerifiedPandits);

// ===============================
// UPDATE Pandit Profile (Protected)
// profilePhoto upload supported
// ===============================
router.put(
  "/update-profile",
  protectPandit,
  upload.single("profilePhoto"),
  updatePanditProfile
);

// ===============================
// TOGGLE PANDIT AVAILABILITY (Online/Offline)
// ===============================
router.put("/toggle-availability", protectPandit, toggleAvailability);

module.exports = router;
