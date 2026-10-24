const express = require('express');
const validate = require('../../middleware/validate.middleware');
const { hospitalInsSchema } = require('./hospitalMst.validation');
const { getHospitalList, getHospitalById, insertHospital } = require('./hospitalMst.controller');

const router = express.Router();

router.post('/hospitalList', getHospitalList);
router.post('/hspListById', getHospitalById);
router.post('/insertHospital', validate(hospitalInsSchema), insertHospital);

module.exports = router;
