// server/src/routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { issueCertificate, listCertificates } = require('../controllers/certificateController');

router.post('/issue', protect, authorize('org', 'admin'), issueCertificate); // org/admin issues
router.get('/', protect, listCertificates);
router.get('/:id/download', protect, async (req, res) => {
  try {
    const Certificate = require('../models/Certificate');
    const cert = await Certificate.findById(req.params.id).populate('event', 'title').populate('user', 'name');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    // Only allow the cert owner or admin to download
    if (cert.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ certUrl: cert.certUrl, cert });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
