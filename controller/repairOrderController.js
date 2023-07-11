const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");
const { gettime } = require("../libs/datetime");
const { getChecklist } = require("./checklistController");
const { encrypt } = require("../libs/utils");

exports.getRepair = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  let SelectRepairs = `SELECT a.RepairId,a.StatusId,a.SlipNo,
        b.Fullname RequestUser,c.Fullname ReceiveUser,
        FORMAT(a.RequestTime, 'yyyy-MM-dd HH:mm:ss') RequestTime,
        FORMAT(a.ReceiveTime, 'yyyy-MM-dd HH:mm:ss') ReceiveTime,
        a.Section,a.InjShot,a.MoldId,a.MoldControlNo,a.MoldName,
        a.PartId,a.PartNo,a.PartName,a.McName,a.Cavity,a.CoolingType,a.OrderType,
        FORMAT(a.InjDate, 'yyyy-MM-dd HH:mm:ss') InjDate,
        FORMAT(a.PartDate, 'yyyy-MM-dd HH:mm:ss') PartDate,
        a.ProblemId,a.ProblemSource,a.ProblemFilePath,a.Detail,a.Cause
      FROM [RepairOrder] a
      LEFT JOIN [User] b on a.RequestUserId = b.UserId
      LEFT JOIN [User] c on a.ReceiveUserId = c.UserId
      WHERE RepairId = ${RepairId};
    SELECT CheckMoldId, CheckMoldNo, CheckMold, Checked
      FROM [RepairCheckMold]
      WHERE RepairId = ${RepairId} ORDER BY CheckMoldNo;
    SELECT a.ScheduleResult,
        FORMAT(a.ScheduleDate, 'yyyy-MM-dd HH:mm:ss') ScheduleDate,
        FORMAT(a.CreatedTime, 'yyyy-MM-dd HH:mm:ss') CreatedTime,
        a.ScheduleUserId, b.Fullname ScheduleUser
      FROM [RepairSchedule] a LEFT JOIN [User] b on a.ScheduleUserId = b.UserId
      WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;
    SELECT a.IndexProgress, a.RepairFilePath,
        FORMAT(a.RepairFileTime, 'yyyy-MM-dd HH:mm:ss') RepairFileTime,
        FORMAT(a.RepairStart, 'yyyy-MM-dd HH:mm:ss') RepairStart,
        FORMAT(a.RepairEnd, 'yyyy-MM-dd HH:mm:ss') RepairEnd,
        a.UploadUserId, b.Fullname UploadUser, c.Fullname RepairUser 
      FROM [RepairProgress] a
      LEFT JOIN [User] b on a.UploadUserId = b.UserId
      LEFT JOIN [User] c on a.RepairUserId = c.UserId
      WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;
    SELECT a.IndexCheck,a.CheckResult,a.AltCheckResult,a.DmCheckResult,a.DmAltCheckResult,
        a.CheckUserId,a.AltCheckUserId,a.DmCheckUserId,a.DmAltCheckUserId,
        a.DmCheckReason,a.DmAltCheckReason,
        FORMAT(a.CheckTime, 'yyyy-MM-dd HH:mm:ss') CheckTime,
        FORMAT(a.AltCheckTime, 'yyyy-MM-dd HH:mm:ss') AltCheckTime,
        FORMAT(a.DmCheckTime, 'yyyy-MM-dd HH:mm:ss') DmCheckTime,
        FORMAT(a.DmAltCheckTime, 'yyyy-MM-dd HH:mm:ss') DmAltCheckTime,
        b.Fullname CheckUser, c.Fullname AltCheckUser,
        d.Fullname DmCheckUser, e.Fullname DmAltCheckUser
      FROM [RepairCheck] a
      LEFT JOIN [User] b on a.CheckUserId = b.UserId
      LEFT JOIN [User] c on a.AltCheckUserId = c.UserId
      LEFT JOIN [User] d on a.DmCheckUserId = d.UserId
      LEFT JOIN [User] e on a.DmAltCheckUserId = e.UserId
      WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;
    SELECT a.IndexApprove,a.ApproveResult,a.AltApproveResult,a.DmApproveResult,a.DmAltApproveResult,
        a.ApproveUserId,a.AltApproveUserId,a.DmApproveUserId,a.DmAltApproveUserId,
        a.DmApproveReason,a.DmAltApproveReason,
        FORMAT(a.ApproveTime, 'yyyy-MM-dd HH:mm:ss') ApproveTime,
        FORMAT(a.AltApproveTime, 'yyyy-MM-dd HH:mm:ss') AltApproveTime,
        FORMAT(a.DmApproveTime, 'yyyy-MM-dd HH:mm:ss') DmApproveTime,
        FORMAT(a.DmAltApproveTime, 'yyyy-MM-dd HH:mm:ss') DmAltApproveTime,
        b.Fullname ApproveUser, c.Fullname AltApproveUser,
        d.Fullname DmApproveUser, e.Fullname DmAltApproveUser
      FROM [RepairApprove] a
      LEFT JOIN [User] b on a.ApproveUserId = b.UserId
      LEFT JOIN [User] c on a.AltApproveUserId = c.UserId
      LEFT JOIN [User] d on a.DmApproveUserId = d.UserId
      LEFT JOIN [User] e on a.DmAltApproveUserId = e.UserId
      WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;
    SELECT a.IndexQa,a.QaResult,a.QaRemark,
        FORMAT(a.TryDate, 'yyyy-MM-dd HH:mm:ss') TryDate,
        FORMAT(a.QaTime, 'yyyy-MM-dd HH:mm:ss') QaTime,
        a.QaFilePath,a.QaUserId,b.Fullname QaUser,
        a.CheckQaResult, a.CheckQaReason,c.Fullname CheckQaUser,
        FORMAT(a.CheckQaTime, 'yyyy-MM-dd HH:mm:ss') CheckQaTime
      FROM [RepairQa] a
      LEFT JOIN [User] b on a.QaUserId = b.UserId
      LEFT JOIN [User] c on a.CheckQaUserId = c.UserId
      WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;`;
  let Repairs = await pool.request().query(SelectRepairs);
  let Repair = Repairs.recordsets[0][0];
  Repair.CheckMold = Repairs.recordsets[1] || {};
  Repair.Schedule = Repairs.recordsets[2][0] || {};
  Repair.ScheduleHistory = Repairs.recordsets[2].slice(1) || [];
  Repair.Progress = Repairs.recordsets[3][0] || {};
  Repair.ProgressHistory = Repairs.recordsets[3].slice(1) || [];
  Repair.Check = Repairs.recordsets[4][0] || {};
  Repair.CheckHistory = Repairs.recordsets[4].slice(1) || [];
  Repair.Approve = Repairs.recordsets[5][0] || {};
  Repair.ApproveHistory = Repairs.recordsets[5].slice(1) || [];
  Repair.Qa = Repairs.recordsets[6][0] || {};
  Repair.QaHistory = Repairs.recordsets[6].slice(1) || [];
  return Repair;
};
exports.getRepairImg = async (RepairId, IndexProgress, IndexQa) => {
  let pool = await sql.connect(dbconfig);
  let SelectRepairImg = `SELECT IndexImg,ProblemFilePath
      FROM [RepairOrderImg] WHERE RepairId = ${RepairId};
    SELECT IndexProgress, IndexImg, RepairFilePath, RepairFileTime, UploadUserId, Fullname UploadUser
      FROM [RepairProgressImg] a LEFT JOIN [User] b on a.UploadUserId = b.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexProgress DESC;
    SELECT IndexProgress, IndexImg, InspectFilePath, InspectFileTime, UploadUserId, Fullname UploadUser
      FROM [RepairInspectImg] a LEFT JOIN [User] b on a.UploadUserId = b.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexProgress DESC;
    SELECT IndexQa, IndexImg, QaFilePath, QaFileTime, QaUploadUserId, Fullname UploadUser
      FROM [RepairQaImg] a LEFT JOIN [User] b on a.QaUploadUserId = b.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexQa DESC;`;
  let Imgs = await pool.request().query(SelectRepairImg);
  let RepairImg = {};
  RepairImg.OrderImg = Imgs.recordsets[0];
  RepairImg.ProgressImg = Imgs.recordsets[1].filter(
    (Img) => Img.IndexProgress == IndexProgress
  );
  RepairImg.ProgressImgHistory = Imgs.recordsets[1].filter(
    (Img) => Img.IndexProgress != IndexProgress
  );
  RepairImg.InspectImg = Imgs.recordsets[2].filter(
    (Img) => Img.IndexProgress == IndexProgress
  );
  RepairImg.InspectImgHistory = Imgs.recordsets[2].filter(
    (Img) => Img.IndexProgress != IndexProgress
  );
  RepairImg.QaImg = Imgs.recordsets[3].filter((Img) => Img.IndexQa == IndexQa);
  RepairImg.QaImgHistory = Imgs.recordsets[3].filter(
    (Img) => Img.IndexQa != IndexQa
  );
  return RepairImg;
};
exports.getPointcheck = async (RepairId, IndexProgress) => {
  let pool = await sql.connect(dbconfig);
  let SelectPointChecks = `SELECT SparePartSlip, FixDetail,
      FORMAT(RepairEnd, 'yyyy-MM-dd HH:mm:ss') CheckStart, 
      FORMAT(PointCheckTime, 'yyyy-MM-dd HH:mm:ss') CheckEnd,
        DATEDIFF(minute,RepairEnd,PointCheckTime) CheckMin
    FROM [RepairProgress]
    WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress}`;
  let PointChecks = await pool.request().query(SelectPointChecks);
  let PointCheck = PointChecks.recordset[0];
  let { CheckMin } = PointCheck;
  PointCheck.CheckText = CheckMin
    ? `${Math.floor(CheckMin / 60 / 24)} วัน ${Math.floor(
        (CheckMin / 60) % 24
      )} ชั่วโมง ${CheckMin % 60} นาที`
    : "-";
  let SelectChecklist = `SELECT CheckTopicId,CheckListId,CheckTopic,
        CheckListNo,CheckList,Checked,CheckTime
      FROM RepairChecklist
      WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress}
      ORDER BY CheckTopicId, CheckListId`;
  let Checklists = await pool.request().query(SelectChecklist);
  PointCheck.Checklist = Checklists.recordset;
  return PointCheck;
};
exports.getRepairData = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  let SelectRepairs = `SELECT a.RepairId,a.StatusId,a.SlipNo,
        b.Fullname RequestUser,c.Fullname ReceiveUser,
        FORMAT(a.RequestTime, 'dd/MM/yyyy HH:mm:ss') RequestTime,
        FORMAT(a.ReceiveTime, 'dd/MM/yyyy HH:mm:ss') ReceiveTime,
        a.Section,a.InjShot,a.MoldId,a.MoldControlNo,a.MoldName,
        a.PartId,a.PartNo,a.PartName,a.McName,a.Cavity,a.CoolingType,a.OrderType,
        FORMAT(a.InjDate, 'dd/MM/yyyy HH:mm:ss') InjDate,
        FORMAT(a.PartDate, 'dd/MM/yyyy HH:mm:ss') PartDate,
        a.ProblemId,a.ProblemSource,a.ProblemFilePath,a.Detail,a.Cause
      FROM [RepairOrder] a
      LEFT JOIN [User] b on a.RequestUserId = b.UserId
      LEFT JOIN [User] c on a.ReceiveUserId = c.UserId
      WHERE RepairId = ${RepairId};
    SELECT CheckMoldId, CheckMoldNo, CheckMold, Checked
      FROM [RepairCheckMold]
      WHERE RepairId = ${RepairId} ORDER BY CheckMoldNo;
    SELECT TOP 1 a.IndexProgress, a.RepairFilePath, a.FixDetail, 
        FORMAT(a.RepairFileTime, 'dd/MM/yyyy HH:mm:ss') RepairFileTime,
        FORMAT(a.RepairStart, 'dd/MM/yyyy HH:mm:ss') RepairStart,
        FORMAT(a.RepairEnd, 'dd/MM/yyyy HH:mm:ss') RepairEnd,
        FORMAT(a.PointCheckTime, 'dd/MM/yyyy HH:mm:ss') PointCheckTime,
        a.UploadUserId, b.Fullname UploadUser, c.Fullname RepairUser 
      FROM [RepairProgress] a
      LEFT JOIN [User] b on a.UploadUserId = b.UserId
      LEFT JOIN [User] c on a.RepairUserId = c.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexProgress DESC;
    SELECT TOP 1 a.IndexCheck,a.CheckResult,a.AltCheckResult,a.DmCheckResult,a.DmAltCheckResult,
        a.CheckUserId,a.AltCheckUserId,a.DmCheckUserId,a.DmAltCheckUserId,
        FORMAT(a.CheckTime, 'dd/MM/yyyy HH:mm:ss') CheckTime,
        FORMAT(a.AltCheckTime, 'dd/MM/yyyy HH:mm:ss') AltCheckTime,
        FORMAT(a.DmCheckTime, 'dd/MM/yyyy HH:mm:ss') DmCheckTime,
        FORMAT(a.DmAltCheckTime, 'dd/MM/yyyy HH:mm:ss') DmAltCheckTime,
        b.Fullname CheckUser, c.Fullname AltCheckUser,
        d.Fullname DmCheckUser, e.Fullname DmAltCheckUser
      FROM [RepairCheck] a
      LEFT JOIN [User] b on a.CheckUserId = b.UserId
      LEFT JOIN [User] c on a.AltCheckUserId = c.UserId
      LEFT JOIN [User] d on a.DmCheckUserId = d.UserId
      LEFT JOIN [User] e on a.DmAltCheckUserId = e.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexCheck DESC;
    SELECT TOP 1 a.IndexApprove,a.ApproveResult,a.AltApproveResult,a.DmApproveResult,a.DmAltApproveResult,
        a.ApproveUserId,a.AltApproveUserId,a.DmApproveUserId,a.DmAltApproveUserId,
        FORMAT(a.ApproveTime, 'dd/MM/yyyy HH:mm:ss') ApproveTime,
        FORMAT(a.AltApproveTime, 'dd/MM/yyyy HH:mm:ss') AltApproveTime,
        FORMAT(a.DmApproveTime, 'dd/MM/yyyy HH:mm:ss') DmApproveTime,
        FORMAT(a.DmAltApproveTime, 'dd/MM/yyyy HH:mm:ss') DmAltApproveTime,
        b.Fullname ApproveUser, c.Fullname AltApproveUser,
        d.Fullname DmApproveUser, e.Fullname DmAltApproveUser
      FROM [RepairApprove] a
      LEFT JOIN [User] b on a.ApproveUserId = b.UserId
      LEFT JOIN [User] c on a.AltApproveUserId = c.UserId
      LEFT JOIN [User] d on a.DmApproveUserId = d.UserId
      LEFT JOIN [User] e on a.DmAltApproveUserId = e.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexApprove DESC;
    SELECT TOP 1 a.IndexQa,a.QaResult,a.QaRemark,
        FORMAT(a.TryDate, 'dd/MM/yyyy HH:mm:ss') TryDate,
        FORMAT(a.QaTime, 'dd/MM/yyyy HH:mm:ss') QaTime,
        a.QaFilePath,a.QaUserId,b.Fullname QaUser
      FROM [RepairQa] a
      LEFT JOIN [User] b on a.QaUserId = b.UserId
      WHERE RepairId = ${RepairId} ORDER BY IndexQa DESC;`;
  let Repairs = await pool.request().query(SelectRepairs);
  let Repair = Repairs.recordsets[0][0];
  Repair.CheckMold = Repairs.recordsets[1] || {};
  Repair.Progress = Repairs.recordsets[2][0] || {};
  Repair.Check = Repairs.recordsets[3][0] || {};
  Repair.Approve = Repairs.recordsets[4][0] || {};
  Repair.Qa = Repairs.recordsets[5][0] || {};
  return Repair;
};

