const mongoose = require("mongoose");
const slugify = require("slugify");
const dotenv = require("dotenv");
const Puja = require("../models/Puja");

dotenv.config();

const updateSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const pujas = await Puja.find();

    for (let puja of pujas) {
      puja.slug = slugify(puja.name, { lower: true });
      await puja.save();
      console.log(`Updated slug for: ${puja.name}`);
    }

    console.log("All slugs updated successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updateSlugs();