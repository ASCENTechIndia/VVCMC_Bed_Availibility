const { authComplaintService, getCompListForSupService, getCompListSIService,
    getImagesService,getrslvdListbyVendorService, getrslvdListbySupService
 } = require('./authComplaint.service');
const { complaintStatusUpdateService } = require('./authComplaint.service');
const { auditLog } = require('../../utils/audit-log');
const { logApiSuccess, logApiError } = require('../../utils/log');

function requestMeta(req) {
  return {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
  };
}

async function authComplaint(req, res, next) {
  try {
    const payload = req.body;
    const out = await authComplaintService(payload);
    const isSuccess = String(out.errorCode) === '9999';

    if (isSuccess) {
      logApiSuccess(req, 200, {}, 'Auth complaint approved successfully');
    } else {
      logApiError(req, 400, out.message, 'Auth complaint approval failed');
    }

    auditLog({
      action: 'AUTH_COMPLAINT_APPROVAL',
      actor: req.user?.userId || 'system',
      module: 'authComplaint',
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });

    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, 'Auth complaint approval error');
    return next(error);
  }
}

async function getCompListForSup(req, res, next) {
   try { const { ulbid,fromDate,toDate,status, page = 0, limit = 10 } = req.query;
    const result = await getCompListForSupService( ulbid,fromDate,toDate,status, page, limit); 
    logApiSuccess( req, 200, { count: result.data?.length || 0 }, 'Complaint List for Supervisor completed' ); 
    return res.ok(result); } 
    catch (error) { logApiError( req, 500, error.message, 'Complaint List for Supervisor search error' );
       return next(error); }
       }

async function getCompListForSI(req, res, next) {
  try {
    const { ulbid, fromDate, toDate, status, page = 1, limit = 10 } = req.query;
    const result = await getCompListSIService(ulbid, fromDate, toDate, status, page, limit);
    logApiSuccess( req, 200, { count: result.data?.length || 0 }, 'Complaint List for SI completed' );
    return res.ok(result);
  } catch (error) {
    logApiError(req, 500, error.message, 'Complaint List for SI  search error');
  return next(error);
  }
}

async function getImagesCon(req, res, next) {
  try {
    const { ulbid, toiletId, applid } = req.query;
    const rows = await getImagesService(ulbid, toiletId, applid);
    logApiSuccess( req, 200, { count: rows?.length || 0 }, 'Images retrieved successfully' );
    return res.ok(rows);
  } catch (error) {
    logApiError(req, 500, error.message, 'Error retrieving images');
    return next(error);
  }
}

async function resolvedListbyVendor(req, res, next) {
   try { const { ulbid, supervisorId, fromDate, toDate, status, page = 1, limit = 10 } = req.query;
    const result = await getrslvdListbyVendorService( ulbid, supervisorId, fromDate, toDate, status, page, limit);
    logApiSuccess( req, 200, { count: result.data?.length || 0 }, 'Resolved Complaint List for Supervisor completed' );
    return res.ok(result); }
    catch (error) { logApiError( req, 500, error.message, 'Resolved Complaint List for Supervisor search error' );
       return next(error); }
       }

async function resolvedListbySup(req, res, next) {
   try { const { ulbid,fromDate,toDate,status, page = 0, limit = 10 } = req.query;
    const result = await getrslvdListbySupService( ulbid,fromDate,toDate,status, page, limit); 
    logApiSuccess( req, 200, { count: result.data?.length || 0 }, 'Resolved Complaint List for Supervisor completed' ); 
    return res.ok(result); } 
    catch (error) { logApiError( req, 500, error.message, 'Resolved Complaint List for Supervisor search error' );
       return next(error); }
       }
       
module.exports = { authComplaint, getCompListForSup, getCompListForSI, getImagesCon, resolvedListbyVendor, resolvedListbySup };

async function complaintStatusUpdate(req, res, next) {
  try {
    const body = req.body || {};

    const payload = {
      userId: body.userId || req.user?.userId,
      mode: body.mode,
      compaintId: body.complaintId ?? body.compaintId ?? body.in_compaintid ?? body.compaintid,
      superwiserId: body.superwiserId,
      superstatus: body.superstatus,
      superremark: body.superremark,
      SIID: body.SIID || body.siId,
      si_status: body.si_status,
      si_remrk: body.si_remrk,
      wardno: body.wardno,
      ulbid: body.ulbid,
    };

    const out = await complaintStatusUpdateService(payload);
    const isSuccess = String(out.errorCode) === '9999';

    if (isSuccess) {
      logApiSuccess(req, 200, {}, 'Complaint status update succeeded');
    } else {
      logApiError(req, 400, out.message, 'Complaint status update failed');
    }

    auditLog({
      action: 'CTPT_COMPLAINT_STATUS_UPDATE',
      actor: req.user?.userId || payload.userId || 'system',
      module: 'authComplaint',
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      details: {
        outErrorCode: out.errorCode,
        outErrorMsg: out.message,
      },
      requestMeta: requestMeta(req),
    });

    return res.ok(out);
  } catch (error) {
    logApiError(req, 500, error.message, 'Complaint status update error');
    return next(error);
  }
}

module.exports.complaintStatusUpdate = complaintStatusUpdate;
