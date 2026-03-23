const express = require("express");
const router = express.Router();
const Marker = require("../models/Marker");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function getAddress(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "ShoreCleanApp/1.0" },
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.display_name || "";
  } catch {
    return "";
  }
}

// Create marker with name, description, before_img (base64), creator info
router.post("/", async (req, res) => {
  try {
    const { latitude, longitude, name, description, before_img, creator_id, creator_name } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name/title is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }
    if (!before_img) {
      return res.status(400).json({ error: "Before image is required" });
    }

    const address = await getAddress(latitude, longitude);
    const marker = new Marker({
      latitude,
      longitude,
      address,
      name: name.trim(),
      description: description.trim(),
      before_img,
      creator_id: creator_id || "anonymous",
      creator_name: creator_name || "Anonymous",
      status: "pending",
    });
    await marker.save();
    res.status(201).json(marker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit marker (only allowed when pending)
router.patch("/:id/edit", async (req, res) => {
  try {
    const { name, description, before_img } = req.body;
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: "Marker not found" });
    if (marker.status !== "pending") {
      return res.status(400).json({ error: "Only pending markers can be edited" });
    }

    if (name && name.trim()) marker.name = name.trim();
    if (description && description.trim()) marker.description = description.trim();
    if (before_img) marker.before_img = before_img;

    await marker.save();
    res.json(marker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update marker status (pending → ongoing only)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "ongoing", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: "Marker not found" });

    // Enforce valid transitions: pending → ongoing only via this route
    if (marker.status === "completed") {
      return res.status(400).json({ error: "Completed markers cannot be changed" });
    }
    if (!marker.address) {
      marker.address = await getAddress(marker.latitude, marker.longitude);
    }
    marker.status = status;
    await marker.save();
    res.json(marker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update marker remark
router.patch("/:id/remark", async (req, res) => {
  try {
    const { remark } = req.body;
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: "Marker not found" });
    marker.remark = remark || "";
    await marker.save();
    res.json(marker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete task - store after_img (base64) and mark completed
router.post("/:id/complete", async (req, res) => {
  try {
    const { after_img } = req.body;
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: "Marker not found" });
    if (marker.status !== "ongoing") {
      return res.status(400).json({ error: "Only ongoing markers can be completed" });
    }

    marker.status = "completed";
    if (after_img) marker.after_img = after_img;
    await marker.save();
    res.json(marker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fetch all markers — images excluded for fast initial load
router.get("/", async (req, res) => {
  try {
    const markers = await Marker.find()
      .select("-before_img -after_img")
      .sort({ createdAt: -1 });
    res.json(markers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch single marker by ID — includes full image data
router.get("/:id", async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: "Marker not found" });
    res.json(marker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete marker (only pending markers)
router.delete("/:id", async (req, res) => {
  try {
    const marker = await Marker.findById(req.params.id);
    if (!marker) return res.status(404).json({ error: "Marker not found" });
    if (marker.status !== "pending") {
      return res.status(400).json({ error: "Only pending markers can be deleted" });
    }
    await Marker.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
