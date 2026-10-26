const { serviceHospitalUpdateStatus } = require('./dashboard.service');
const { logApiSuccess, logApiError } = require('../../utils/log');

async function getHospitalUpdateStatus(req, res, next) {
  try {
    const ulbid = req.body?.ulbid || req.body?.ulbId || req.query?.ulbid || req.query?.ulbId || 790;
    const rows = await serviceHospitalUpdateStatus(ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Hospital Update Status fetched successfully');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Hospital Update Status fetch error');
    return next(error);
  }
}

module.exports = {
  getHospitalUpdateStatus,
};
