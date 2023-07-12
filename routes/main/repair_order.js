const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbconfig = require('../../libs/dbconfig');
const createError = require('http-errors');

const path = require('path');
const fs = require('fs');
const pdfMake = require('pdfmake');

const { gettime } = require('../../libs/datetime');
const {
  multerOrder,
  uploadOrder,
  changeFileName,
} = require('../middleware/uploadFile');
const { getChecklist } = require('../../controller/checklistController');
const {
  updateStatus,
  getRepair,
  getPointcheck,
  getSlipNo,
  getStatus,
  getRepairImg,
  checkAlt,
  checkSign,
  checkDm,
  selectIndexImg,
  deleteImg,
  checkChecked,
  checkApproved,
} = require('../../controller/repairOrderController');
const tech = require('../../controller/repairUserController');
const { fonts, createRepairTag } = require('../../libs/pdf-generator');
const { sendData } = require('../../libs/socket-io');
const { updateRepairDoc } = require('../../controller/repairDocController');

// List
router.get('/list/:Section', async (req, res, next) => {
  try {
    let { Section } = req.params;
    let Sections = Section.split(',');
    let sectionSelect = '';
    if (Sections.length == 1)
      sectionSelect =
        Sections[0] == 'ALL' ? '' : `AND a.Section = N'${Section}'`;
    else
      for (let idx = 0; idx < Sections.length; idx++) {
        if (Sections[idx] == 'ALL') break;
        if (idx == 0) sectionSelect += ` AND (a.Section = N'${Sections[idx]}'`;
        else if (idx == Sections.length - 1)
          sectionSelect += ` OR a.Section = N'${Sections[idx]}')`;
        else sectionSelect += ` OR a.Section = N'${Sections[idx]}'`;
      }
    let SelectRepair = `SELECT a.RepairId, a.SlipNo, a.StatusId, b.StatusName, a.Section,
        a.MoldName, a.MoldControlNo, a.Problem, a.Detail, d.Fullname RequestUser,
        (SELECT TOP 1 e.Fullname FROM [User] e
          LEFT JOIN [RepairProgress] c on c.RepairUserId = e.UserId
          WHERE c.RepairId = a.RepairId
          ORDER BY IndexProgress DESC) RepairUser,
        FORMAT(a.InjDate, 'yyyy-MM-dd HH:mm') InjDate,
        FORMAT(a.RequestTime, 'yyyy-MM-dd HH:mm') RequestTime,
        FORMAT(a.TagTime, 'yyyy-MM-dd HH:mm') TagTime,
        FORMAT(a.FinishTime, 'yyyy-MM-dd HH:mm') FinishTime,
        (SELECT TOP 1 ScheduleResult FROM
          [RepairSchedule] e
          WHERE e.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) ScheduleResult,
        (SELECT TOP 1 DmCheckResult FROM
          [RepairCheck] f
          WHERE f.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) DmCheckResult,
        (SELECT TOP 1 DmAltCheckResult FROM
          [RepairCheck] g
          WHERE g.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) DmAltCheckResult,
        (SELECT TOP 1 DmApproveResult FROM
          [RepairApprove] h
          WHERE h.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) DmApproveResult,
        (SELECT TOP 1 DmAltApproveResult FROM
          [RepairApprove] i
          WHERE i.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) DmAltApproveResult,
        (SELECT TOP 1 CheckQaResult FROM
          [RepairQa] j
          WHERE j.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) CheckQaResult,
        (SELECT TOP 1 QaUserId FROM
          [RepairQa] k
          WHERE k.RepairId = a.RepairId
          ORDER BY CreatedTime DESC) QaUserId
      FROM [RepairOrder] a
      LEFT JOIN [MasterStatus] b on a.StatusId = b.StatusId
      LEFT JOIN [User] d on a.RequestUserId = d.UserId
      WHERE NOT a.StatusId = 9 ${sectionSelect}
      ORDER BY a.StatusId`;
    let pool = await sql.connect(dbconfig);
    let Repair = await pool.request().query(SelectRepair);
    res.status(200).send(JSON.stringify(Repair.recordset));
  } catch (err) {
    next(err);
  }
});
router.get('/status/:Section', async (req, res, next) => {
  try {
    let { Section } = req.params;
    let Sections = Section.split(',');
    let sectionSelect = '';
    if (Sections.length == 1)
      sectionSelect =
        Sections[0] == 'ALL' ? '' : `AND a.Section = N'${Section}'`;
    else
      for (let idx = 0; idx < Sections.length; idx++) {
        if (Sections[idx] == 'ALL') break;
        if (idx == 0) sectionSelect += ` AND (a.Section = N'${Sections[idx]}'`;
        else if (idx == Sections.length - 1)
          sectionSelect += ` OR a.Section = N'${Sections[idx]}')`;
        else sectionSelect += ` OR a.Section = N'${Sections[idx]}'`;
      }
    let SelectStatus = `SELECT a.StatusId,b.StatusName,COUNT(RepairId) StatusCount
        FROM [RepairOrder] a
        LEFT JOIN [MasterStatus] b on a.StatusId = b.StatusId
        WHERE NOT a.StatusId = 9 ${sectionSelect}
        GROUP BY a.StatusId,b.StatusName
        ORDER BY a.StatusId`;
    let pool = await sql.connect(dbconfig);
    let Status = await pool.request().query(SelectStatus);
    res.status(200).send(Status.recordset);
  } catch (err) {
    next(err);
  }
});
// Template
router.get('/template/:RequestUserId', async (req, res, next) => {
  try {
    let { RequestUserId } = req.params;
    let RequestTime = gettime();
    let Check = await getChecklist(1);
    let pool = await sql.connect(dbconfig);
    let Request = await pool.request().query(`SELECT Fullname RequestUser
      FROM [User] WHERE UserId = ${RequestUserId}`);
    let { RequestUser } = Request.recordset[0];
    res.status(200).send({ RequestTime, RequestUser, CheckMold: Check.data });
  } catch (err) {
    next(err);
  }
});

