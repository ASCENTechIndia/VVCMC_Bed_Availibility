const {serviceWardList,serviceToiletList,serviceComplaintTypeList,regComplaintService, assignComplaintService, compListService,
  serviceSupervisorList
} = require('./registerComplaint.service');
const { auditLog } = require('../../utils/audit-log');
const { logApiSuccess, logApiError } = require('../../utils/log');
function requestMeta(req) {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  };
}
async function getWardList(req, res, next) {
  try {
    const rows = await serviceWardList(req.query.ulbid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Ward List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Ward List Report search error');
    return next(error);
  }
}

async function getToiletList(req, res, next) {
  try {
    const rows = await serviceToiletList(req.query.ulbid, req.query.wardid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Toilet List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Toilet List Report search error');
    return next(error);
  }
}

async function getComplaintTypeList(req, res, next) {
  try {
    const rows = await serviceComplaintTypeList(req.query.ulbid);
    logApiSuccess(req, 200, { count: rows?.length || 0 }, 'Complaint Type List completed');
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Complaint Type List search error');
    return next(error);
  }
}

async function registerComplaint(req, res, next) {
  try {
    const payload = req.body;

    const out = await regComplaintService(payload);

    console.log("OUT:", out);

    const isSuccess = String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(req, 200, "Complaint Registered Successfully");
    } else {
      logApiError(req, 400, out.message, "Complaint Registration failed");
    }

    auditLog({
      action: "COMPLAINT_REGISTRATION",
      actor: req.user?.userId || "system",
      module: "users",
      status: isSuccess ? "SUCCESS" : "FAILED",
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });
    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, "Complaint Registration error");
    return next(error);
  }
}

async function assignComplaint(req, res, next) {
  try {
    const payload = req.body;

    const out = await assignComplaintService(payload);

    const isSuccess = String(out.errorCode) === "9999";

    if (isSuccess) {
      logApiSuccess(req, 200, "Complaint Assigned Successfully");
    } else {
      logApiError(req, 400, out.message, "Complaint Assignment failed");
    }

    auditLog({
      action: "COMPLAINT_ASSIGNMENT",
      actor: req.user?.userId || "system",
      module: "registerComplaint",
      status: isSuccess ? "SUCCESS" : "FAILED",
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });
    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, "Complaint Assignment error");
    return next(error);
  }
}


async function getComplaintList(req, res, next) {
  try {
    const {si_id, ulbid, fromDate=null, toDate=null, status=null, page = 1, limit = 10 } = req.query;
    const rows = await compListService(si_id,ulbid, fromDate, toDate, status, page, limit);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Complaint List completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Complaint List search error');
    return next(error);
  }
}

async function getSupervisorList(req, res, next) {
  try {
    const rows = await serviceSupervisorList(req.query.ulbid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Supervisor List Report completed' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Supervisor List Report search error');
    return next(error);
  }
}

module.exports = { getWardList, getToiletList, getComplaintTypeList, registerComplaint, assignComplaint, getComplaintList ,
  getSupervisorList
};
