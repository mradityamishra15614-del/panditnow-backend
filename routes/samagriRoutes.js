const express = require("express");
const router = express.Router();
const { getSamagriByPuja } = require("../controllers/samagriController");

// Public route (no auth required)
router.get("/:slug", getSamagriByPuja);

module.exports = router;