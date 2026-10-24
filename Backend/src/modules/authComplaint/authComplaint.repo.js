const oracledb = require("oracledb");
const { executeQuery } = require("../../db/queryExecutor");
const { executeProcedure } = require("../../db/procedureExecutor");

async function authComplaintRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_empctptauth_ins(
        :in_UserId,
        :in_applid,
        :in_ULBId,
        :in_mode,
        :in_status,
        :in_Remark,
        :Out_ErrorCode,
        :Out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_UserId: payload.userId,
    in_applid: Number(payload.applId),
    in_ULBId: Number(payload.ulbId),
    in_mode: Number(payload.mode),
    in_status: payload.status,
    in_Remark: payload.remark,
    Out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    Out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ statement, binds, useTx: false });
  const out = result.outBinds;

  return {
    errorCode: out.Out_ErrorCode,
    message: out.Out_ErrorMsg,
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

async function compListforSupRepo(
  ulbid,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10
) {
  // console.log("Repo Params:", { ulbid, fromDate, toDate, status, page, limit });
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT * FROM (
      SELECT
        e.num_empctptentry_id,
        e.dat_empctptentry_date,
        e.var_empctptentry_latitude,
        e.num_empctptentry_id AS uniqueid,
        e.var_empctptentry_supremark,
        e.var_empctptentry_supflag,
        u.var_user_username AS username,
        e.var_empctptentry_userid AS userid,
        e.var_empctptentry_longitude,
        e.num_empctptentry_toiletid,
        e.num_empctptentry_stageid,
        e.var_empctptentry_remark,
        e.dat_empctptentry_insdate,
        e.num_empctptentry_ulbid,

        ctpt.num_ctpttype_wardid,
        ctpt.var_ctpttype_toiletlocation,
        ctpt.var_ctpttype_femaleseats,
        ctpt.var_ctpttype_maleseats,
        ctpt.var_ctpttype_totalseats,
        ctpt.var_ctpttype_status,
        ctpt.var_ctpttype_username,

        st.var_ctptstage_status,
        st.var_ctptstage_name,

        ROW_NUMBER() OVER (
          PARTITION BY
            e.var_empctptentry_userid,
            e.num_empctptentry_toiletid,
            TRUNC(e.dat_empctptentry_date)
          ORDER BY e.dat_empctptentry_date DESC
        ) AS rn

      FROM aorts_empctptentry_mst e

      INNER JOIN admins.aoma_user_def u
        ON u.num_user_userid = e.var_empctptentry_userid

      LEFT JOIN aorts_ctptlist_mas ctpt
        ON ctpt.num_ctpttype_id = e.num_empctptentry_toiletid

      LEFT JOIN aorts_ctptstage_mas st
        ON st.num_ctptstage_id = e.num_empctptentry_stageid

      LEFT JOIN aorts_ctptcitizencomplaint_mas c
        ON e.num_empctptentry_toiletid = c.num_complaint_toilet

      WHERE e.num_empctptentry_stageid = 3
  `;

  const binds = {
    ulbid: Number(ulbid),
  };

  // ================= DATE FILTER =================
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(e.dat_empctptentry_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // ================= STATUS FILTER =================
if (status && status !== 'ALL') {
  if (status === 'P') {
    sql += `
      AND e.var_empctptentry_supflag IS NULL
    `;
  } else {
    sql += `
      AND e.var_empctptentry_supflag = :status
    `;
    binds.status = status;
  }
}

  sql += `
    )
    WHERE rn = 1
      AND num_empctptentry_ulbid = :ulbid

    ORDER BY num_empctptentry_id DESC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = Number(offset);
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  // ================= COUNT QUERY =================
  let countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT ROW_NUMBER() OVER (
        PARTITION BY
          e.var_empctptentry_userid,
          e.num_empctptentry_toiletid,
          TRUNC(e.dat_empctptentry_date)
        ORDER BY e.dat_empctptentry_date DESC
      ) AS rn,
      e.num_empctptentry_ulbid
      FROM aorts_empctptentry_mst e
      LEFT JOIN aorts_ctptcitizencomplaint_mas c
        ON e.num_empctptentry_toiletid = c.num_complaint_toilet
      WHERE e.num_empctptentry_stageid = 3
  `;

  const countBinds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(e.dat_empctptentry_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

 if (status && status !== 'ALL') {
  if (status === 'P') {
    countSql += `
      AND e.var_empctptentry_supflag IS NULL
    `;
  } else {
    countSql += `
      AND e.var_empctptentry_supflag = :status
    `;
    countBinds.status = status;
  }
}

  countSql += `
    )
    WHERE rn = 1
      AND num_empctptentry_ulbid = :ulbid
  `;

  const countResult = await executeQuery(countSql, countBinds);
  const total = countResult.rows?.[0]?.TOTAL || 0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function compListforSIRepo(
  ulbid,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10
) {
  const safePage = Number.isFinite(Number(page)) ? Number(page) : 1;
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;
  const offset = (safePage - 1) * safeLimit;

  let sql = `
    SELECT * FROM (
      SELECT
        e.num_empctptentry_id,
        e.dat_empctptentry_date,
        e.var_empctptentry_latitude,
        e.num_empctptentry_id AS uniqueid,
        u.var_user_username AS username,
        e.var_empctptentry_userid AS userid,
        e.var_empctptentry_longitude,
        e.num_empctptentry_toiletid,
        e.num_empctptentry_stageid,
        e.var_empctptentry_remark,
        e.dat_empctptentry_insdate,
        e.num_empctptentry_ulbid,

        ctpt.num_ctpttype_wardid,
        ctpt.var_ctpttype_toiletlocation,
        ctpt.var_ctpttype_femaleseats,
        ctpt.var_ctpttype_maleseats,
        ctpt.var_ctpttype_totalseats,
        ctpt.var_ctpttype_status,
        ctpt.var_ctpttype_username,

        st.var_ctptstage_status,
        st.var_ctptstage_name,

        e.var_empctptentry_supflag,
        e.var_empctptentry_siflag,
        e.var_empctptentry_siremark,

        ROW_NUMBER() OVER (
          PARTITION BY
            e.var_empctptentry_userid,
            e.num_empctptentry_toiletid,
            TRUNC(e.dat_empctptentry_date)
          ORDER BY e.dat_empctptentry_date DESC
        ) AS rn

      FROM aorts_empctptentry_mst e

      INNER JOIN admins.aoma_user_def u
        ON u.num_user_userid = e.var_empctptentry_userid

      LEFT JOIN aorts_ctptlist_mas ctpt
        ON ctpt.num_ctpttype_id = e.num_empctptentry_toiletid

      LEFT JOIN aorts_ctptstage_mas st
        ON st.num_ctptstage_id = e.num_empctptentry_stageid

      LEFT JOIN aorts_ctptcitizencomplaint_mas c
        ON e.num_empctptentry_toiletid = c.num_complaint_toilet

      WHERE e.num_empctptentry_stageid = 3
        AND e.var_empctptentry_supflag = 'A'
  `;

  const binds = {
    ulbid: Number(ulbid),
  };

  // ================= DATE FILTER =================
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(e.dat_empctptentry_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // ================= STATUS FILTER =================
 if (status && status !== 'ALL') {
  if (status === 'P') {
    sql += `
      AND e.var_empctptentry_siflag IS NULL
    `;
  } else {
    sql += `
      AND e.var_empctptentry_siflag = :status
    `;
    binds.status = status;
  }
}

  sql += `
    )
    WHERE rn = 1
      AND num_empctptentry_ulbid = :ulbid
    ORDER BY num_empctptentry_id DESC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = offset;
  binds.limit = safeLimit;

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

  // ================= COUNT QUERY =================
  let countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT
        ROW_NUMBER() OVER (
          PARTITION BY
            e.var_empctptentry_userid,
            e.num_empctptentry_toiletid,
            TRUNC(e.dat_empctptentry_date)
          ORDER BY e.dat_empctptentry_date DESC
        ) AS rn,
        e.num_empctptentry_ulbid
      FROM aorts_empctptentry_mst e

      LEFT JOIN aorts_ctptcitizencomplaint_mas c
        ON e.num_empctptentry_toiletid = c.num_complaint_toilet

      WHERE e.num_empctptentry_stageid = 3
        AND e.var_empctptentry_supflag = 'A'
  `;

  const countBinds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(e.dat_empctptentry_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== 'ALL') {
  if (status === 'P') {
    countSql += `
      AND e.var_empctptentry_siflag IS NULL
    `;
  } else {
    countSql += `
      AND e.var_empctptentry_siflag = :status
    `;
    countBinds.status = status;
  }
}

  countSql += `
    )
    WHERE rn = 1
      AND num_empctptentry_ulbid = :ulbid
  `;

  const countResult = await executeQuery(countSql, countBinds);
  const total = countResult.rows?.[0]?.TOTAL || 0;

  return {
    data: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function getImages(ulbid, toiletId, applid) {
  let sql = `