// Repair Detail
router.get('/repair/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let Repair = await getRepair(RepairId);
    let { IndexProgress } = Repair.Progress || '',
      { IndexQa } = Repair.Qa || '';
    let RepairImg = await getRepairImg(RepairId, IndexProgress, IndexQa);
    Repair.RepairImg = RepairImg;
    res.status(200).send(Repair);
  } catch (err) {
    next(err);
  }
});
router.get('/repairtech/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let pool = await sql.connect(dbconfig);
    let SelectTechs = `SELECT a.UserId, b.Fullname Technician,
        FORMAT(a.LoginTime, 'yyyy-MM-dd HH:mm:ss') LoginTime, 
        FORMAT(a.LogoutTime, 'yyyy-MM-dd HH:mm:ss') LogoutTime
      FROM [RepairTech] a
      LEFT JOIN [User] b on a.UserId = b.UserId
      WHERE RepairId = ${RepairId} ORDER BY a.LoginTime DESC`;
    let Techs = await pool.request().query(SelectTechs);
    res.status(200).send(JSON.stringify(Techs.recordset));
  } catch (err) {
    next(err);
  }
});
router.get('/pointcheck/:RepairId&:IndexProgress', async (req, res, next) => {
  try {
    let { RepairId, IndexProgress } = req.params;
    let PointCheck = await getPointcheck(RepairId, IndexProgress);
    res.status(200).send(PointCheck);
  } catch (err) {
    next(err);
  }
});

router.get('/download_img/:ImgPath', async (req, res, next) => {
  try {
    // Filter = { Type:"request","repair","qa", Index: ""/IndexProgress/IndexQa}
    let { ImgPath } = req.params;
    // let SlipNo = await getSlipNo(RepairId)
    // for (let i = 0; i < imgExt.length; i++) {
    let filePath = path.join(process.cwd(), `/public`, ImgPath);
    if (fs.existsSync(filePath)) return res.status(200).download(filePath);
    // }
    res.status(404).send({ message: 'File not Found' });
  } catch (err) {
    next(err);
  }
});

