const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { uploadInj } = require("../middleware/uploadFile");
const { sendData } = require("../../libs/socket-io");
const fs = require('fs')
const path = require('path')
const XlsxPopulate = require("xlsx-populate");
const { getActualHistory, getPmHistory, getCumulative } = require("../../controller/pmController");
const { fillPmReport, writeReport } = require("../middleware/exportPm");

// List ALL
router.get("/list_mold/:Section", async (req, res, next) => {
  try {
    let { Section } = req.params
    let sectionSelect = Section == 'ALL' ? "" : `WHERE a.MoldSection = N'${Section}'`;
    let SelectMoldActual = `SELECT a.MoldId, a.MoldSection, a.MoldName, a.MoldControlNo,
        OtherShot, CleaningShot, CleaningPlan, PreventiveShot,
        OtherPlan, PreventivePlan, CumulativeShot, LifeShot, OnPm, WarnPercent, DangerPercent,
        (SELECT TOP 1 FORMAT(b.UpdatedTime, 'yyyy-MM-dd HH:mm:ss')
          FROM [MoldActual] b WHERE b.MoldId = a.MoldId
          ORDER BY b.UpdatedTime DESC) UpdatedTime,
        (CASE WHEN EXISTS(
            SELECT *
            FROM RepairOrder c
            WHERE c.MoldId = a.MoldId AND FinishTime IS NULL
          )
          THEN CAST (1 AS BIT)
          ELSE CAST (0 AS BIT) END) isPM
      FROM [MasterMold] a ${sectionSelect}
      ORDER BY a.MoldId`;
    let pool = await sql.connect(dbconfig);
    let MoldActualList = await pool.request().query(SelectMoldActual);
    res.status(200).send(JSON.stringify(MoldActualList.recordset));
  } catch (err) {
    next(err);
  }
});

// List PM
router.get("/list_pm/:Section", async (req, res, next) => {
  try {
    let { Section } = req.params
    let sectionSelect = Section == 'ALL' || Section == 'DM' ? "" : `AND a.MoldSection = N'${Section}'`;
    let SelectMoldActual = `SELECT a.MoldId, a.MoldSection, a.MoldName, a.MoldControlNo,
        OtherShot, CleaningShot, CleaningPlan, PreventiveShot,
        OtherPlan, PreventivePlan, CumulativeShot, LifeShot, OnPm, WarnPercent, DangerPercent,
        (SELECT TOP 1 FORMAT(b.UpdatedTime, 'yyyy-MM-dd HH:mm')
          FROM [MoldActual] b WHERE b.MoldId = a.MoldId
          ORDER BY b.UpdatedTime DESC) UpdatedTime
      FROM [MasterMold] a
      WHERE NOT OnPm = 0 ${sectionSelect}
      ORDER BY UpdatedTime DESC`;
    let pool = await sql.connect(dbconfig);
    let MoldActualList = await pool.request().query(SelectMoldActual);
    res.status(200).send(JSON.stringify(MoldActualList.recordset));
  } catch (err) {
    next(err);
  }
});

router.get("/actual_history/:MoldId&:Filter", async (req, res, next) => {
  try {
    // Filter: {FromDate,ToDate}
    let ActualHistory = await getActualHistory(req.params);
    res.status(200).send(JSON.stringify(ActualHistory));
  } catch (err) {
    next(err);
  }
});
router.get("/pm_history/:MoldId&:Filter", async (req, res, next) => {
  try {
    // Filter: {FromDate,ToDate, PmType}
    let PmHistory = await getPmHistory(req.params);
    res.status(200).send(JSON.stringify(PmHistory));
  } catch (err) {
    next(err);
  }
});
router.get("/mold_cumulative/:MoldId&:Filter", async (req, res, next) => {
  try {
    // Filter: {FromDate,ToDate}
    let Cumulative = await getCumulative(req.params);
    res.status(200).send(JSON.stringify(Cumulative));
  } catch (err) {
    next(err);
  }
})
router.get("/export_actual/:MoldId&:Filter", async (req, res, next) => {
  try {
    // Filter: {FromDate,ToDate, PmType}
    let { MoldId } = req.params;
    let Filter = JSON.parse(req.params.Filter);
    let pool = await sql.connect(dbconfig);
    let Mold = await pool.request().query(`
      SELECT MoldName, MoldControlNo FROM [MasterMold] WHERE MoldId = ${MoldId}`)
    let ActualHistory = await getActualHistory(req.params);
    let PmHistory = await getPmHistory(req.params);
    let Cumulative = await getCumulative(req.params);
    const wb = await XlsxPopulate.fromFileAsync(
      "./public/report/template/actual_template.xlsx"
    );
    const ws = wb.sheet(0);
    await fillPmReport(ws, Mold, ActualHistory, PmHistory, Cumulative, Filter);
    await writeReport(wb, "Actual_Report.xlsx");
    res
      .status(200)
      .download(path.join(process.cwd(), `/public/report/Actual_Report.xlsx`));
  } catch (err) {
    next(err);
  }
})

router.post('/mold_injshot', async (req, res, next) => {
  try {
    // MoldData : MoldId, PartId, ActualShot
    let { UpdateUserId, UpdateTime, MoldData } = req.body
    let pool = await sql.connect(dbconfig);
    for (let idx = 0; idx < MoldData.length; idx++) {
      let { MoldId, PartId, ActualShot } = MoldData[idx]
      if (!MoldId || !PartId || !ActualShot) return next(createError(400, "Invalid Mold, Part Or Inj Shot"))
    }
    for (let idx = 0; idx < MoldData.length; idx++) {
      await updateInjShot(pool, MoldData[idx], UpdateUserId, UpdateTime, 'part');
    }
    sendData('PmOrder', 'pm-update', 'reload table')
    res.status(200).send({ message: 'Mold Inj Shot Updated' });
  } catch (err) {
    next(err);
  }
})