const insertChecklist = async (RepairId, IndexProgress, OrderType, Time) => {
  let pool = await sql.connect(dbconfig);
  if (OrderType == 4) {
    let Check = await getChecklist(5);
    for (let check = 0; check < Check.data.length; check++) {
      let {
        CheckPreventListId,
        CheckPreventListNo,
        CheckPreventList,
        CheckPreventTopicId,
        CheckPreventTopic,
      } = Check.data[check];
      let InsertChecklist = `INSERT INTO [RepairChecklist](
          RepairId, CreatedTime,IndexProgress, CheckTopicId,
          CheckListId,CheckTopic, CheckListNo,CheckList)
        VALUES(${RepairId},N'${Time}',${IndexProgress},${CheckPreventTopicId},
          ${CheckPreventListId},N'${CheckPreventTopic}',${CheckPreventListNo},N'${CheckPreventList}')`;
      await pool.request().query(InsertChecklist);
    }
    console.log("preventive checklist added");
  } else {
    let Check = await getChecklist(2);
    for (let check = 0; check < Check.data.length; check++) {
      let { CheckRepairId, CheckRepairNo, CheckRepair } = Check.data[check];
      let InsertChecklist = `INSERT INTO [RepairChecklist](
          RepairId, CreatedTime,IndexProgress, CheckTopicId,
          CheckListId, CheckTopic, CheckListNo,CheckList)
        VALUES(${RepairId},N'${Time}',${IndexProgress},0,
        ${CheckRepairId},N'',${CheckRepairNo},N'${CheckRepair}')`;
      await pool.request().query(InsertChecklist);
    }
    console.log("repair checklist added");
  }
};

