const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet"); // ✅ ADDED
const rateLimit = require("express-rate-limit"); // ✅ ADDED
const connectDB = require("./config/db");

// Load ENV variables FIRST
dotenv.config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const panditRoutes = require("./routes/panditRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const pujaRoutes = require("./routes/pujaRoutes");
connectDB();

const app = express();

// ✅ SECURITY MIDDLEWARE
app.use(helmet()); // Protects against common browser attacks

// ✅ RATE LIMITER
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: "Too many requests, please try again later ❌",
});

app.use(limiter);

app.use(cors());

// ✅ Razorpay Webhook needs RAW body (IMPORTANT: keep BEFORE express.json)
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// ✅ Normal JSON body for all other routes
app.use(express.json());

// ✅ Logger (put BEFORE routes)
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/pandits", panditRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/pujas", pujaRoutes);

app.get("/", (req, res) => {
  res.send("PanditNow Backend Running ✅");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PanditNow Server Running on http://localhost:${PORT}`);
});