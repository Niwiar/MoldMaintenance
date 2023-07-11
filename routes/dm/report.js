const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const path = require('path')
const XlsxPopulate = require("xlsx-populate");
const { isAuthEdit } = require("../middleware/checkUser");
const { getDaily, getMoldProblem, getMoldPrepare, getTopMoldProblem, getPO, getRepairHistory, getMoldCountermeasure, getDocNo } = require("../../controller/reportController");
const { fillDailyReport, writeReport, fillMonthlyReport, fillPOReport, fillRepairReport } = require("../middleware/exportReport");
const { getdate } = require("../../libs/datetime");

router.get('/docno/:DocName', async (req, res, next) => {
  try {
    let { DocName } = req.params;
    let DocNo = await getDocNo(DocName)
    res.status(200).send(DocNo);
  } catch (err) {
    next(err);
  }
})

router.get("/daily/:Filter", async (req, res, next) => {
  try {
    // Filter = {FromDate,ToDate,FromTime,ToTime}
    let Filter = JSON.parse(req.params.Filter);
    let DailyReport = await getDaily(Filter);
    res.status(200).send(JSON.stringify(DailyReport));
  } catch (err) {
    next(err);
  }
});

router.get("/monthly/mold_problem/:Month&:Section", async (req, res, next) => {
  try {
    let { Month, Section } = req.params;
    let MoldProblem = await getMoldProblem(req.params);
    res.status(200).send(JSON.stringify(MoldProblem));
  } catch (err) {
    next(err);
  }
});
router.get("/monthly/top_mold_problem/:Month&:Section", async (req, res, next) => {
  try {
    let { Month, Section } = req.params;
    let TopMoldProblem = await getTopMoldProblem(req.params);
    res.status(200).send(JSON.stringify(TopMoldProblem));
  } catch (err) {
    next(err);
  }
});
router.get("/monthly/mold_countermeasure/:Month&:Section", async (req, res, next) => {
  try {
    let { Month, Section } = req.params;
    let MoldCountermeasure = await getMoldCountermeasure(req.params);
    // console.log(MoldCountermeasure)
    res.status(200).send(JSON.stringify(MoldCountermeasure));
  } catch (err) {
    next(err);
  }
});
router.get("/monthly/mold_prepare/:Month&:Section", async (req, res, next) => {
  try {
    let { Month, Section } = req.params;
    let MoldPrepare = await getMoldPrepare(req.params);
    res.status(200).send(JSON.stringify(MoldPrepare));
  } catch (err) {
    next(err);
  }
});
router.get("/po/:Filter", async (req, res, next) => {
  try {
    // Filter = {FromDate,ToDate}
    let Filter = JSON.parse(req.params.Filter);
    let PO = await getPO(Filter);
    // console.log(PO);
    res.status(200).send(JSON.stringify(PO));
  } catch (err) {
    next(err);
  }
});
router.get("/repair/:Filter", async (req, res, next) => {
  try {
    // Filter = {FromDate,ToDate,FromTime,ToTime}
    let Filter = JSON.parse(req.params.Filter);
    let { RepairReport, TotalTime } = await getRepairHistory(Filter);
    // console.log(RepairReport);
    res.status(200).send(JSON.stringify(RepairReport));
  } catch (err) {
    next(err);
  }
});