exports.getSlipNo = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  Slip = await pool.request().query(`SELECT SlipNo 
    FROM [RepairOrder] WHERE RepairId = ${RepairId}`);
  return Slip.recordset[0].SlipNo;
};
exports.getStatus = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  Status = await pool.request().query(`SELECT StatusId 
    FROM [RepairOrder] WHERE RepairId = ${RepairId}`);
  return Status.recordset[0].StatusId;
};

exports.checkDm = async (Users = { UserId: 0, Userpass: "" }) => {
  let { UserId, Userpass } = Users;
  // console.log(Users)
  let pool = await sql.connect(dbconfig);
  let User;
  if (Userpass)
    User = await pool.request().query(`SELECT a.UserId , a.Fullname, b.Section
    FROM [User] a LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
    WHERE Userpass = N'${encrypt(Userpass)}'`);
  else if (UserId)
    User = await pool.request().query(`SELECT a.UserId , a.Fullname, b.Section
    FROM [User] a LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
    WHERE UserId = ${UserId}`);
  else throw Error("User is not Found");
  if (!User.recordset.length) throw Error("User is not Found");
  let { Fullname, Section } = User.recordset[0];
  let isNotDm = Section == "DM" || Section == "ADMIN" ? false : true;
  return { UserId: User.recordset[0].UserId, Fullname, isNotDm };
};

