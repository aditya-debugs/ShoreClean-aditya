// server/src/routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  issueCertificatesForEvent,
  issueCertificate,
  listCertificates,
  getCertificateById,
  downloadCertificate,
  deleteCertificate,
} = require('../controllers/certificateController');

// Issue certificates to all eligible volunteers for an event (org/admin)
router.post('/issue-event/:eventId', protect, issueCertificatesForEvent);

// Issue a single certificate manually (org/admin)
router.post('/issue', protect, issueCertificate);

// List certificates (volunteer sees their own; org/admin can filter)
router.get('/', protect, listCertificates);

// Get a single certificate
router.get('/:id', protect, getCertificateById);

// Download / stream the PDF for a certificate
router.get('/:id/download', protect, downloadCertificate);

// Revoke / delete a certificate (org/admin)
router.delete('/:id', protect, deleteCertificate);

module.exports = router;