// Request
router.post('/request', multerOrder, async (req, res, next) => {
  // UPDATE TO Status Request
  console.log(req.body);
  console.log(req.files);
  try {
    // IsOther : 0 None, 1 Other
    let Data = JSON.parse(req.body.Data);
    let Files = req.files;
    for (let [key, value] of Object.entries(Data)) {
      if (key != 'IsOther' && value == '') {
        return next(createError(400, 'Please fill every field'));
      }
    }
    let {
      RequestUserId,
      RequestTime,
      MoldId,
      PartId,
      McName,
      Cavity,
      OrderType,
      CoolingType,
    } = Data;
    let {
      InjDate,
      PartDate,
      Detail,
      Cause,
      ProblemId,
      ProblemSource,
      InjShot,
      MoldCheckList,
      IsOther,
    } = Data;
    for (let moldcheck = 0; moldcheck < MoldCheckList.length; moldcheck++) {
      let { Checked } = MoldCheckList[moldcheck];
      if (Checked == 0) return next(createError(400, 'Please down mold check'));
    }
    if (!MoldId) return next(createError(400, 'Invalid Mold'));
    if (!PartId) return next(createError(400, 'Invalid Part'));
    let [date, time] = RequestTime.split(' ');
    let [yy, mm, dd] = date.split('-');
    let pool = await sql.connect(dbconfig);
    let SectionMoldPart = await pool.request()
      .query(`SELECT a.SectionId, b.Section FROM [User] a
        LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
        WHERE UserId = ${RequestUserId};
      SELECT MoldName, MoldControlNo
        FROM [MasterMold] WHERE MoldId = ${MoldId};
      SELECT PartName, PartNo FROM [MasterPart]
        WHERE PartId = ${PartId};
      SELECT McId FROM [MasterMc]
        WHERE McName = N'${McName}';
      SELECT ProblemNo, Problem FROM [MasterProblem]
        WHERE ProblemId = ${ProblemId};`);
    if (!SectionMoldPart.recordsets[1].length)
      return next(createError(404, 'Mold not found'));
    if (!SectionMoldPart.recordsets[2].length)
      return next(createError(404, 'Part not found'));
    if (!SectionMoldPart.recordsets[3].length)
      return next(createError(404, 'MC not found'));
    let { Section } = SectionMoldPart.recordsets[0][0];
    let { MoldName, MoldControlNo } = SectionMoldPart.recordsets[1][0];
    let { PartName, PartNo } = SectionMoldPart.recordsets[2][0];
    let { ProblemNo, Problem } = SectionMoldPart.recordsets[4][0];
    let SelectSlip = `SELECT COUNT(RepairId) Count FROM RepairOrder
      WHERE DATEDIFF(month, RequestTime, '${RequestTime}') = 0`;
    let Slip = await pool.request().query(SelectSlip);
    let SlipCount = Slip.recordset[0].Count + 1;
    let SlipTxt =
      SlipCount < 10
        ? '00' + SlipCount
        : SlipCount < 100
        ? '0' + SlipCount
        : SlipCount;
    let SlipNo = yy.slice(2) + mm + dd + SlipTxt;
    let Filenames = `${SlipNo}_request`;
    let InsertRepair = `INSERT INTO RepairOrder(SlipNo,InjShot, Section, MoldId, MoldName, MoldControlNo,
        PartId, PartName, PartNo, McName, Cavity, OrderType, CoolingType, InjDate, PartDate,
        Detail, Cause, ProblemId, ProblemNo, Problem, ProblemSource, RequestUserId, RequestTime)
      VALUES (N'${SlipNo}',${InjShot},N'${Section}',${MoldId},N'${MoldName}',N'${MoldControlNo}',
        ${PartId},N'${PartName}',N'${PartNo}',N'${McName}',${Cavity},${OrderType},N'${CoolingType}',
        N'${InjDate}',N'${PartDate}',N'${Detail}',N'${Cause}',${ProblemId},N'${ProblemNo}',
        N'${Problem}',N'${ProblemSource}',${RequestUserId},N'${RequestTime}')
      SELECT SCOPE_IDENTITY() as Id`;
    let Repair = await pool.request().query(InsertRepair);
    let RepairId = Repair.recordset[0].Id;
    let ShotDest = './img/repairorder';
    for (let idx = 0; idx < Files.length; idx++) {
      let des = path.join(process.cwd(), '/public/' + ShotDest);
      let IndexImg = await selectIndexImg(RepairId, 'order');
      let Filename = await changeFileName(
        des,
        Files[idx],
        `${Filenames}_${IndexImg}`
      );
      let ProblemFilePath = `${ShotDest}/${Filename}`;
      let OrderUpload = `INSERT INTO [RepairOrderImg](
        RepairId,IndexImg,ProblemFilePath)
        VALUES(
          ${RepairId},${IndexImg},N'${ProblemFilePath}')`;
      await pool.request().query(OrderUpload);
    }
    for (let moldcheck = 0; moldcheck < MoldCheckList.length; moldcheck++) {
      let { CheckMoldId, CheckMoldNo, CheckMold, Checked } =
        MoldCheckList[moldcheck];
      let InsertCheckMold = `INSERT INTO RepairCheckMold(RepairId, CheckMoldId, CheckMoldNo, CheckMold, Checked)
        VALUES(${RepairId},${CheckMoldId}, ${CheckMoldNo}, N'${CheckMold}', ${Checked})`;
      await pool.request().query(InsertCheckMold);
    }
    // IsOther: 0-none, 1-other, 2-cleaning, 3-preventive
    // if (IsOther == 1) await pool.request().query(`UPDATE [MasterMold] SET OtherShot = 0 WHERE MoldId = ${MoldId}`);
    // if (IsOther == 2) await pool.request().query(`UPDATE [MasterMold] SET CleaningShot = 0 WHERE MoldId = ${MoldId}`);
    // if (IsOther == 3) await pool.request().query(`UPDATE [MasterMold] SET PreventiveShot = 0 WHERE MoldId = ${MoldId}`);

    sendData('RepairOrder', 'repair-update', 'alert');
    res
      .status(201)
      .send({ message: `Repair order #${SlipNo} has been requested` });
  } catch (err) {
    next(err);
  }
});

// Receive
router.put('/receive/:RepairId', async (req, res, next) => {
  // UPDATE TO Status Receive
  try {
    let { RepairId } = req.params;
    let { ReceiveUserId } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: ReceiveUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let SlipNo = await updateStatus(RepairId, {
      Status: 2,
      UserId: ReceiveUserId,
      Time: datetime,
    });
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} has been received` });
  } catch (err) {
    next(err);
  }
});

// DM. Schedule
router.put('/schedule_save/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { ScheduleUserId, ScheduleResult, ScheduleDate } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: ScheduleUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    if (ScheduleResult == 0)
      next(createError(400, 'Please tick schedule result'));
    else if (ScheduleResult == 2 && !ScheduleDate)
      return next(createError(400, 'Please fill finished date'));
    let datetime = gettime();
    let pool = await sql.connect(dbconfig);
    if (ScheduleResult == 1) ScheduleDate = '';
    let InsertSchedule;
    if (ScheduleDate)
      InsertSchedule = `INSERT INTO [RepairSchedule]
        (RepairId,CreatedTime,ScheduleUserId, ScheduleResult, ScheduleDate)
      VALUES(${RepairId},N'${datetime}',${ScheduleUserId},${ScheduleResult},N'${ScheduleDate}');
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    else
      InsertSchedule = `INSERT INTO [RepairSchedule]
        (RepairId,CreatedTime,ScheduleUserId, ScheduleResult)
      VALUES(${RepairId},N'${datetime}',${ScheduleUserId},${ScheduleResult});
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    let Slip = await pool.request().query(InsertSchedule);
    let { SlipNo } = Slip.recordset[0];
    if (ScheduleResult == 2) sendData('RepairOrder', 'repair-update', 'alert');
    else sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} schedule has been saved` });
  } catch (err) {
    next(err);
  }
});

