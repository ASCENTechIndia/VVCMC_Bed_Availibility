const { repoHospitalList, repoHospitalById, repoHospitalIns, repoBedCategoryList, repoBedCategoryIns, repoBedAvailabilityList, repoBedAvailabilityCounts, repoHospitalDropdownList, repoBedAvailabilityIns } = require('./hospitalMst.repo');

async function serviceHospitalList(ulbid) {
  return repoHospitalList(ulbid);
}

async function serviceHospitalById(hospitalId, ulbId) {
  return repoHospitalById(hospitalId, ulbId);
}

async function serviceHospitalIns(payload) {
  return repoHospitalIns(payload);
}

async function serviceBedCategoryList(ulbid) {
  return repoBedCategoryList(ulbid);
}

async function serviceBedCategoryIns(payload) {
  return repoBedCategoryIns(payload);
}

async function serviceBedAvailabilityList(hospitalId, ulbId) {
  return repoBedAvailabilityList(hospitalId, ulbId);
}

async function serviceBedAvailabilityCounts(ulbid) {
  return repoBedAvailabilityCounts(ulbid);
}

async function serviceHospitalDropdownList(ulbid) {
  return repoHospitalDropdownList(ulbid);
}

async function serviceBedAvailabilityIns(payload) {
  return repoBedAvailabilityIns(payload);
}

module.exports = {
  serviceHospitalList,
  serviceHospitalById,
  serviceHospitalIns,
  serviceBedCategoryList,
  serviceBedCategoryIns,
  serviceBedAvailabilityList,
  serviceBedAvailabilityCounts,
  serviceHospitalDropdownList,
  serviceBedAvailabilityIns,
};
