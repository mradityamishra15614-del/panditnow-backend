const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Pandit = require("../models/Pandit");
const Admin = require("../models/Admin");

// ===============================
// CUSTOMER PROTECT
// ===============================
exports.protectCustomer = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized ❌" });
    }

    token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "customer") {
      return res.status(403).json({ message: "Access denied ❌" });
    }

    const customer = await Customer.findById(decoded.id).select("-password");

    if (!customer) {
      return res.status(401).json({ message: "Customer not found ❌" });
    }

    req.user = { id: customer._id.toString(), role: "customer" };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token ❌" });
  }
};

// ===============================
// PANDIT PROTECT
// ===============================
exports.protectPandit = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized ❌" });
    }

    token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "pandit") {
      return res.status(403).json({ message: "Access denied ❌" });
    }

    const pandit = await Pandit.findById(decoded.id).select("-password");

    if (!pandit) {
      return res.status(401).json({ message: "Pandit not found ❌" });
    }

    req.user = { id: pandit._id.toString(), role: "pandit" };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token ❌" });
  }
};

// ===============================
// ADMIN PROTECT
// ===============================
exports.protectAdmin = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized ❌" });
    }

    token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied ❌" });
    }

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found ❌" });
    }

    req.user = { id: admin._id.toString(), role: "admin" };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token ❌" });
  }
};
