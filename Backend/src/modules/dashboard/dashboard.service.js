const { repoHospitalUpdateStatus } = require('./dashboard.repo');

async function serviceHospitalUpdateStatus(ulbid) {
  return repoHospitalUpdateStatus(ulbid);
}

module.exports = {
  serviceHospitalUpdateStatus,
};