// MFG .Schedule
router.put('/schedule_mfg_save/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { ScheduleUserId, InjDate, PartDate } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: ScheduleUserId });
    if (!InjDate || !PartDate)
      next(createError(400, 'Please fill new schedule'));
    let datetime = gettime();
    let pool = await sql.connect(dbconfig);
    let InsertSchedule = `UPDATE [RepairOrder]
        SET InjDate = N'${InjDate}', PartDate = N'${PartDate}'
        WHERE RepairId = ${RepairId}
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};
      INSERT INTO [RepairSchedule]
          (RepairId,CreatedTime,ScheduleUserId, ScheduleResult)
        VALUES(${RepairId},N'${datetime}',${ScheduleUserId},0);
        SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    let Slip = await pool.request().query(InsertSchedule);
    let { SlipNo } = Slip.recordset[0];
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res.status(200).send({
      message: `Repair order #${SlipNo} injection date has been update by ${Fullname}`,
    });
  } catch (err) {
    next(err);
  }
});

// Repair
router.put('/repair_start/:RepairId', async (req, res, next) => {
  // UPDATE TO Status In Progress
  try {
    let { RepairId } = req.params;
    let { RepairUserId } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: RepairUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let SlipNo = await updateStatus(RepairId, {
      Status: 3,
      UserId: RepairUserId,
      Time: datetime,
    });
    res.status(200).send({ message: `Repair order #${SlipNo} start repair` });
  } catch (err) {
    next(err);
  }
});
router.put('/repair_upload/:RepairId', multerOrder, async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let datetime = gettime();
    let Data = JSON.parse(req.body.Data);
    let Files = req.files;
    let { IndexProgress, UploadUserId } = Data;
    let { Fullname, isNotDm } = await checkDm({ UserId: UploadUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let pool = await sql.connect(dbconfig);
    let SlipNo = await getSlipNo(RepairId);
    let Filenames = `${SlipNo}_repair${IndexProgress}`,
      ImgArr = [];
    let ShotDest = './img/repairorder';
    for (let idx = 0; idx < Files.length; idx++) {
      let des = path.join(process.cwd(), '/public/' + ShotDest);
      let IndexImg = await selectIndexImg(RepairId, 'repair', IndexProgress);
      let Filename = await changeFileName(
        des,
        Files[idx],
        `${Filenames}_${IndexImg}`
      );
      let RepairFilePath = `${ShotDest}/${Filename}`;
      let RepairUpload = `INSERT INTO [RepairProgressImg](
        RepairId,IndexProgress,IndexImg,RepairFilePath,RepairFileTime,UploadUserId)
        VALUES(
          ${RepairId},${IndexProgress},${IndexImg},N'${RepairFilePath}',N'${datetime}',${UploadUserId})`;
      await pool.request().query(RepairUpload);
      ImgArr.push({ IndexImg, RepairFilePath });
    }
    res.status(200).send({
      message: `Repair order #${SlipNo} repair file uploaded`,
      ImgArr,
    });
  } catch (err) {
    next(err);
  }
});
router.put(
  '/repair_inspect_upload/:RepairId',
  multerOrder,
  async (req, res, next) => {
    try {
      let { RepairId } = req.params;
      let datetime = gettime();
      let Data = JSON.parse(req.body.Data);
      let Files = req.files;
      let { IndexProgress, UploadUserId } = Data;
      let { Fullname, isNotDm } = await checkDm({ UserId: UploadUserId });
      if (isNotDm)
        return next(
          createError(403, `${Fullname} is not in Die Making Department`)
        );
      let pool = await sql.connect(dbconfig);
      let SlipNo = await getSlipNo(RepairId);
      let Filenames = `${SlipNo}_inspect${IndexProgress}`,
        ImgArr = [];
      let ShotDest = './img/repairorder';
      for (let idx = 0; idx < Files.length; idx++) {
        let des = path.join(process.cwd(), '/public/' + ShotDest);
        let IndexImg = await selectIndexImg(RepairId, 'inspect', IndexProgress);
        let Filename = await changeFileName(
          des,
          Files[idx],
          `${Filenames}_${IndexImg}`
        );
        let InspectFilePath = `${ShotDest}/${Filename}`;
        let InspectUpload = `INSERT INTO [RepairInspectImg](
        RepairId,IndexProgress,IndexImg,InspectFilePath,InspectFileTime,UploadUserId)
        VALUES(
          ${RepairId},${IndexProgress},${IndexImg},N'${InspectFilePath}',N'${datetime}',${UploadUserId})`;
        await pool.request().query(InspectUpload);
        ImgArr.push({ IndexImg, InspectFilePath });
      }
      res.status(200).send({
        message: `Repair order #${SlipNo} inspect file uploaded`,
        ImgArr,
      });
    } catch (err) {
      next(err);
    }
  }
);
// แก้ไข Problem source,ประเภทปัญหา,รายละเอียดของปัญหา,สาเหตุการเกิด,Inj Shot
router.put('/repair_edit/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let {
      EditUserId,
      Detail,
      Cause,
      ProblemId,
      ProblemSource,
      InjShot,
      CoolingType,
      OrderType,
    } = req.body;
    let datetime = gettime();
    let { Fullname, isNotDm } = await checkDm({ UserId: EditUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let pool = await sql.connect(dbconfig);
    let SlipNo = await getSlipNo(RepairId);
    let RepairEdit = `UPDATE [RepairOrder]
      SET InjShot = ${InjShot}, Detail = N'${Detail}', Cause = N'${Cause}',
        ProblemId = ${ProblemId}, ProblemSource = N'${ProblemSource}',
        OrderType = ${OrderType}, CoolingType = N'${CoolingType}'
      WHERE RepairId = ${RepairId}`;
    await pool.request().query(RepairEdit);
    res.status(200).send({ message: `Repair order #${SlipNo} detail edited` });
  } catch (err) {
    next(err);
  }
});
router.put('/repair_finish/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { IndexProgress, RepairUserId } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: RepairUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let pool = await sql.connect(dbconfig);
    let SlipNo = await getSlipNo(RepairId);
    let isRepairEnd = await pool.request()
      .query(`SELECT RepairEnd FROM [RepairProgress]
      WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress} AND RepairEnd IS NOT NULL`);
    if (isRepairEnd.recordset.length)
      return res.status(200).send({ message: `Point Check` });
    let FinishRepair = `UPDATE [RepairTech] SET LogoutTime = N'${datetime}'
        WHERE RepairId = ${RepairId} AND LogoutTime IS NULL;
      UPDATE [RepairProgress] SET RepairEnd = N'${datetime}', RepairUserId = ${RepairUserId}
        WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};`;
    await pool.request().query(FinishRepair);
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res.status(200).send({ message: `Repair order #${SlipNo} end repair` });
  } catch (err) {
    next(err);
  }
});

