const { repoHospitalList, repoHospitalById } = require('./hospitalMst.repo');

async function serviceHospitalList(ulbid) {
  return repoHospitalList(ulbid);
}

async function serviceHospitalById(hospitalId, ulbId) {
  return repoHospitalById(hospitalId, ulbId);
}

module.exports = {
  serviceHospitalList,
  serviceHospitalById,
};
