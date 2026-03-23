const mongoose = require("mongoose");

const markerSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, default: "" },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  before_img: { type: String, default: "" },
  after_img: { type: String, default: "" },
  creator_id: { type: String, default: "anonymous" },
  creator_name: { type: String, default: "Anonymous" },
  status: {
    type: String,
    enum: ["pending", "ongoing", "completed"],
    default: "pending",
  },
  remark: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Marker", markerSchema);
