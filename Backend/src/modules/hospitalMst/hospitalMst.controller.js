const { serviceHospitalList, serviceHospitalById, serviceHospitalIns, serviceBedCategoryList, serviceBedCategoryIns, serviceBedAvailabilityList, serviceBedAvailabilityCounts, serviceHospitalDropdownList } = require('./hospitalMst.service');
const { auditLog } = require('../../utils/audit-log');
const { logApiSuccess, logApiError } = require('../../utils/log');

function requestMeta(req) {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  };
}

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

async function insertHospital(req, res, next) {
  try {
    const payload = {
      ...req.body,
      userId: req.body.userId || '',
      ipAddress: req.body.ipAddress || '',
      ipSource: req.body.ipSource || 'RW',
    };

    const out = await serviceHospitalIns(payload);

    // console.log("OUT:", out);

    const isSuccess = String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(req, 200, out.message || "Hospital Saved Successfully");
    } else {
      logApiError(req, 400, out.message, "Hospital Save failed");
    }

    auditLog({
      action: "HOSPITAL_REGISTRATION",
      actor: req.user?.userId || payload.userId || "",
      module: "hospitalMst",
      status: isSuccess ? "SUCCESS" : "FAILED",
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });

    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, "Hospital Save error");
    return next(error);
  }
}

async function getBedCategoryList(req, res, next) {
  try {
    const ulbid = req.body.ulbid || 0;
    const rows = await serviceBedCategoryList(ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Bed Category List fetched successfully');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Bed Category List fetch error');
    return next(error);
  }
}

async function insertBedCategory(req, res, next) {
  try {
    const payload = {
      ...req.body,
      userId: req.body.userId || '',
      ipAddress: req.body.ipAddress || '',
      ipSource: req.body.ipSource || 'RW',
    };

    const out = await serviceBedCategoryIns(payload);

    // console.log("OUT:", out);

    const isSuccess = String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(req, 200, out.message || "Bed Category Saved Successfully");
    } else {
      logApiError(req, 400, out.message, "Bed Category Save failed");
    }

    auditLog({
      action: "BED_CATEGORY_REGISTRATION",
      actor: req.user?.userId || payload.userId || "",
      module: "hospitalMst",
      status: isSuccess ? "SUCCESS" : "FAILED",
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });

    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, "Bed Category Save error");
    return next(error);
  }
}

async function getBedAvailabilityList(req, res, next) {
  try {
    const hospitalId = req.body.hospitalId || 0;
    const ulbId = req.body.ulbId || req.body.ulbid || 0;
    const rows = await serviceBedAvailabilityList(hospitalId, ulbId);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Bed Availability List fetched successfully');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Bed Availability List fetch error');
    return next(error);
  }
}

async function getBedAvailabilityCounts(req, res, next) {
  try {
    const ulbid = req.body.ulbid || req.body.ulbId || 0;
    const rows = await serviceBedAvailabilityCounts(ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Bed Availability Counts fetched successfully');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Bed Availability Counts fetch error');
    return next(error);
  }
}

async function getHospitalDropdownList(req, res, next) {
  try {
    const ulbid = req.body.ulbid || req.body.ulbId || 0;
    const rows = await serviceHospitalDropdownList(ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Hospital Dropdown List fetched successfully');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Hospital Dropdown List fetch error');
    return next(error);
  }
}

module.exports = {
  getHospitalList,
  getHospitalById,
  insertHospital,
  getBedCategoryList,
  insertBedCategory,
  getBedAvailabilityList,
  getBedAvailabilityCounts,
  getHospitalDropdownList,
};
