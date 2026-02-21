const Pandit = require("../models/Pandit");

// ===============================
// GET ALL PANDITS (Admin)
// ===============================
exports.getAllPandits = async (req, res) => {
  try {
    const pandits = await Pandit.find().sort({ createdAt: -1 });
    res.status(200).json(pandits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// VERIFY PANDIT (Admin)
// ===============================
exports.verifyPandit = async (req, res) => {
  try {
    const { panditId } = req.params;

    const pandit = await Pandit.findById(panditId);

    if (!pandit) {
      return res.status(404).json({ message: "Pandit not found" });
    }

    pandit.verification.isVerified = true;
    pandit.agreementSigned = true;

    await pandit.save();

    res.status(200).json({
      message: "Pandit verified successfully ✅",
      pandit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// UNVERIFY / BLOCK PANDIT
// ===============================
exports.blockPandit = async (req, res) => {
  try {
    const { panditId } = req.params;

    const pandit = await Pandit.findById(panditId);

    if (!pandit) {
      return res.status(404).json({ message: "Pandit not found" });
    }

    pandit.verification.isVerified = false;
    pandit.isAvailable = false;

    await pandit.save();

    res.status(200).json({
      message: "Pandit blocked successfully ❌",
      pandit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