router.post('/upload_injshot/:UpdateUserId', async (req, res, next) => {
  let excelFile = await uploadInj(req, res)
  try {
    // MoldData : MoldId, PartId, Production, ActualShot
    let { UpdateUserId } = req.params
    console.log(UpdateUserId);
    let workbook = await XlsxPopulate.fromFileAsync(excelFile)
    let rows = workbook.sheet(0).usedRange().value();
    if (rows[0].length != 4) return next(createError(400, 'Invalid Form'))
    let MoldPromiseArr = new Array;
    let pool = await sql.connect(dbconfig);
    rows.forEach((row, index) => {
      if (!index) return;
      if (!row[0].toString().includes('-')) throw Error('Please change date column in excel file to type text')
      MoldPromiseArr.push(transformRow(pool, row, UpdateUserId))
    })
    if (!MoldPromiseArr.length) return next(createError(400, 'No data in uploaded file'))
    let Data = await Promise.all(MoldPromiseArr)
    console.log(Data)
    sendData('PmOrder', 'pm-update', 'reload table')
    res.status(200).send({ message: `Upload Mold Inj Shot Success` })
  } catch (err) {
    fs.unlinkSync(excelFile)
    next(err);
  }
})

router.put("/clear_cumulative/:MoldId", async (req, res, next) => {
  try {
    let { MoldId } = req.params
    let ResetCumulative = `UPDATE [MasterMold]
      SET CumulativeShot = 0
      WHERE MoldId = ${MoldId}`;
    let pool = await sql.connect(dbconfig);
    await pool.request().query(ResetCumulative);
    sendData('PMOrder', 'pm-update', 'reload table')
    res.status(200).send({ message: 'Mold cumulative shot has been cleared' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const transformRow = (pool, row, UpdateUserId) => new Promise(async (resolve, reject) => {
  // [Date,MoldName,MoldControlNo,ShotInj]
  try {
    let Mold = await pool.request().query(`SELECT MoldId FROM [MasterMold]
    WHERE MoldControlNo = N'${row[2]}' AND MoldName = N'${row[1]}'`)
    if (!Mold.recordset.length) return reject(`Mold ${row[1]} not found `)
    let { MoldId } = Mold.recordset[0];
    let Data = { MoldId, ActualShot: row[3] }
    await updateInjShot(pool, Data, UpdateUserId, row[0], 'nopart');
    resolve('Mold Inj Shot Updated')
  } catch (err) {
    reject(err)
  }

})

const updateInjShot = async (pool, Data, UpdateUserId, UpdateTime, Type) => new Promise(async (resolve, reject) => {
  let InsertPart = '', ValuePart = '';
  if (Type == 'part') {
    let { PartId } = Data;
    selectPart = await pool.request().query(`SELECT PartName, PartNo
      FROM [MasterPart] WHERE PartId = ${PartId};`);
    let { PartName } = selectPart.recordset[0];
    InsertPart = ',PartId,PartName';
    ValuePart = `,${PartId},N'${PartName}'`;
  }
  let { MoldId, ActualShot } = Data, OnPm = 0;
  let selectMold = await pool.request().query(`
    SELECT MoldName,MoldControlNo,CleaningShot,PreventiveShot,CumulativeShot,OtherShot,
      CleaningPlan,PreventivePlan,LifeShot,OtherPlan, WarnPercent
      FROM [MasterMold] WHERE MoldId = ${MoldId};`);
  let { MoldName, MoldControlNo, CleaningShot, PreventiveShot, CumulativeShot, OtherShot,
    CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent } = selectMold.recordsets[0][0]
  if (CleaningPlan != 0) {
    CleaningShot += ActualShot;
    if (CleaningShot >= CleaningPlan * (WarnPercent / 100)) {
      OnPm = 1;
      sendData('PmOrder', 'pm-notify', { MoldId, MoldName, MoldControlNo, Message: 'need PM' })
    }
  }
  if (PreventivePlan != 0) {
    PreventiveShot += ActualShot;
    if (PreventiveShot >= PreventivePlan * (WarnPercent / 100)) {
      OnPm = 1;
      sendData('PmOrder', 'pm-notify', { MoldId, MoldName, MoldControlNo, Message: 'need PM' })
    }
  }
  if (LifeShot != 0) {
    CumulativeShot += ActualShot;
    if (CumulativeShot >= LifeShot * (WarnPercent / 100)) {
      OnPm = 1;
      sendData('PmOrder', 'pm-notify', { MoldId, MoldName, MoldControlNo, Message: 'need PM' })
    }
  }
  if (OtherPlan != 0) {
    OtherShot += ActualShot;
    if (OtherShot >= OtherPlan * (WarnPercent / 100)) {
      OnPm = 1;
      sendData('PmOrder', 'pm-notify', { MoldId, MoldName, MoldControlNo, Message: 'need PM' })
    }
  }
  let InsertQuery = `INSERT INTO [MoldActual](MoldId${InsertPart},UpdatedTime,UpdatedUserId,ActualShot)
      VALUES (${MoldId}${ValuePart},N'${UpdateTime}',${UpdateUserId},${ActualShot});
    UPDATE [MasterMold]
    SET CleaningShot = ${CleaningShot}, PreventiveShot = ${PreventiveShot},
      CumulativeShot = ${CumulativeShot}, OtherShot = ${OtherShot}, OnPm = ${OnPm}
    WHERE MoldId = ${MoldId};`
  console.log(InsertQuery)
  await pool.request().query(InsertQuery)
  resolve('success')
}) 