SELECT num_empctptentry_id, dat_empctptentry_date, num_empctptentry_stageid,
        var_empctptentry_remark, num_empctptentry_ulbid,
        bolb_empctptentry_image,
        bolb_empctptentry_image2, bolb_empctptentry_image3,
        var_ctptstage_status, var_ctptstage_name
        FROM aorts_empctptentry_mst
        INNER JOIN admins.aoma_user_def ON num_user_userid = var_empctptentry_userid
        LEFT JOIN aorts_ctptlist_mas ctpt ON ctpt.num_ctpttype_id = num_empctptentry_toiletid
        LEFT JOIN aorts_ctptstage_mas st ON st.num_ctptstage_id = num_empctptentry_stageid
        WHERE num_empctptentry_ulbid= :ulbid 
        AND num_empctptentry_toiletid= :toiletId
AND TRUNC(dat_empctptentry_insdate)= (SELECT TRUNC(dat_empctptentry_date) FROM aorts_empctptentry_mst WHERE num_empctptentry_id= :applid )
ORDER BY num_empctptentry_stageid ASC
  `;

  const binds = {
    ulbid: Number(ulbid),
    toiletId: Number(toiletId),
    applid: Number(applid),
  };

  const result = await executeQuery(sql, binds);

  const rows = result.rows || [];

  for (const row of rows) {
    row.BOLB_EMPCTPTENTRY_IMAGE = await lobToBase64(
      row.BOLB_EMPCTPTENTRY_IMAGE,
    );

    row.BOLB_EMPCTPTENTRY_IMAGE2 = await lobToBase64(
      row.BOLB_EMPCTPTENTRY_IMAGE2,
    );

    row.BOLB_EMPCTPTENTRY_IMAGE3 = await lobToBase64(
      row.BOLB_EMPCTPTENTRY_IMAGE3,
    );
  }

  return rows;
}


async function rslvdListbyVendorRepo(
  ulbid,
  supervisorId,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10
) {
  // console.log("Repo Params:", { ulbid, supervisorId, fromDate, toDate, status, page, limit });
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT
      a.prbhag,
      a.prbhagid,
      a.superwiser_id,
      a.superwiser,
      a.location,
      a.var_complaint_status,
      a.var_complaint_citizname,
      a.num_complaint_toilet,
      a.mobileno,
      a.complaint_date,
      a.var_complaint_remark,
      a.var_ctptsanitinspctor_name,
      a.blob_complaint_unitimg1,
      a.blob_complaint_unitimg2,
      a.blob_complaint_unitimg3,
      a.blob_complaint_unitimg4,
      a.blob_complaint_unitimg5,
      a.ulbid,
      a.si_id,
      a.complaintid
    FROM vw_ctptpendingcomplaint_assinlist a
    WHERE a.ulbid = :ulbid
      AND a.superwiser_id = :supervisorId
  `;

  const binds = {
    ulbid: Number(ulbid),
    supervisorId: String(supervisorId),
  };

  // Date Filter
  if (fromDate && toDate) {
    sql += `
      AND TRUNC(a.complaint_date)
      BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
    `;

    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  // Status Filter
  if (status && status !== "ALL") {
    sql += `
      AND a.var_complaint_status = :status
    `;

    binds.status = status;
  }

  sql += `
    ORDER BY a.complaint_date DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = offset;
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);

  const rows = result.rows || [];

  // Convert images
  for (const row of rows) {
    row.BLOB_COMPLAINT_UNITIMG1 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG1);
    row.BLOB_COMPLAINT_UNITIMG2 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG2);
    row.BLOB_COMPLAINT_UNITIMG3 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG3);
    row.BLOB_COMPLAINT_UNITIMG4 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG4);
    row.BLOB_COMPLAINT_UNITIMG5 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG5);
  }

  // Count Query
  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM vw_ctptpendingcomplaint_assinlist a
    WHERE a.ulbid = :ulbid
      AND a.superwiser_id = :supervisorId
  `;

  const countBinds = {
    ulbid: Number(ulbid),
    supervisorId: String(supervisorId),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(a.complaint_date)
      BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD')
      AND TO_DATE(:toDate,'YYYY-MM-DD')
    `;

    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    countSql += `
      AND a.var_complaint_status = :status
    `;

    countBinds.status = status;
  }

  const countResult = await executeQuery(countSql, countBinds);

  const total = countResult.rows?.[0]?.TOTAL || 0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}


async function rslvdListbySupRepo(
  ulbid,
  fromDate,
  toDate,
  status,
  page = 1,
  limit = 10
) {
  const offset = (Number(page) - 1) * Number(limit);

  let sql = `
    SELECT
      prbhag,
      prbhagid,
      superwiser_id,
      superwiser,
      location,
      var_complaint_status,
      var_complaint_citizname,
      num_complaint_toilet,
      mobileno,
      complaint_date,
      var_complaint_remark,
      var_ctptsanitinspctor_name,
      blob_complaint_unitimg1,
      blob_complaint_unitimg2,
      blob_complaint_unitimg3,
      blob_complaint_unitimg4,
      blob_complaint_unitimg5,
      ulbid,
      si_id,
      var_compaint_superremark,
      var_compaint_siremark,
      complaintid
    FROM vw_ctptpendingcomplaint_Resolved
    WHERE ulbid = :ulbid
  `;

  const binds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    sql += `
      AND TRUNC(complaint_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    binds.fromDate = fromDate;
    binds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    sql += `
      AND var_complaint_status = :status
    `;
    binds.status = status;
  }

  sql += `
    ORDER BY complaint_date DESC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
  `;

  binds.offset = Number(offset);
  binds.limit = Number(limit);

  const result = await executeQuery(sql, binds);
  const rows = result.rows || [];

    // Convert images
  for (const row of rows) {
    row.BLOB_COMPLAINT_UNITIMG1 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG1);
    row.BLOB_COMPLAINT_UNITIMG2 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG2);
    row.BLOB_COMPLAINT_UNITIMG3 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG3);
    row.BLOB_COMPLAINT_UNITIMG4 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG4);
    row.BLOB_COMPLAINT_UNITIMG5 = await lobToBase64(row.BLOB_COMPLAINT_UNITIMG5);
  }

  let countSql = `
    SELECT COUNT(*) AS total
    FROM vw_ctptpendingcomplaint_Resolved
    WHERE ulbid = :ulbid
  `;

  const countBinds = {
    ulbid: Number(ulbid),
  };

  if (fromDate && toDate) {
    countSql += `
      AND TRUNC(complaint_date)
      BETWEEN TO_DATE(:fromDate, 'YYYY-MM-DD')
      AND TO_DATE(:toDate, 'YYYY-MM-DD')
    `;
    countBinds.fromDate = fromDate;
    countBinds.toDate = toDate;
  }

  if (status && status !== "ALL") {
    countSql += `
      AND var_complaint_status = :status
    `;
    countBinds.status = status;
  }

  const countResult = await executeQuery(countSql, countBinds);

  const total =
    countResult.rows?.[0]?.TOTAL ||
    countResult.rows?.[0]?.total ||
    0;

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

