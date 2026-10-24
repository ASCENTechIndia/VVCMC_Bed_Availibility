const { serviceHospitalList, serviceHospitalById } = require('./hospitalMst.service');
const { logApiSuccess, logApiError } = require('../../utils/log');

async function getHospitalList(req, res, next) {
  try {
    const ulbid = req.body.ulbid || 0;
    const rows = await serviceHospitalList(ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Hospital List fetched successfully');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Hospital List fetch error');
    return next(error);
  }
}

async function getHospitalById(req, res, next) {
  try {
    const hospitalId = req.body.hospitalId || 0;
    const ulbId = req.body.ulbId || 0;
    const hospital = await serviceHospitalById(hospitalId, ulbId);

    if (!hospital) {
      logApiError(req, 404, 'Hospital not found', 'Hospital fetch by id error');
      return res.fail('Hospital not found', 404);
    }

    logApiSuccess(req, 200, hospital, 'Hospital details fetched successfully');
    return res.ok(hospital);
  } catch (error) {
    logApiError(req, 500, error.message, 'Hospital details fetch error');
    return next(error);
  }
}

module.exports = {
  getHospitalList,
  getHospitalById,
};
