const PujaSamagri = require("../models/PujaSamagri");
const Puja = require("../models/Puja");

// GET samagri by puja slug + city + language
exports.getSamagriByPuja = async (req, res) => {
  try {
    const { slug } = req.params;
    const { city = "default", language = "hindi" } = req.query;

    // Find puja by slug
    const puja = await Puja.findOne({ slug });

    if (!puja) {
      return res.status(404).json({ message: "Puja not found" });
    }

    // Try city-specific first
    let samagri = await PujaSamagri.findOne({
      puja: puja._id,
      city,
      language,
    });

    // Fallback to default city
    if (!samagri) {
      samagri = await PujaSamagri.findOne({
        puja: puja._id,
        city: "default",
        language,
      });
    }

    if (!samagri) {
      return res.status(404).json({ message: "Samagri not found" });
    }

    res.status(200).json({
      puja: puja.name,
      city,
      language,
      items: samagri.items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};