// server/src/controllers/eventController.js
const Event = require("../models/Event");
const Volunteer = require("../models/Volunteer");
const Group = require("../models/Group");

const createEvent = async (req, res) => {
  try {
    const data = req.body;
    data.organizer = req.user.userId;
    const event = await Event.create(data);

    // Auto-create a dedicated chat group for this event
    try {
      const eventGroup = new Group({
        name: `${event.title} — Chat`,
        description: `Event discussion group for ${event.title}`,
        orgId: req.user.userId,
        type: "event",
        eventId: event._id,
        icon: "🏖️",
        color: "#10B981",
        createdBy: req.user.userId,
        settings: { isPublic: false, allowFileUploads: false, allowMentions: true },
        members: [{ userId: req.user.userId, role: "admin", joinedAt: new Date() }],
      });
      await eventGroup.save();
    } catch (groupErr) {
      console.error("Failed to create event chat group (non-fatal):", groupErr.message);
    }

    res.status(201).json(event);
  } catch (err) {
    console.error(
      "Event creation error:",
      err.message,
      "\nRequest body:",
      req.body
    );
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", details: err.errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (
      event.organizer.toString() !== req.user.userId &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ message: "Forbidden" });

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const listEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.organizer) filter.organizer = req.query.organizer;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({ page, limit, total, totalPages, events });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// RSVP / register
const rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.attendees.includes(req.user.userId))
      return res.status(400).json({ message: "Already RSVP'd" });

    if (event.capacity && event.attendees.length >= event.capacity)
      return res.status(400).json({ message: "Event full" });

    event.attendees.push(req.user.userId);
    await event.save();
    res.json({ message: "RSVP successful", event });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel RSVP
const cancelRsvp = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    event.attendees = event.attendees.filter(
      (a) => a.toString() !== req.user.userId
    );
    await event.save();
    res.json({ message: "RSVP cancelled", event });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the event creator (organizer) or admin
    if (
      event.organizer.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this event" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  getEvent,
  listEvents,
  rsvpEvent,
  cancelRsvp,
  deleteEvent,
};
