const { repoHospitalList, repoHospitalById, repoHospitalIns, repoBedCategoryList, repoBedCategoryIns, repoBedAvailabilityList } = require('./hospitalMst.repo');

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

module.exports = {
  serviceHospitalList,
  serviceHospitalById,
  serviceHospitalIns,
  serviceBedCategoryList,
  serviceBedCategoryIns,
  serviceBedAvailabilityList,
};