// Repair Tech
router.put('/repair_login/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { Userpass } = req.body;
    let { Fullname, isNotDm } = await checkDm({ Userpass });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let Result = await tech.signin(Userpass, RepairId, datetime);
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});
router.put('/repair_logout/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { UserId } = req.body;
    let datetime = gettime();
    let Result = await tech.signout(UserId, RepairId, datetime);
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});

// Point Check
router.put('/pointcheck_save/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { IndexProgress, SparePartSlip, FixDetail } = req.body;
    let pool = await sql.connect(dbconfig);
    let SaveCheck = `UPDATE [RepairProgress]
        SET SparePartSlip = N'${SparePartSlip}', FixDetail = N'${FixDetail}'
        WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};
      SELECT SlipNo FROM [RepairOrder] WHERE RepairId = ${RepairId};`;
    let Slip = await pool.request().query(SaveCheck);
    let { SlipNo } = Slip.recordset[0];
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} point check applied` });
  } catch (err) {
    next(err);
  }
});
router.put('/pointcheck_check/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { IndexProgress, CheckListId, Checked } = req.body;
    let pool = await sql.connect(dbconfig);
    let datetime = gettime();
    let isRepairEnd = await pool.request()
      .query(`SELECT RepairEnd FROM [RepairProgress]
      WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress} AND RepairEnd IS NOT NULL`);
    if (!isRepairEnd.recordset.length)
      await pool.request()
        .query(`UPDATE [RepairTech] SET LogoutTime = N'${datetime}'
          WHERE RepairId = ${RepairId} AND LogoutTime IS NULL;
        UPDATE [RepairProgress] SET RepairEnd = N'${datetime}'
          WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};`);
    let CheckList = `UPDATE [RepairChecklist] SET Checked = ${Checked}, CheckTime = N'${datetime}'
      WHERE RepairId = ${RepairId} AND CheckListId = ${CheckListId} AND IndexProgress = ${IndexProgress}`;
    await pool.request().query(CheckList);
    let message =
      Checked == 1 ? 'Checked' : Checked == 2 ? 'Disabled' : 'Unchecked';
    res.status(200).send({ message });
  } catch (err) {
    next(err);
  }
});
router.put('/pointcheck_finish/:RepairId', async (req, res, next) => {
  // UPDATE TO Status Wait Check
  try {
    let { RepairId } = req.params;
    let { IndexProgress, PointCheckUserId } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: PointCheckUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let pool = await sql.connect(dbconfig);
    let PointCheck = await pool.request()
      .query(`SELECT FixDetail, SparePartSlip FROM [RepairProgress]
        WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};
      SELECT CheckList FROM [RepairChecklist]
        WHERE RepairId = ${RepairId} AND Checked = 0 AND IndexProgress = ${IndexProgress};`);
    let { FixDetail, SparePartSlip } = PointCheck.recordsets[0][0];
    if (!FixDetail || !SparePartSlip)
      return next(
        createError(400, 'Please fill repair detail and spare part slip no.')
      );
    if (PointCheck.recordsets[1].length) {
      let UnChecklist = 'Please check';
      for (let count = 0; count < PointCheck.recordsets[1].length; count++) {
        let { CheckList } = PointCheck.recordsets[1][count];
        UnChecklist += `\n- ${CheckList}`;
      }
      return next(createError(400, UnChecklist));
    }
    await pool.request().query(`UPDATE [RepairProgress]
      SET PointCheckTime = N'${datetime}',PointCheckUserId = ${PointCheckUserId}
      WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress}`);
    let SlipNo = await updateStatus(RepairId, { Status: 4, Time: datetime });
    let selectOrder = await pool
      .request()
      .query(
        `SELECT MoldId,ProblemId FROM [RepairOrder] WHERE RepairId = ${RepairId};`
      );
    let { MoldId, ProblemId } = selectOrder.recordset[0];
    let selectProblem = await pool
      .request()
      .query(
        `SELECT ProblemType FROM [MasterProblem] WHERE ProblemId = ${ProblemId};`
      );
    let { ProblemType } = selectProblem.recordset[0];
    if (ProblemType == 2) {
      if (ProblemId == 20)
        await pool
          .request()
          .query(
            `UPDATE [MasterMold] SET CleaningShot = 0 WHERE MoldId = ${MoldId}`
          );
      if (ProblemId == 21)
        await pool
          .request()
          .query(
            `UPDATE [MasterMold] SET PreventiveShot = 0 WHERE MoldId = ${MoldId}`
          );
      if (ProblemId > 22)
        await pool
          .request()
          .query(
            `UPDATE [MasterMold] SET OtherShot = 0 WHERE MoldId = ${MoldId}`
          );
      let selectMold = await pool.request()
        .query(`SELECT CleaningShot, PreventiveShot, CumulativeShot, OtherShot,
        CleaningPlan, PreventivePlan, LifeShot, OtherPlan,WarnPercent,DangerPercent FROM [MasterMold] WHERE MoldId = ${MoldId};`);
      let {
        CleaningShot,
        PreventiveShot,
        CumulativeShot,
        OtherShot,
        CleaningPlan,
        PreventivePlan,
        LifeShot,
        OtherPlan,
        WarnPercent,
      } = selectMold.recordset[0];
      if (
        !(
          (CleaningPlan != 0 &&
            CleaningShot >= CleaningPlan * (WarnPercent / 100)) ||
          (PreventivePlan != 0 &&
            PreventiveShot >= PreventivePlan * (WarnPercent / 100)) ||
          (LifeShot != 0 && CumulativeShot >= LifeShot * (WarnPercent / 100)) ||
          (OtherPlan != 0 && OtherShot >= OtherPlan * (WarnPercent / 100))
        )
      ) {
        await pool
          .request()
          .query(`UPDATE [MasterMold] SET OnPm = 0 WHERE MoldId = ${MoldId}`);
      }
    }
    updateRepairDoc(RepairId);
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} point check success` });
  } catch (err) {
    next(err);
  }
});