exports.updateStatus = async (
  RepairId,
  Option = { Status: 0, UserId: 0, Time: gettime(), Index: 0 }
) => {
  let { Status, UserId, Time, Index } = Option;
  console.log("update status", RepairId, Option);
  let pool = await sql.connect(dbconfig);
  let Slip, UpdateOrder;

  if (Status == 2) {
    // UPDATE TO Status Receive
    UpdateOrder = `UPDATE RepairOrder
        SET StatusId = 2, ReceiveUserId = ${UserId}, ReceiveTime = N'${Time}'
        WHERE RepairId = ${RepairId};
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
  } else if (Status == 3) {
    //UPDATE TO Status Inprogress
    let selectOrderType = await pool.request()
      .query(`SELECT OrderType,ProblemId,Problem FROM RepairOrder
      WHERE RepairId = ${RepairId}`);
    let { OrderType } = selectOrderType.recordset[0];
    let { IndexProgress } = await selectIndex(RepairId, Status);
    // console.log(RepairId, IndexProgress, OrderType)
    await insertChecklist(RepairId, IndexProgress, OrderType, Time);
    let PastRepair = await pool.request()
      .query(`SELECT RepairUserId,SparePartSlip,FixDetail
      FROM [RepairProgress] WHERE RepairId = ${RepairId} AND IndexProgress = ${
      IndexProgress - 1
    }`);
    if (PastRepair.recordset.length) {
      let { SparePartSlip, FixDetail, RepairUserId } = PastRepair.recordset[0];
      UpdateOrder = `INSERT INTO RepairProgress(RepairId, CreatedTime,IndexProgress,SparePartSlip, FixDetail,RepairUserId,RepairStart)
          VALUES(${RepairId},N'${Time}',${IndexProgress},N'${SparePartSlip}',N'${FixDetail}',${RepairUserId},N'${Time}');
        UPDATE [RepairOrder] SET StatusId = 3 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    } else {
      let { ProblemId, Problem } = selectOrderType.recordset[0];
      let selectProblemType = await pool
        .request()
        .query(
          `SELECT ProblemType FROM [MasterProblem] WHERE ProblemId = ${ProblemId}`
        );
      let { ProblemType } = selectProblemType.recordset[0];
      let DetailInsert = "",
        DetailValue = "";
      if (ProblemType == 2) {
        DetailInsert = ",FixDetail";
        DetailValue = `,N'${Problem}'`;
      }
      UpdateOrder = `INSERT INTO RepairProgress(RepairId, CreatedTime,IndexProgress${DetailInsert},RepairUserId,RepairStart)
          VALUES(${RepairId},N'${Time}',${IndexProgress}${DetailValue},${UserId},N'${Time}');
        UPDATE [RepairTech] SET LogoutTime = N'${Time}'
          WHERE UserId = ${UserId} AND LogoutTime IS NULL;
        INSERT INTO [RepairTech](RepairId, UserId,LoginTime)
          VALUES(${RepairId},${UserId},N'${Time}');
        UPDATE [RepairOrder] SET StatusId = 3 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    }
  } else if (Status == 4) {
    // UPDATE TO Status Wait Check
    let { IndexCheck } = await selectIndex(RepairId, Status);
    UpdateOrder = `INSERT INTO RepairCheck(RepairId, CreatedTime,IndexCheck)
        VALUES(${RepairId},N'${Time}',${IndexCheck});
      UPDATE [RepairOrder] SET StatusId = 4 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
  } else if (Status == 5) {
    //UPDATE TO Status Wait Approve
    let { IndexApprove } = await selectIndex(RepairId, Status);
    UpdateOrder = `INSERT INTO RepairApprove(RepairId, CreatedTime,IndexApprove)
        VALUES(${RepairId},N'${Time}',${IndexApprove});
      UPDATE [RepairOrder] SET StatusId = 5 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
  } else if (Status == 6) {
    // UPDATE TO Status Wait Result
    let { IndexQa } = await selectIndex(RepairId, Status);
    let StatusId = await this.getStatus(RepairId);
    if (StatusId == 7) {
      UpdateOrder = `UPDATE [RepairOrder] SET StatusId = 6 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    } else {
      UpdateOrder = `INSERT INTO RepairQa(RepairId, CreatedTime,IndexQa)
        VALUES(${RepairId},N'${Time}',${IndexQa});
      UPDATE [RepairOrder] SET StatusId = 6 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    }
  } else if (Status == 7) {
    // UPDATE TO Status Wait Result Alt
    let { IndexQa } = await selectIndex(RepairId, Status);
    UpdateOrder = `INSERT INTO RepairQa(RepairId, CreatedTime,IndexQa)
        VALUES(${RepairId},N'${Time}',${IndexQa});
      UPDATE [RepairOrder] SET StatusId = 7 WHERE RepairId = ${RepairId};
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
  } else if (Status == 8) {
    // UPDATE TO Status Finish
    UpdateOrder = `UPDATE [RepairOrder] SET StatusId = 8,
        FinishTime = N'${Time}',FinishUserId = ${UserId} WHERE RepairId = ${RepairId};
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
  } else if (Status == 9) {
    // UPDATE TO Status Real Finish
    UpdateOrder = `UPDATE [RepairOrder] SET StatusId = 9 WHERE RepairId = ${RepairId};
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
  } else throw Error("Unknown Status");
  Slip = await pool.request().query(UpdateOrder);
  return Slip.recordset[0].SlipNo;
};

