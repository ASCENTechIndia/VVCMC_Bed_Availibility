const { authComplaintRepo, compListforSupRepo, compListforSIRepo, getImages,
  rslvdListbyVendorRepo, rslvdListbySupRepo
 } = require('./authComplaint.repo');

const { complaintStatusUpdateRepo } = require('./authComplaint.repo');

async function authComplaintService(payload) {
  return authComplaintRepo(payload);
}

async function getCompListForSupService( ulbid, fromDate,toDate,status, page, limit ) {
   return compListforSupRepo( ulbid, fromDate,toDate,status, page, limit ); 
  }

async function getCompListSIService(ulbid, fromDate, toDate, status, page, limit) {
  return compListforSIRepo(ulbid, fromDate, toDate, status, page, limit);
}

async function getImagesService(ulbid, toiletId, applid) {
  return getImages(ulbid, toiletId, applid);
}

async function getrslvdListbyVendorService( ulbid,supervisorId, fromDate,toDate,status, page, limit ) {
   return rslvdListbyVendorRepo(ulbid,
  supervisorId,
  fromDate,
  toDate,
  status,
  page ,
  limit ); 
  }

async function getrslvdListbySupService( ulbid, fromDate,toDate,status, page, limit ) {
   return rslvdListbySupRepo( ulbid, fromDate,toDate,status, page, limit ); 
  }


module.exports = {
  authComplaintService, getCompListForSupService, getCompListSIService, getImagesService, getrslvdListbyVendorService, getrslvdListbySupService
};

async function complaintStatusUpdateService(payload) {
  return complaintStatusUpdateRepo(payload);
}

module.exports.complaintStatusUpdateService = complaintStatusUpdateService;