// Check & Approve
router.put('/check_pass/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { Userpass, IndexCheck } = req.body;
    let { Fullname, isNotDm } = await checkDm({ Userpass });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let Result = await tech.signin(
      Userpass,
      RepairId,
      datetime,
      'check',
      'PASS',
      IndexCheck
    );
    let SlipNo = await getSlipNo(RepairId);
    let StatusId = await getStatus(RepairId);
    let isAlt = Result.includes('alternate') ? true : false;
    if (StatusId == 7 && !isAlt) {
      let { approveStatus } = await checkApproved(RepairId);
      if (approveStatus.real == 1)
        await updateStatus(RepairId, { Status: 6, Time: datetime });
    }
    if (SlipNo)
      return res.status(200).send({
        message: `Repair order #${SlipNo} has been Checked by ${Fullname}`,
        Fullname,
        isNotDm,
        isAlt,
        Time: datetime,
      });
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});
router.put('/check_reject/:RepairId', async (req, res, next) => {
  // REVERSE TO Status In Progress
  try {
    let { RepairId } = req.params;
    let { Userpass, IndexCheck, Reason } = req.body;
    if (Reason == '')
      return next(createError(400, 'Please fill reject reason'));
    let { UserId, Fullname, isNotDm } = await checkDm({ Userpass });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let Result = await tech.signin(
      Userpass,
      RepairId,
      datetime,
      'check',
      'REJECT',
      IndexCheck,
      Reason
    );
    let SlipNo = await updateStatus(RepairId, {
      Status: 3,
      UserId,
      Time: datetime,
    });
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    if (SlipNo)
      return res.status(200).send({
        message: `Repair order #${SlipNo} has been Rejected by ${Fullname}`,
      });
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});
router.put('/check_finish/:RepairId', async (req, res, next) => {
  // UPDATE TO Status Wait Approve
  try {
    let { RepairId } = req.params;
    let { CheckUserId, IndexCheck } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: CheckUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let { isCheck } = await checkChecked(RepairId);
    if (!isCheck) return next(createError(400, 'Repair is not Checked'));
    let datetime = gettime();
    let SlipNo = await updateStatus(RepairId, { Status: 5, Time: datetime });
    updateRepairDoc(RepairId);
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    if (SlipNo)
      return res
        .status(200)
        .send({ message: `Repair order #${SlipNo} has been Wait Approve` });
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});

router.put('/approve_pass/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { Userpass, IndexApprove } = req.body;
    let { Fullname, isNotDm } = await checkDm({ Userpass });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let Result = await tech.signin(
      Userpass,
      RepairId,
      datetime,
      'approve',
      'PASS',
      IndexApprove
    );
    let SlipNo = await getSlipNo(RepairId);
    let StatusId = await getStatus(RepairId);
    let isAlt = Result.includes('alternate') ? true : false;
    if (StatusId == 7 && !isAlt) {
      let { checkStatus } = await checkChecked(RepairId);
      if (checkStatus.real == 1)
        await updateStatus(RepairId, { Status: 6, Time: datetime });
    }
    if (SlipNo)
      return res.status(200).send({
        message: `Repair order #${SlipNo} has been Approved by ${Fullname}`,
        Fullname,
        isNotDm,
        isAlt,
        Time: datetime,
      });
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});
router.put('/approve_reject/:RepairId', async (req, res, next) => {
  // REVERSE TO Status In Progress
  try {
    let { RepairId } = req.params;
    let { Userpass, IndexApprove, Reason } = req.body;
    if (Reason == '')
      return next(createError(400, 'Please fill reject reason'));
    let { Fullname, isNotDm } = await checkDm({ Userpass });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let Result = await tech.signin(
      Userpass,
      RepairId,
      datetime,
      'approve',
      'REJECT',
      IndexApprove,
      Reason
    );
    let SlipNo = await updateStatus(RepairId, { Status: 4, Time: datetime });
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    if (SlipNo)
      return res.status(200).send({
        message: `Repair order #${SlipNo} has been Rejected by ${Fullname}`,
      });
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});
router.put('/approve_finish/:RepairId', async (req, res, next) => {
  // UPDATE TO Status Wait Result
  try {
    let { RepairId } = req.params;
    let { ApproveUserId, IndexApprove, IndexCheck } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: ApproveUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let { isApprove } = await checkApproved(RepairId);
    if (!isApprove) return next(createError(400, 'Repair is not Approve'));
    let datetime = gettime();
    let NextStatus = await checkAlt(RepairId, IndexApprove, IndexCheck);
    let SlipNo = await updateStatus(RepairId, {
      Status: NextStatus,
      Time: datetime,
    });
    updateRepairDoc(RepairId);
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    if (SlipNo)
      return res
        .status(200)
        .send({ message: `Repair order #${SlipNo} has been Wait Result` });
    res.status(200).send({ message: Result });
  } catch (err) {
    next(err);
  }
});

// Print tag
router.put('/print_tag/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { doc, SlipNo } = await createRepairTag(RepairId);
    let datetime = gettime();
    let pdfCreator = new pdfMake(fonts);
    let pdfDoc = pdfCreator.createPdfKitDocument(doc);
    let docPath = path.join(
      process.cwd(),
      `/public/doc/RepairTag/${SlipNo}.pdf`
    );
    let creating = pdfDoc.pipe(fs.createWriteStream(docPath));
    pdfDoc.end();
    creating.on('finish', async () => {
      console.log(SlipNo, 'tag create success');
      let pool = await sql.connect(dbconfig);
      await pool.request().query(`UPDATE [RepairOrder]
        SET TagTime = N'${datetime}' WHERE RepairId = ${RepairId}`);
      res.send({ message: `/doc/RepairTag/${SlipNo}.pdf` });
    });
  } catch (err) {
    next(err);
  }
});
router.get('/download_tag/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let SlipNo = await getSlipNo(RepairId);
    let tagPath = path.join(
      process.cwd(),
      `/public/doc/RepairTag/${SlipNo}.pdf`
    );
    fs.readFileSync(tagPath);
    res.status(200).download(tagPath);
  } catch (err) {
    next(err);
  }
});

