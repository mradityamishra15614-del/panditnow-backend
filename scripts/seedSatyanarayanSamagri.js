const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Puja = require("../models/Puja");
const PujaSamagri = require("../models/PujaSamagri");

dotenv.config();

const seedSamagri = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const puja = await Puja.findOne({ slug: "satyanarayan-puja-katha" });

    if (!puja) {
      console.log("Puja not found");
      process.exit();
    }

    await PujaSamagri.deleteMany({ puja: puja._id });

    await PujaSamagri.create({
      puja: puja._id,
      city: "default",
      language: "hindi",
      items: [
        { name: "भगवान विष्णु की मूर्ति/चित्र", quantity: "1", category: "main" },
        { name: "चौकी", quantity: "1", category: "main" },
        { name: "पीला कपड़ा", quantity: "1", category: "cloth" },
        { name: "कलश", quantity: "1", category: "main" },
        { name: "आम के पत्ते", quantity: "5", category: "main" },
        { name: "नारियल", quantity: "1", category: "main" },
        { name: "रोली", quantity: "1 डिब्बी", category: "main" },
        { name: "चावल", quantity: "250 ग्राम", category: "main" },
        { name: "हल्दी", quantity: "50 ग्राम", category: "main" },
        { name: "अगरबत्ती", quantity: "1 पैकेट", category: "main" },
        { name: "दीपक", quantity: "1", category: "main" },
        { name: "घी", quantity: "250 ग्राम", category: "main" },
        { name: "फूल", quantity: "1 माला", category: "fruits" },
        { name: "पंचामृत सामग्री", quantity: "", category: "main" },
        { name: "पंच फल", quantity: "5 प्रकार", category: "fruits" },
        { name: "पान", quantity: "5", category: "main" },
        { name: "सुपारी", quantity: "5", category: "main" },
        { name: "धूप", quantity: "1", category: "main" },
        { name: "हवन सामग्री", quantity: "1 पैकेट", category: "havan" }
      ]
    });

    console.log("Satyanarayan Puja Katha Samagri Seeded Successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedSamagri();