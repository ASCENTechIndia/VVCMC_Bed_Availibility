const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.ok(null, 'ok');
});

router.get('/ready', (req, res) => {
  return res.ok(null, 'ready');
});

router.use('/auth', authRoutes);
router.use('/registerComplaint', require('../modules/registerComplaint/registerComplaint.routes'));
router.use('/hospitalMst', require('../modules/hospitalMst/hospitalMst.routes'));
router.use('/dashboard', require('../modules/dashboard/dashboard.routes'));

module.exports = router;