// Print doc
router.put('/print_doc/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let SlipNo = await updateRepairDoc(RepairId);
    res.send({ message: `./doc/RepairOrder/${SlipNo}.pdf` });
  } catch (err) {
    next(err);
  }
});
router.get('/download_doc/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let SlipNo = await getSlipNo(RepairId);
    let docPath = path.join(
      process.cwd(),
      `/public/doc/RepairOrder/${SlipNo}.pdf`
    );
    fs.readFileSync(docPath);
    res.status(200).download(docPath);
  } catch (err) {
    next(err);
  }
});

router.put('/qa_upload/:RepairId', multerOrder, async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let datetime = gettime();
    let Data = JSON.parse(req.body.Data);
    let Files = req.files;
    let { IndexQa, UploadUserId } = Data;
    let pool = await sql.connect(dbconfig);
    let SlipNo = await getSlipNo(RepairId);
    let Filenames = `${SlipNo}_qa${IndexQa}`,
      ImgArr = [];
    let ShotDest = './img/repairorder';
    for (let idx = 0; idx < Files.length; idx++) {
      let des = path.join(process.cwd(), '/public/' + ShotDest);
      let IndexImg = await selectIndexImg(RepairId, 'qa', IndexQa);
      let Filename = await changeFileName(
        des,
        Files[idx],
        `${Filenames}_${IndexImg}`
      );
      let QaFilePath = `${ShotDest}/${Filename}`;
      let QaUpload = `INSERT INTO [RepairQaImg](
        RepairId,IndexQa,IndexImg,QaFilePath,QaFileTime,QaUploadUserId)
        VALUES(
          ${RepairId},${IndexQa},${IndexImg},N'${QaFilePath}',N'${datetime}',${UploadUserId})`;
      await pool.request().query(QaUpload);
      ImgArr.push({ IndexImg, QaFilePath });
    }
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} qa file uploaded`, ImgArr });
  } catch (err) {
    next(err);
  }
});
router.put('/qa_check/:RepairId', async (req, res, next) => {
  try {
    let { RepairId } = req.params;
    let { Userpass, IndexProgress, IndexQa, TryDate, QaResult, QaRemark } =
      req.body;
    for (let [key, value] of Object.entries(req.body)) {
      if (key != 'IndexProgress' && key != 'IndexQa' && value == '') {
        return next(
          createError(400, 'Please fill every QA Check field before sign')
        );
      }
    }
    let { Fullname, isNotDm } = await checkDm({ Userpass });
    let pool = await sql.connect(dbconfig);
    let checkFile = await pool.request()
      .query(`SELECT InspectFilePath FROM [RepairInspectImg]
        WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};
      SELECT QaFilePath FROM [RepairQaImg]
        WHERE RepairId = ${RepairId} AND IndexQa = ${IndexQa};`);
    let checkInspectFile = checkFile.recordsets[0].length;
    let checkQaFile = checkFile.recordsets[1].length;
    if (checkInspectFile && !checkQaFile)
      return next(createError(400, 'Please upload inspection data'));
    let datetime = gettime();
    let Result = await tech.signin(
      Userpass,
      RepairId,
      datetime,
      'qacheck',
      QaResult,
      IndexQa
    );
    let QaUpdate = `UPDATE [RepairQa]
      SET TryDate = N'${TryDate}', QaRemark = N'${QaRemark}'
      WHERE RepairId = ${RepairId} AND IndexQa = ${IndexQa}`;
    await pool.request().query(QaUpdate);
    res.status(200).send({ message: Result, Fullname });
  } catch (err) {
    next(err);
  }
});

// Finish
router.put('/finish/:RepairId', async (req, res, next) => {
  // UPDATE TO Status Finish
  try {
    let { RepairId } = req.params;
    let datetime = gettime();
    let { FinishUserId, IndexApprove, IndexCheck, IndexQa } = req.body;
    let isNotSign = await checkSign(
      RepairId,
      IndexApprove,
      IndexCheck,
      IndexQa
    );
    if (isNotSign)
      return next(
        createError(
          400,
          'Please Sign Check, Approve And QA Check before finish request'
        )
      );
    let SlipNo = await updateStatus(RepairId, {
      Status: 8,
      UserId: FinishUserId,
      Time: datetime,
    });
    updateRepairDoc(RepairId);
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} has been finished` });
  } catch (err) {
    next(err);
  }
});
router.put('/qa_reject/:RepairId', async (req, res, next) => {
  // REVERSE TO Status Wait Result
  try {
    let { RepairId } = req.params;
    let { Userpass, IndexQa, Reason } = req.body;
    if (Reason == '')
      return next(createError(400, 'Please fill reject reason'));
    let { Fullname, isNotDm } = await checkDm({ Userpass });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let SlipNo = await updateStatus(RepairId, { Status: 6, Time: datetime });
    let Result = await tech.signin(
      Userpass,
      RepairId,
      datetime,
      'qareject',
      'REJECT',
      IndexQa,
      Reason
    );
    if (SlipNo)
      return res.status(200).send({
        message: `Repair order #${SlipNo} has been Rejected by ${Fullname}`,
      });
    res.status(200).send({ message: Result });
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
  } catch (err) {
    next(err);
  }
});

