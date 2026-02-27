const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const Puja = require("./models/Puja");

const pujas = [
  // Existing
  { name: "Griha Pravesh", category: "puja", fixedPrice: 1500 },
  { name: "Vivah Puja", category: "puja", fixedPrice: 5100 },
  { name: "Havan", category: "puja", fixedPrice: 2100 },
  { name: "Shradh", category: "puja", fixedPrice: 1800 },

  // New Puja
  { name: "Yagnopavit", category: "puja", fixedPrice: 2000 },
  { name: "Vastu Puja", category: "puja", fixedPrice: 2200 },
  { name: "Rudrabhishek", category: "puja", fixedPrice: 2500 },
  { name: "Grah Shanti Puja", category: "puja", fixedPrice: 2300 },
  { name: "Bhoot Pisach Shanti", category: "puja", fixedPrice: 2600 },
  { name: "Yantra Mantra", category: "puja", fixedPrice: 2400 },
  { name: "Durga Saptashati Path", category: "puja", fixedPrice: 3100 },
  { name: "Chandi Path", category: "puja", fixedPrice: 3200 },
  { name: "Sat Chandi", category: "puja", fixedPrice: 4100 },
  { name: "Sahastra Chandi", category: "puja", fixedPrice: 6100 },

  // Jap
  { name: "Vishnu Jap", category: "jap", fixedPrice: 1100 },
  { name: "Mahamrityunjay Jap", category: "jap", fixedPrice: 1500 },
  { name: "Vishnu Sahastra Jap", category: "jap", fixedPrice: 1300 },
  { name: "Santan Gopal Jap", category: "jap", fixedPrice: 1400 },
  { name: "Gayatri Jap", category: "jap", fixedPrice: 1000 },
  { name: "Navgrah Jap", category: "jap", fixedPrice: 1600 },

  // Paath
  { name: "Vishnu Sahastra Naam Paath", category: "paath", fixedPrice: 1500 },
  { name: "Santan Gopal Paath", category: "paath", fixedPrice: 1500 },
  { name: "Gopal Sahastra Paath", category: "paath", fixedPrice: 1700 },
  { name: "Sunderkand Paath", category: "paath", fixedPrice: 2100 },
  { name: "Hanuman Paath", category: "paath", fixedPrice: 1900 },
  { name: "Ramcharitmanas Paath", category: "paath", fixedPrice: 3500 },
  { name: "Hanuman Sahastra Namavali Paath", category: "paath", fixedPrice: 2500 },
];

const seed = async () => {
  try {
    await connectDB();

    await Puja.deleteMany(); // clear old (only first time)
    await Puja.insertMany(pujas);

    console.log("✅ Puja data inserted successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();