module.exports = {
  authComplaintRepo,
  compListforSupRepo,
  compListforSIRepo,
  getImages, rslvdListbyVendorRepo, rslvdListbySupRepo
};

async function complaintStatusUpdateRepo(payload) {
  const statement = `
    BEGIN
      aorts.aorts_ctptcomplaintstatusupdt_ins(
        :in_userid,
        :in_mode,
        :in_compaintid,
        :in_superwiserid,
        :in_superstatus,
        :in_superremark,
        :in_SIID,
        :in_si_status,
        :in_si_remrk,
        :in_wardno,
        :in_ulbid,
        :out_errcode,
        :out_ErrMsg
      );
    END;
  `;

  const binds = {
    in_userid: payload.userId,
    in_mode: Number(payload.mode),
    in_compaintid: Number(payload.compaintId ?? payload.complaintId ?? payload.compaintid ?? payload.complaintid),
    in_superwiserid: payload.superwiserId,
    in_superstatus: payload.superstatus,
    in_superremark: payload.superremark,
    in_SIID: payload.SIID || payload.siId,
    in_si_status: payload.si_status,
    in_si_remrk: payload.si_remrk,
    in_wardno: payload.wardno ? Number(payload.wardno) : null,
    in_ulbid: Number(payload.ulbid),
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

  const result = await executeProcedure({ statement, binds, useTx: false });
  const out = result.outBinds || {};

  return {
    errorCode: out.out_errcode,
    message: out.out_ErrMsg,
  };
}

// expose new repo function
module.exports.complaintStatusUpdateRepo = complaintStatusUpdateRepo;
