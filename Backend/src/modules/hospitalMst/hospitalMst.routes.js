const express = require('express');
const validate = require('../../middleware/validate.middleware');
const { hospitalInsSchema, bedCategoryInsSchema, bedAvailabilityInsSchema } = require('./hospitalMst.validation');
const {
  getHospitalList,
  getHospitalById,
  insertHospital,
  getBedCategoryList,
  insertBedCategory,
  getBedAvailabilityList,
  getBedAvailabilityCounts,
  getHospitalDropdownList,
  insertBedAvailability,
  getHospitalBedSummary,
  getBedAvailabilityLog,
  getUserDropdownList,
} = require('./hospitalMst.controller');

const router = express.Router();

router.post('/hospitalList', getHospitalList);
router.post('/hspListById', getHospitalById);
router.post('/insertHospital', validate(hospitalInsSchema), insertHospital);
router.post('/bedCategoryList', getBedCategoryList);
router.post('/insertBedCategory', validate(bedCategoryInsSchema), insertBedCategory);
router.post('/bedAvailabilityList', getBedAvailabilityList);
router.post('/bedCounts', getBedAvailabilityCounts);
router.post('/hospitalDropdownList', getHospitalDropdownList);
router.post('/insertBedAvailability', validate(bedAvailabilityInsSchema), insertBedAvailability);
router.post('/hospitalBedSummary', getHospitalBedSummary);
router.post('/bedAvailabilityHistory', getBedAvailabilityLog);
router.post('/userDropdownList', getUserDropdownList);

module.exports = router;


