// server/src/controllers/certificateController.js
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateCertificatePDF } = require('../utils/certificateGen');

/**
 * POST /api/certificates/issue-event/:eventId
 * Organization: Issue certificates to all checked-out (or checked-in) volunteers for an event.
 */
const issueCertificatesForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Only organizer of the event or admin can issue
    if (
      event.organizer.toString() !== req.user.userId &&
      !['admin', 'org'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized to issue certificates' });
    }

    // Find all registrations that are checked-in or checked-out
    const registrations = await Registration.find({
      event: eventId,
      status: { $in: ['checked-in', 'checked-out'] },
    }).populate('user', 'name email');

    if (!registrations.length) {
      return res.status(400).json({ message: 'No eligible volunteers found for this event' });
    }

    const issued = [];
    const skipped = [];

    for (const reg of registrations) {
      if (!reg.user) continue;

      // Skip if already issued
      const existing = await Certificate.findOne({ event: eventId, user: reg.user._id });
      if (existing) {
        skipped.push(reg.user._id);
        continue;
      }

      const cert = await Certificate.create({
        event: eventId,
        user: reg.user._id,
        issuedAt: new Date(),
        metadata: {
          volunteerName: reg.user.name,
          eventTitle: event.title,
          eventDate: event.startDate,
          eventLocation: event.location,
          issuedBy: req.user.userId,
        },
      });
      issued.push(cert);
    }

    res.status(201).json({
      message: `Issued ${issued.length} certificates. Skipped ${skipped.length} (already issued).`,
      issued,
      skipped,
    });
  } catch (err) {
    console.error('issueCertificatesForEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/certificates/issue
 * Issue a single certificate (org/admin).
 */
const issueCertificate = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if already issued
    const existing = await Certificate.findOne({ event: eventId, user: userId });
    if (existing) {
      return res.status(400).json({ message: 'Certificate already issued for this volunteer and event', certificate: existing });
    }

    const cert = await Certificate.create({
      event: eventId,
      user: userId,
      issuedAt: new Date(),
      metadata: {
        volunteerName: user.name,
        eventTitle: event.title,
        eventDate: event.startDate,
        eventLocation: event.location,
        issuedBy: req.user.userId,
      },
    });

    res.status(201).json(cert);
  } catch (err) {
    console.error('issueCertificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/certificates
 * List certificates.
 * - Org/Admin: can filter by ?event=id, get all
 * - Volunteer: gets only their own
 */
const listCertificates = async (req, res) => {
  try {
    const q = {};

    if (req.user.role === 'user') {
      // Regular volunteer — only their certs
      q.user = req.user.userId;
    } else {
      // Org/admin — can filter
      if (req.query.user) q.user = req.query.user;
      if (req.query.event) q.event = req.query.event;
    }

    const list = await Certificate.find(q)
      .populate('event', 'title startDate location')
      .populate('user', 'name email')
      .sort({ issuedAt: -1 });

    res.json(list);
  } catch (err) {
    console.error('listCertificates error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/certificates/:id
 * Get a single certificate by ID.
 */
const getCertificateById = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('event', 'title startDate location description')
      .populate('user', 'name email');

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    // Only the cert owner, org/admin can view
    if (
      req.user.role === 'user' &&
      cert.user && cert.user._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(cert);
  } catch (err) {
    console.error('getCertificateById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/certificates/:id/download
 * Stream a generated PDF certificate.
 */
const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('event', 'title startDate location')
      .populate('user', 'name email');

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    // Only the cert owner, org/admin can download
    // Safe check: what if user was deleted and cert.user is null?
    if (
      req.user.role === 'user' &&
      cert.user && cert.user._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const pdfBuffer = await generateCertificatePDF({
      volunteerName: cert.user?.name || cert.metadata?.volunteerName || 'Volunteer',
      eventTitle: cert.event?.title || cert.metadata?.eventTitle || 'Coastal Cleanup Event',
      eventDate: cert.event?.startDate || cert.metadata?.eventDate || cert.issuedAt,
      eventLocation: cert.event?.location || cert.metadata?.eventLocation || '',
      issuedAt: cert.issuedAt,
      certId: cert._id.toString(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ShoreClean-Certificate-${cert._id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('downloadCertificate error:', err);
    res.status(500).json({ message: 'Server error generating certificate' });
  }
};

/**
 * DELETE /api/certificates/:id
 * Delete (revoke) a certificate — org/admin only.
 */
const deleteCertificate = async (req, res) => {
  try {
    if (!['admin', 'org'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    res.json({ message: 'Certificate revoked successfully' });
  } catch (err) {
    console.error('deleteCertificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  issueCertificatesForEvent,
  issueCertificate,
  listCertificates,
  getCertificateById,
  downloadCertificate,
  deleteCertificate,
};