// Complete
router.put('/complete/:RepairId', async (req, res, next) => {
  // UPDATE TO Status Finish
  try {
    let { RepairId } = req.params;
    let { FinishUserId, IndexApprove, IndexCheck, IndexQa } = req.body;
    let { Fullname, isNotDm } = await checkDm({ UserId: FinishUserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    let datetime = gettime();
    let isNotSign = await checkSign(
      RepairId,
      IndexApprove,
      IndexCheck,
      IndexQa
    );
    if (isNotSign)
      return next(
        createError(
          400,
          'Please Sign Check, Approve And QA Check before complete request'
        )
      );
    let SlipNo = await updateStatus(RepairId, {
      Status: 9,
      UserId: FinishUserId,
      Time: datetime,
    });
    updateRepairDoc(RepairId);
    sendData('RepairOrder', 'repair-update', 'reload Repair Order');
    res
      .status(200)
      .send({ message: `Repair order #${SlipNo} has been finished` });
  } catch (err) {
    next(err);
  }
});

router.delete('/image/:Filter', async (req, res, next) => {
  try {
    let Filter = JSON.parse(req.params.Filter);
    let { ImgPath, UserId } = Filter;
    let { Fullname, isNotDm } = await checkDm({ UserId });
    if (isNotDm)
      return next(
        createError(403, `${Fullname} is not in Die Making Department`)
      );
    await deleteImg(ImgPath);
    res.status(200).send({ message: `Image has been deleted` });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
