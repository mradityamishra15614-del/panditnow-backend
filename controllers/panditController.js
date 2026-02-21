const Pandit = require("../models/Pandit");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ===============================
// ✅ GET Verified + Available Pandits
// ===============================
exports.getVerifiedPandits = async (req, res) => {
  try {
    const pandits = await Pandit.find({
      "verification.isVerified": true,
      isAvailable: true,
      "location.latitude": { $ne: 0 },
      "location.longitude": { $ne: 0 },
    }).select("-password");

    res.status(200).json(pandits);
  } catch (error) {
    console.log("Error fetching verified pandits:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// ✅ UPDATE PANDIT PROFILE
// ===============================
exports.updatePanditProfile = async (req, res) => {
  try {
    const panditId = req.user?.id;

    if (!panditId) {
      return res.status(401).json({ message: "Unauthorized ❌" });
    }

    let {
      introVideo,
      experienceYears,
      languages,
      templeName,
      services,
      pricingType,
      basePrice,
      city,
      address,
      state,
      pincode,
      latitude,
      longitude,
    } = req.body;

    // normalize values
    if (city) city = city.trim().toLowerCase();
    if (address) address = address.trim();
    if (state) state = state.trim();
    if (pincode) pincode = pincode.trim();
    if (templeName) templeName = templeName.trim();
    if (introVideo) introVideo = introVideo.trim();

    // Convert services/languages if string
    if (typeof services === "string") {
      services = services
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    if (typeof languages === "string") {
      languages = languages
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }

    // Convert numeric fields
    if (experienceYears !== undefined)
      experienceYears = Number(experienceYears);

    if (basePrice !== undefined) basePrice = Number(basePrice);

    if (latitude !== undefined) latitude = Number(latitude);
    if (longitude !== undefined) longitude = Number(longitude);

    // ===============================
    // Build Update Object
    // ===============================
    const updateData = {};

    if (introVideo !== undefined) updateData.introVideo = introVideo;
    if (!isNaN(experienceYears)) updateData.experienceYears = experienceYears;

    if (templeName !== undefined) updateData.templeName = templeName;

    if (services !== undefined) updateData.services = services;
    if (languages !== undefined) updateData.languages = languages;

    if (pricingType !== undefined) updateData.pricingType = pricingType;
    if (!isNaN(basePrice)) updateData.basePrice = basePrice;

    // Update nested location fields safely (DO NOT overwrite full location object)
    if (city !== undefined) updateData["location.city"] = city;
    if (address !== undefined) updateData["location.address"] = address;
    if (state !== undefined) updateData["location.state"] = state;
    if (pincode !== undefined) updateData["location.pincode"] = pincode;

    if (!isNaN(latitude)) updateData["location.latitude"] = latitude;
    if (!isNaN(longitude)) updateData["location.longitude"] = longitude;

    // ===============================
    // ✅ PROFILE PHOTO UPLOAD (Cloudinary)
    // ===============================
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "panditnow/profilePhotos"
      );

      updateData.profilePhoto = uploadResult.secure_url;
    }

    const updatedPandit = await Pandit.findByIdAndUpdate(
      panditId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedPandit) {
      return res.status(404).json({ message: "Pandit not found ❌" });
    }

    res.status(200).json({
      message: "Pandit profile updated successfully ✅",
      pandit: updatedPandit,
    });
  } catch (error) {
    console.log("Update profile error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
exports.toggleAvailability = async (req, res) => {
  try {
    const panditId = req.user?.id;

    if (!panditId) {
      return res.status(401).json({ message: "Unauthorized ❌" });
    }

    const pandit = await Pandit.findById(panditId);

    if (!pandit) {
      return res.status(404).json({ message: "Pandit not found ❌" });
    }

    // Toggle availability
    pandit.isAvailable = !pandit.isAvailable;

    await pandit.save();

    res.status(200).json({
      message: `Pandit is now ${pandit.isAvailable ? "ONLINE ✅" : "OFFLINE ❌"}`,
      isAvailable: pandit.isAvailable,
      pandit,
    });
  } catch (error) {
    console.log("Toggle Availability Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
