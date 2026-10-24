const express = require('express');
const { getHospitalList, getHospitalById } = require('./hospitalMst.controller');

const router = express.Router();

router.post('/hospitalList', getHospitalList);
router.post('/hspListById', getHospitalById);

module.exports = router;
