const { repoHospitalList, repoHospitalById, repoHospitalIns } = require('./hospitalMst.repo');

async function serviceHospitalList(ulbid) {
  return repoHospitalList(ulbid);
}

async function serviceHospitalById(hospitalId, ulbId) {
  return repoHospitalById(hospitalId, ulbId);
}

async function serviceHospitalIns(payload) {
  return repoHospitalIns(payload);
}

module.exports = {
  serviceHospitalList,
  serviceHospitalById,
  serviceHospitalIns,
};
