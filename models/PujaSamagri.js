const mongoose = require("mongoose");

const samagriItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    enum: ["main", "havan", "cloth", "fruits", "optional", "other"],
    default: "main"
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  canProvideByPlatform: {
    type: Boolean,
    default: true
  }
});

const pujaSamagriSchema = new mongoose.Schema(
  {
    puja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Puja",
      required: true
    },
    city: {
      type: String,
      default: "default"
    },
    language: {
      type: String,
      enum: ["hindi", "english"],
      required: true
    },
    items: [samagriItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("PujaSamagri", pujaSamagriSchema);