exports.checkAlt = async (RepairId, IndexApprove, IndexCheck) => {
  let pool = await sql.connect(dbconfig);
  let selectAlt = await pool.request().query(`SELECT DmCheckUserId
      FROM [RepairCheck] WHERE RepairId = ${RepairId} AND IndexCheck = ${IndexCheck};
    SELECT DmApproveUserId
      FROM [RepairApprove] WHERE RepairId = ${RepairId} AND IndexApprove = ${IndexApprove};`);
  let { DmCheckUserId } = selectAlt.recordsets[0][0];
  let { DmApproveUserId } = selectAlt.recordsets[1][0];
  if (DmCheckUserId && DmApproveUserId) return 6; // Wait Result
  return 7; // Wait Result Alt
};
exports.checkChecked = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  let checkStatus = { alt: 0, real: 0 };
  let isCheck = false;
  let selectCheck = await pool.request()
    .query(`SELECT TOP 1 DmCheckUserId,DmAltCheckUserId
      FROM [RepairCheck] WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;`);
  let { DmCheckUserId, DmAltCheckUserId } = selectCheck.recordset[0];
  if (DmAltCheckUserId) {
    checkStatus["alt"] = 1;
    isCheck = true;
  }
  if (DmCheckUserId) {
    checkStatus["real"] = 1;
    isCheck = true;
  }
  return { checkStatus, isCheck };
};
exports.checkApproved = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  let approveStatus = { alt: 0, real: 0 };
  let isApprove = false;
  let selectAlt = await pool.request()
    .query(`SELECT TOP 1 DmApproveUserId,DmAltApproveUserId
      FROM [RepairApprove] WHERE RepairId = ${RepairId} ORDER BY CreatedTime DESC;`);
  let { DmApproveUserId, DmAltApproveUserId } = selectAlt.recordset[0];
  if (DmAltApproveUserId) {
    approveStatus["alt"] = 1;
    isApprove = true;
  }
  if (DmApproveUserId) {
    approveStatus["real"] = 1;
    isApprove = true;
  }
  return { approveStatus, isApprove };
};
exports.checkSign = async (RepairId, IndexApprove, IndexCheck, IndexQa) => {
  let pool = await sql.connect(dbconfig);
  let selectSign = await pool.request().query(`SELECT DmCheckUserId
      FROM RepairCheck WHERE RepairId = ${RepairId} AND IndexCheck = ${IndexCheck};
    SELECT DmApproveUserId
      FROM RepairApprove WHERE RepairId = ${RepairId} AND IndexApprove = ${IndexApprove};
    SELECT QaUserId
      FROM RepairQa WHERE RepairId = ${RepairId} AND IndexQa = ${IndexQa};`);
  let { DmCheckUserId } = selectSign.recordsets[0][0];
  let { DmApproveUserId } = selectSign.recordsets[1][0];
  let { QaUserId } = selectSign.recordsets[2][0];
  if (DmCheckUserId && DmApproveUserId && QaUserId) return false; // All Check
  return true; // Not check all
};

