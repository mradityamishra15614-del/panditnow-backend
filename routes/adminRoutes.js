const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Pandit = require("../models/Pandit");
const Admin = require("../models/Admin");

// ===============================
// ADMIN LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password ❌" });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password ❌" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Admin Login Successful ✅",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================
// ADMIN AUTH MIDDLEWARE
// ===============================
const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "Not authorized ❌" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied ❌" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token ❌" });
  }
};

// ===============================
// GET ALL PANDITS (ADMIN ONLY)
// ===============================
router.get("/pandits", protectAdmin, async (req, res) => {
  try {
    const pandits = await Pandit.find().select("-password");
    res.status(200).json(pandits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================
// VERIFY PANDIT (ADMIN ONLY)
// ===============================
router.put("/pandits/:panditId/verify", protectAdmin, async (req, res) => {
  try {
    const { panditId } = req.params;

    const pandit = await Pandit.findById(panditId);

    if (!pandit) {
      return res.status(404).json({ message: "Pandit not found ❌" });
    }

    pandit.verification.isVerified = true;
    await pandit.save();

    res.status(200).json({ message: "Pandit Verified ✅", pandit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================
// UNVERIFY PANDIT (ADMIN ONLY)
// ===============================
router.put("/pandits/:panditId/unverify", protectAdmin, async (req, res) => {
  try {
    const { panditId } = req.params;

    const pandit = await Pandit.findById(panditId);

    if (!pandit) {
      return res.status(404).json({ message: "Pandit not found ❌" });
    }

    pandit.verification.isVerified = false;
    await pandit.save();

    res.status(200).json({ message: "Pandit Unverified ❌", pandit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
