const oracledb = require('oracledb');
const { executeQuery } = require('../../db/queryExecutor');
const { executeProcedure } = require('../../db/procedureExecutor');


async function repoWardList(ulbid) {
  let sql = `
   SELECT DISTINCT num_ctpttype_wardid
                FROM aorts_ctptlist_mas where num_ctpttype_ulbid=:ulbid and
                var_ctpttype_status='Y'
                order by num_ctpttype_wardid `;
  const binds = { ulbid: Number(ulbid) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

async function repoToiletList(ulbid, wardid) {
  let sql = ` select distinct var_ctpttype_toiletlocation,num_ctpttype_id 
from aorts_ctptlist_mas inner join aorts_empctptentry_mst
on num_ctpttype_id = num_empctptentry_toiletid
 where num_ctpttype_ulbid=:ulbid and num_ctpttype_wardid=:wardid and var_ctpttype_status='Y'
 `;
  const binds = { ulbid: Number(ulbid), wardid: Number(wardid) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

async function repoComplaintTypeList(ulbid) {
  const sql = `
    SELECT num_ctptcompltype_id,
           var_ctptcompltype_name
      FROM aorts_ctptcompltype_mas
     WHERE num_ctptcompltype_ulbid = :ulbid
       AND var_ctptcompltype_flag = 'Y'
     ORDER BY num_ctptcompltype_id`;
  const binds = { ulbid: Number(ulbid) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}


async function regComplaintRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_citizencomplaint_ins(
        :in_UserId,
        :in_ULBId,
        :in_wardid,
        :in_toiletid,
        :in_complainttypeid,
        :in_citizenmn,
        :in_mobileno,
        :in_unitno,
        :in_complaintstatus,
        :in_complntremark,
        :in_unitimg1,
        :in_unitimg2,
        :in_unitimg3,
        :in_unitimg4,
        :in_unitimg5,
        :OUT_ERRORCODE,
       :OUT_ERRORMSG

 );
    END;
  `;
  const binds = {
    // in_UserId: payload.userId,
    in_UserId: payload.userId,
    in_ULBId: payload.ulbId,
    in_wardid: payload.wardId,
    in_toiletid: payload.toiletId,
    in_complainttypeid: payload.complaintTypeId,
    in_citizenmn: payload.citizenMn,
    in_mobileno: payload.mobileNo,
    in_unitno: payload.unitNo,
    in_complaintstatus: payload.complaintStatus,
    in_complntremark: payload.complntRemark,

    in_unitimg1: {
      val: payload.unitImg1 ? Buffer.from(payload.unitImg1, "base64") : null,
      type: oracledb.BLOB,
    },

    in_unitimg2: {
      val: payload.unitImg2 ? Buffer.from(payload.unitImg2, "base64") : null,
      type: oracledb.BLOB,
    },

    in_unitimg3: {
      val: payload.unitImg3 ? Buffer.from(payload.unitImg3, "base64") : null,
      type: oracledb.BLOB,
    },

    in_unitimg4: {
      val: payload.unitImg4 ? Buffer.from(payload.unitImg4, "base64") : null,
      type: oracledb.BLOB,
    },

    in_unitimg5: {
      val: payload.unitImg5 ? Buffer.from(payload.unitImg5, "base64") : null,
      type: oracledb.BLOB,
    },

    OUT_ERRORCODE: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },

    OUT_ERRORMSG: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };
  const result = await executeProcedure({
    statement,
    binds,
    useTx: false,
  });

  const out = result.outBinds;

  return {
    errorCode: out.OUT_ERRORCODE,
    message: out.OUT_ERRORMSG,
  };
}

async function assignComplaintRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_ctptcomplaintassignsuperwer_ins(
        :in_userid,
        :in_compaintid,
        :in_superwiserid,
        :in_wardno,
        :in_ulbid,
        :out_errcode,
        :out_ErrMsg
      );
    END;
  `;

  const binds = {
    in_userid: payload.userId,
    in_compaintid: payload.complaintId,
    in_superwiserid: payload.supervisorId,
    in_wardno: payload.wardNo,
    in_ulbid: payload.ulbId,

    out_errcode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },

    out_ErrMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({
    statement,
    binds,
    useTx: false,
  });

  const out = result.outBinds;

  return {
    errorCode: out.out_errcode,
    message: out.out_ErrMsg,
  };
}

async function lobToBase64(lob) {
  if (!lob) return null;
  return new Promise((resolve, reject) => {
    const chunks = [];
    lob.on("data", (chunk) => {
      chunks.push(chunk);
    });
    lob.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.toString("base64"));
    });
    lob.on("error", (err) => {
      reject(err);
    });
  });
}

async function compListRepo(si_id,ulbid, fromDate, toDate, status, page = 1, limit = 10) {
  // console.log("Repo Params:", { si_id, ulbid, fromDate, toDate, status, page, limit });
  const offset = (Number(page) - 1) * Number(limit);
  let sql = `SELECT * FROM vw_ctptpendingcomplaint_list a 
 WHERE a.si_id = :si_id and a.ulbid=:ulbid `;
  const binds = { si_id: si_id,ulbid:Number(ulbid) };
  if (fromDate && toDate) {
    sql += ` AND TRUNC(a.complaint_date) BETWEEN 
    TO_DATE(:fromDate, 'YYYY-MM-DD') AND TO_DATE(:toDate, 'YYYY-MM-DD') `;
    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }
  if (status && status !== "ALL") {
    sql += ` AND a.var_complaint_status = :status `;
    binds.status = status;
  }
  sql += ` ORDER BY a.complaint_date DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY `;
  binds.offset = Number(offset);
  binds.limit = Number(limit);
  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  for (const row of rows) {
    row.BLOB_COMPLAINT_UNITIMG1 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG1,
    );
    row.BLOB_COMPLAINT_UNITIMG2 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG2,
    );
    row.BLOB_COMPLAINT_UNITIMG3 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG3,
    );
    row.BLOB_COMPLAINT_UNITIMG4 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG4,
    );
    row.BLOB_COMPLAINT_UNITIMG5 = await lobToBase64(
      row.BLOB_COMPLAINT_UNITIMG5,
    );
  }

  let countSql = ` SELECT COUNT(*) AS total FROM vw_ctptpendingcomplaint_list a
   WHERE a.si_id = :si_id  and a.ulbid=:ulbid `;
  const countBinds = { si_id: si_id,ulbid:Number(ulbid) };
  if (fromDate && toDate) {
    countSql += ` AND TRUNC(a.complaint_date) BETWEEN 
    TO_DATE(:fromDate, 'YYYY-MM-DD') AND TO_DATE(:toDate, 'YYYY-MM-DD') `;
    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  } // status filter in count query
  if (status && status !== "ALL") {
    countSql += ` AND a.var_complaint_status = :status `;
    countBinds.status = status;
  }
  const countResult = await executeQuery(countSql, countBinds);
  const total = countResult.rows?.[0]?.TOTAL || 0;
  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total ,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function repoSupervisorList(ulbid) {
  let sql = `
  select distinct var_ctpttype_username,var_ctpttype_suppid From 
  aorts_ctptlist_mas where var_ctpttype_suppid is not null 
   and num_ctpttype_ulbid = :ulbid
`;
  const binds = { ulbid: Number(ulbid) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

module.exports = { repoWardList, repoToiletList, repoComplaintTypeList, regComplaintRepo, compListRepo,assignComplaintRepo,
  repoSupervisorList
 };
