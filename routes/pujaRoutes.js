const express = require("express");
const router = express.Router();
const Puja = require("../models/Puja");

// GET ALL ACTIVE PUJAS
router.get("/", async (req, res) => {
  try {
    const pujas = await Puja.find({ isActive: true }).sort({ name: 1 });
    res.json(pujas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;