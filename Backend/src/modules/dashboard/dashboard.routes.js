const express = require('express');
const { getHospitalUpdateStatus } = require('./dashboard.controller');

const router = express.Router();

router.post('/hospitalUpdateStatus', getHospitalUpdateStatus);
router.get('/hospitalUpdateStatus', getHospitalUpdateStatus);

module.exports = router;
