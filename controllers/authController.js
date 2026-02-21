const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Customer = require("../models/Customer");
const Pandit = require("../models/Pandit");

// helper to convert comma separated services to array
const parseServices = (services) => {
  if (!services) return [];

  // if already array
  if (Array.isArray(services)) return services.map((s) => s.trim()).filter(Boolean);

  // if string like "puja, havan"
  return services
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ===============================
// CUSTOMER SIGNUP
// ===============================
exports.customerSignup = async (req, res) => {
  try {
    let { name, phone, email, password } = req.body;

    // normalize values
    name = name?.trim();
    phone = phone?.trim();
    email = email ? email.trim().toLowerCase() : "";

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Name, phone, password required" });
    }

    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = new Customer({
      name,
      phone,
      email,
      password: hashedPassword,
    });

    await newCustomer.save();

    // AUTO LOGIN TOKEN CREATED
    const token = jwt.sign(
      { id: newCustomer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Customer registered successfully ✅",
      token,
      customer: newCustomer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// CUSTOMER LOGIN
// ===============================
exports.customerLogin = async (req, res) => {
  try {
    let { phone, password } = req.body;

    phone = phone?.trim();

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required" });
    }

    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(400).json({ message: "Customer not found" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: customer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Customer login successful ✅",
      token,
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// PANDIT SIGNUP
// ===============================
exports.panditSignup = async (req, res) => {
  try {
    let {
      name,
      phone,
      email,
      password,
      city,
      address,
      latitude,
      longitude,
      services,
      aadharNumber,
    } = req.body;

    // normalize values
    name = name?.trim();
    phone = phone?.trim();
    email = email ? email.trim().toLowerCase() : "";
    city = city?.trim().toLowerCase();
    address = address?.trim() || "";
    aadharNumber = aadharNumber?.trim();

    const servicesArray = parseServices(services);

    if (!name || !phone || !password || !city || !aadharNumber) {
      return res.status(400).json({
        message: "Name, phone, password, city and aadharNumber required",
      });
    }

    // aadhar validation (basic)
    if (aadharNumber.length !== 12 || isNaN(aadharNumber)) {
      return res.status(400).json({
        message: "Invalid Aadhar number (must be 12 digits)",
      });
    }

    const existingPandit = await Pandit.findOne({ phone });

    if (existingPandit) {
      return res.status(400).json({ message: "Pandit already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPandit = new Pandit({
      name,
      phone,
      email,
      password: hashedPassword,

      location: {
        city,
        address,
        latitude: latitude || 0,
        longitude: longitude || 0,
      },

      services: servicesArray,

      verification: {
        aadharNumber,
        isVerified: false,
      },
    });

    await newPandit.save();

    // ✅ AUTO LOGIN TOKEN (BEST)
    const token = jwt.sign(
      { id: newPandit._id, role: "pandit" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Pandit registered successfully ✅",
      token,
      pandit: newPandit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// PANDIT LOGIN
// ===============================
exports.panditLogin = async (req, res) => {
  try {
    let { phone, password } = req.body;

    phone = phone?.trim();

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required" });
    }

    const pandit = await Pandit.findOne({ phone });

    if (!pandit) {
      return res.status(400).json({ message: "Pandit not found" });
    }

    const isMatch = await bcrypt.compare(password, pandit.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: pandit._id, role: "pandit" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Pandit login successful ✅",
      token,
      pandit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GOOGLE CUSTOMER LOGIN/SIGNUP
// ===============================
exports.googleCustomerLogin = async (req, res) => {
  try {
    let { name, email } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    let customer = await Customer.findOne({ email });

    // If not exist, create new customer
    if (!customer) {
      const hashedPassword = await bcrypt.hash("google_login", 10);

      customer = new Customer({
        name: name || "Google User",
        email,
        phone: "google_" + Date.now(),
        password: hashedPassword,
      });

      await customer.save();
    }

    const token = jwt.sign(
      { id: customer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Google login successful ✅",
      token,
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
