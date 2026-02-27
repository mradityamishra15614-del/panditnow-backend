const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Puja = require("../models/Puja");

dotenv.config();

const addMissingPujas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const pujasToAdd = [
      {
        name: "Satyanarayan Puja Katha",
        category: "puja",
        fixedPrice: 1100
      },
      {
        name: "Lakshmi Puja",
        category: "puja",
        fixedPrice: 3000
      }
    ];

    for (let data of pujasToAdd) {
      const exists = await Puja.findOne({ name: data.name });

      if (!exists) {
        await Puja.create(data);
        console.log(`${data.name} added`);
      } else {
        console.log(`${data.name} already exists`);
      }
    }

    console.log("Done");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

addMissingPujas();