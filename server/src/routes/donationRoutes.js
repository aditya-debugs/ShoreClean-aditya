// server/src/routes/donationRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createDonation, listDonations, getStripeReceipt } = require('../controllers/donationController');

router.post('/', createDonation);
router.get('/', protect, authorize('org', 'admin'), listDonations);
router.get('/stripe-receipt', protect, getStripeReceipt);

module.exports = router;
