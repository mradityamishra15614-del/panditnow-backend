const express = require("express");
const router = express.Router();

const {
  customerSignup,
  customerLogin,
  panditSignup,
  panditLogin,
  googleCustomerLogin
} = require("../controllers/authController");

// Customer Auth
router.post("/customer/signup", customerSignup);
router.post("/customer/login", customerLogin);

// Google Customer Login
router.post("/customer/google", googleCustomerLogin);


// Pandit Auth
router.post("/pandit/signup", panditSignup);
router.post("/pandit/login", panditLogin);

module.exports = router;
