const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("../models/Admin");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
  try {
    const adminEmail = "mr.adityamishra15614@gmail.com"; // change this
    const adminPassword = "Bholenath#hathsarpar12102003@"; // change this

    const adminExists = await Admin.findOne({ email: adminEmail });

    if (adminExists) {
      console.log("Admin already exists ✅");
      process.exit();
    }

    const admin = await Admin.create({
      name: "Owner Admin",
      email: adminEmail,
      password: adminPassword,
    });

    console.log("Admin Created Successfully ✅");
    console.log("Email:", admin.email);

    process.exit();
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

createAdmin();