const selectIndex = async (RepairId, Status) => {
  let pool = await sql.connect(dbconfig);
  let SelectIndex;
  if (Status == 3) {
    // IndexProgress
    SelectIndex = `SELECT COUNT(CreatedTime) IndexProgress
      FROM RepairProgress WHERE RepairId = ${RepairId}`;
  } else if (Status == 4) {
    // IndexCheck
    SelectIndex = `SELECT COUNT(CreatedTime) IndexCheck
    FROM RepairCheck WHERE RepairId = ${RepairId}`;
  } else if (Status == 5) {
    // IndexApprove
    SelectIndex = `SELECT COUNT(CreatedTime) IndexApprove
      FROM RepairApprove WHERE RepairId = ${RepairId}`;
  } else if (Status == 6 || Status == 7) {
    // IndexQa
    SelectIndex = `SELECT COUNT(CreatedTime) IndexQa
      FROM RepairQa WHERE RepairId = ${RepairId}`;
  }
  let getIndex = await pool.request().query(SelectIndex);
  return getIndex.recordset[0];
};

exports.selectIndexImg = async (RepairId, Type, Index = 0) => {
  let pool = await sql.connect(dbconfig);
  let SelectIndex;
  if (Type == "order") {
    // IndexProgress
    SelectIndex = `SELECT COUNT(RepairId) IndexImg
      FROM [RepairOrderImg] WHERE Repairid =${RepairId}`;
    let getIndex = await pool.request().query(SelectIndex);
    let { IndexImg } = getIndex.recordset[0];
    while (true) {
      let checkIndex = await pool.request()
        .query(`SELECT IndexImg FROM [RepairOrderImg]
      WHERE Repairid =${RepairId} AND IndexImg = ${IndexImg}`);
      if (!checkIndex.recordset.length) break;
      if (IndexImg == checkIndex.recordset[0].IndexImg) {
        IndexImg++;
        continue;
      }
      break;
    }
    return IndexImg;
  } else if (Type == "repair") {
    // IndexCheck
    SelectIndex = `SELECT COUNT(RepairId) IndexImg FROM [RepairProgressImg]
      WHERE Repairid =${RepairId} AND IndexProgress= ${Index}`;
    let getIndex = await pool.request().query(SelectIndex);
    let { IndexImg } = getIndex.recordset[0],
      isDup = true;
    while (isDup) {
      let checkIndex = await pool.request()
        .query(`SELECT IndexImg FROM [RepairProgressImg]
      WHERE Repairid =${RepairId} AND IndexProgress= ${Index} AND IndexImg = ${IndexImg}`);
      if (!checkIndex.recordset.length) break;
      if (IndexImg == checkIndex.recordset[0].IndexImg) {
        IndexImg++;
        continue;
      }
      break;
    }
    return IndexImg;
  } else if (Type == "inspect") {
    // IndexApprove
    SelectIndex = `SELECT COUNT(RepairId) IndexImg FROM [RepairInspectImg]
    WHERE Repairid =${RepairId} AND IndexProgress= ${Index}`;
    let getIndex = await pool.request().query(SelectIndex);
    let { IndexImg } = getIndex.recordset[0];
    while (true) {
      let checkIndex = await pool.request()
        .query(`SELECT IndexImg FROM [RepairInspectImg]
      WHERE Repairid =${RepairId} AND IndexProgress= ${Index} AND IndexImg = ${IndexImg}`);
      if (!checkIndex.recordset.length) break;
      if (IndexImg == checkIndex.recordset[0].IndexImg) {
        IndexImg++;
        continue;
      }
      break;
    }
    return IndexImg;
  } else if (Type == "qa") {
    // IndexQa
    SelectIndex = `SELECT COUNT(RepairId) IndexImg FROM [RepairQaImg]
    WHERE Repairid =${RepairId} AND IndexQa= ${Index}`;
    let getIndex = await pool.request().query(SelectIndex);
    let { IndexImg } = getIndex.recordset[0];
    while (true) {
      let checkIndex = await pool.request()
        .query(`SELECT IndexImg FROM [RepairQaImg]
      WHERE Repairid =${RepairId} AND IndexQa= ${Index} AND IndexImg = ${IndexImg}`);
      if (!checkIndex.recordset.length) break;
      if (IndexImg == checkIndex.recordset[0].IndexImg) {
        IndexImg++;
        continue;
      }
      break;
    }
    return IndexImg;
  }
};

exports.deleteImg = async (ImgPath) => {
  let pool = await sql.connect(dbconfig);
  let deleteImage;
  // if (Type == 'order') { // IndexProgress
  deleteImage = `DELETE FROM [RepairOrderImg] WHERE ProblemFilePath =N'${ImgPath}';
    DELETE FROM [RepairProgressImg] WHERE RepairFilePath =N'${ImgPath}';
    DELETE FROM [RepairInspectImg] WHERE InspectFilePath =N'${ImgPath}';
    DELETE FROM [RepairQaImg] WHERE QaFilePath =N'${ImgPath}'`;
  // } else if (Type == 'repair') { // IndexCheck
  //   deleteImage = ``
  // } else if (Type == 'inspect') { // IndexApprove
  //   deleteImage = ``
  // } else if (Type == 'qa') { // IndexQa
  //   deleteImage = ``
  // }
  return await pool.request().query(deleteImage);
};