router.get("/export_daily/:Filter", async (req, res, next) => {
  try {
    // Filter = {FromDate,ToDate,FromTime,ToTime,OrderType,Section}
    let Filter = JSON.parse(req.params.Filter);
    let DailyReport = await getDaily(Filter);
    let DocNo = await getDocNo('Daily')
    const wb = await XlsxPopulate.fromFileAsync(
      "./public/report/template/daily_report_template.xlsx"
    );
    const ws = wb.sheet(0);
    await fillDailyReport(ws, DailyReport, Filter, DocNo);
    await writeReport(wb, "Daily_Report.xlsx");
    res
      .status(200)
      .download(path.join(process.cwd(), `/public/report/Daily_Report.xlsx`));
  } catch (err) {
    next(err);
  }
});
router.get("/export_monthly/:Month&:Section", async (req, res, next) => {
  try {
    let MoldProblem = await getMoldProblem(req.params);
    let TopMoldProblem = await getTopMoldProblem(req.params);
    let MoldCountermeasure = await getMoldCountermeasure(req.params);
    let MoldPrepare = await getMoldPrepare(req.params);
    let DocNo = await getDocNo('Monthly')
    const wb = await XlsxPopulate.fromFileAsync(
      "./public/report/template/monthly_report_template.xlsx"
    );
    const ws = wb.sheet(0);
    await fillMonthlyReport(ws, MoldProblem, TopMoldProblem, MoldCountermeasure, MoldPrepare, req.params, DocNo)
    await writeReport(wb, 'Monthly_Report.xlsx')
    res.status(200).download(path.join(process.cwd(), `/public/report/Monthly_Report.xlsx`));
  } catch (err) {
    next(err);
  }
});
router.get("/export_po/:Filter", async (req, res, next) => {
  try {
    // Filter = {FromDate,ToDate}
    let Filter = JSON.parse(req.params.Filter);
    let PO = await getPO(Filter);
    let DocNo = await getDocNo('PO')
    const wb = await XlsxPopulate.fromFileAsync(
      "./public/report/template/po_report_template.xlsx"
    );
    const ws = wb.sheet(0);
    await fillPOReport(ws, PO, Filter, DocNo)
    await writeReport(wb, 'PO_Report.xlsx')
    res.status(200).download(path.join(process.cwd(), `/public/report/PO_Report.xlsx`));
  } catch (err) {
    console.log(err)
    next(err);
  }
});
router.get("/export_repair/:Filter", async (req, res, next) => {
  try {
    // Filter = {FromDate,ToDate,FromTime,ToTime}
    let Filter = JSON.parse(req.params.Filter)
    let { RepairReport, TotalTime } = await getRepairHistory(Filter)
    let DocNo = await getDocNo('History')
    const wb = await XlsxPopulate.fromFileAsync("./public/report/template/repair_history_template.xlsx")
    const ws = wb.sheet(0);
    await fillRepairReport(ws, RepairReport, TotalTime, Filter, DocNo)
    await writeReport(wb, 'Repair_Report.xlsx')
    res.status(200).download(path.join(process.cwd(), `/public/report/Repair_Report.xlsx`));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("DmReport"));

router.put('/docno', async (req, res, next) => {
  try {
    let { DocName, DocCode, DocDate } = req.body;
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let checkDoc = await pool.request().query(`SELECT DocCode, DocDate
        FROM [DocNo] WHERE DocName = N'${DocName}';`);
    let updateDocNo;
    if (checkDoc.recordset.length) updateDocNo = `UPDATE [DocNo]
      SET DocCode = N'${DocCode}', DocDate = N'${DocDate}'
      WHERE DocName = N'${DocName}';`;
    else updateDocNo = `INSERT INTO [DocNo](DocName,DocCode,DocDate)
      VALUES(N'${DocName}',N'${DocCode}',N'${DocDate}')`;
    await pool.request().query(updateDocNo);
    res.status(200).send({ message: `${DocName} Report has been updated` });
  } catch (err) {
    next(err);
  }
})

router.put("/daily", async (req, res, next) => {
  try {
    let {
      RepairId,
      OrderType,
      PartId,
      MoldId,
      ProblemSource,
      ProblemId,
      Cause,
      IndexProgress,
      FixDetail,
    } = req.body;
    for (let [key, value] of Object.entries(req.body)) {
      if (key != "IndexProgress" && value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let SectionMoldPart = await pool.request()
      .query(`SELECT MoldName, MoldControlNo
        FROM [MasterMold] WHERE MoldId = ${MoldId};
      SELECT PartName, PartNo FROM [MasterPart]
        WHERE PartId = ${PartId};
      SELECT ProblemNo, Problem FROM [MasterProblem]
        WHERE ProblemId = ${ProblemId};`);
    if (!SectionMoldPart.recordsets[0].length)
      return next(createError(404, "Mold not found"));
    if (!SectionMoldPart.recordsets[1].length)
      return next(createError(404, "Part not found"));
    if (!SectionMoldPart.recordsets[2].length)
      return next(createError(404, "Problem not found"));
    let { MoldName, MoldControlNo } = SectionMoldPart.recordsets[0][0];
    let { PartName, PartNo } = SectionMoldPart.recordsets[1][0];
    let { ProblemNo, Problem } = SectionMoldPart.recordsets[2][0];
    let updateDaily = `UPDATE [RepairOrder]
        SET OrderType = ${OrderType},
          PartId = ${PartId},PartName = N'${PartName}',PartNo = N'${PartNo}',
          MoldId = ${MoldId},MoldName = N'${MoldName}',MoldControlNo = N'${MoldControlNo}',
          ProblemId = ${ProblemId},ProblemNo = N'${ProblemNo}',Problem = N'${Problem}',
          ProblemSource = N'${ProblemSource}',Cause = N'${Cause}'
        WHERE RepairId = ${RepairId};
      UPDATE [RepairProgress]
        SET FixDetail = N'${FixDetail}'
        WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};`;
    await pool.request().query(updateDaily);
    res.status(200).send({ message: "Repair order Updated" });
  } catch (err) {
    next(err);
  }
});
router.put("/monthly", async (req, res, next) => {
  try {
    let {
      Month,
      IndexMold,
      MoldId,
      RepairDate,
      Cause,
      FixDetail,
      ResponsibleUserId,
    } = req.body;
    // console.log(MoldId)
    for (let [key, value] of Object.entries(req.body)) {
      if (key != "IndexMold" && value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    // let SectionMoldPart = await pool.request().query(`SELECT MoldName
    //     FROM [MasterMold] WHERE MoldId = ${MoldId};`);
    //     console.log(SectionMoldPart)
    // if (!SectionMoldPart.recordset.length)
    //   return next(createError(404, "Mold not found"));
    // let { MoldName } = SectionMoldPart.recordset[0];
    let updateMonthly = `UPDATE [ReportMonthly]
        SET ResponsibleUserId = ${ResponsibleUserId},
          MoldId = ${MoldId},RepairDate = N'${RepairDate}',Cause = N'${Cause}',FixDetail = N'${FixDetail}'
        WHERE DATEDIFF(month,Month,'${Month}') = 0 AND IndexMold = ${IndexMold};`;
    await pool.request().query(updateMonthly);
    res.status(200).send({ message: "Monthly mold countermeasure Updated" });
  } catch (err) {
    next(err);
  }
});
router.put("/po", async (req, res, next) => {
  try {
    let { RepairId, NoHat, AS400, MgLeader, MgMgr } = req.body;
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let updatePO = `UPDATE [RepairOrder]
      SET NoHat = N'${NoHat}',AS400 = N'${AS400}',
        MgLeader = N'${MgLeader}',MgMgr = N'${MgMgr}'
      WHERE RepairId = ${RepairId};`;
    await pool.request().query(updatePO);
    res.status(200).send({ message: "Monthly mold countermeasure Updated" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});
router.put("/po_lead", async (req, res, next) => {
  try {
    let { Filter, MgLeader, MgMgr } = req.body
    let { FromDate, ToDate } = Filter
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let updatePO = `UPDATE [RepairOrder]
      SET MgLeader = N'${MgLeader}',MgMgr = N'${MgMgr}'
      WHERE DATEDIFF(Day,'${FromDate}',RequestTime) >= 0
        AND DATEDIFF(Day,'${ToDate}',RequestTime) <= 0;`
    await pool.request().query(updatePO);
    res.status(200).send({ message: 'Monthly mold countermeasure Updated' });
  } catch (err) {
    next(err);
  }
});
router.put("/repair", async (req, res, next) => {
  try {
    let {
      RepairId,
      OrderType,
      PartId,
      MoldId,
      ProblemSource,
      ProblemId,
      Cause,
      IndexProgress,
      FixDetail,
    } = req.body;
    for (let [key, value] of Object.entries(req.body)) {
      if (key != "IndexProgress" && value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let SectionMoldPart = await pool.request()
      .query(`SELECT MoldName, MoldControlNo
        FROM [MasterMold] WHERE MoldId = ${MoldId};
      SELECT PartName, PartNo FROM [MasterPart]
        WHERE PartId = ${PartId};
      SELECT ProblemNo, Problem FROM [MasterProblem]
        WHERE ProblemId = ${ProblemId};`);
    if (!SectionMoldPart.recordsets[0].length)
      return next(createError(404, "Mold not found"));
    if (!SectionMoldPart.recordsets[1].length)
      return next(createError(404, "Part not found"));
    if (!SectionMoldPart.recordsets[2].length)
      return next(createError(404, "Problem not found"));
    let { MoldName, MoldControlNo } = SectionMoldPart.recordsets[0][0];
    let { PartName, PartNo } = SectionMoldPart.recordsets[1][0];
    let { ProblemNo, Problem } = SectionMoldPart.recordsets[2][0];
    let updateDaily = `UPDATE [RepairOrder]
        SET OrderType = ${OrderType},
          PartId = ${PartId},PartName = N'${PartName}',PartNo = N'${PartNo}',
          MoldId = ${MoldId},MoldName = N'${MoldName}',MoldControlNo = N'${MoldControlNo}',
          ProblemId = ${ProblemId},ProblemNo = N'${ProblemNo}',Problem = N'${Problem}',
          ProblemSource = N'${ProblemSource}',Cause = N'${Cause}'
        WHERE RepairId = ${RepairId};
      UPDATE [RepairProgress]
        SET FixDetail = N'${FixDetail}'
        WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress};`;
    await pool.request().query(updateDaily);
    res.status(200).send({ message: "Repair order Updated" });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
