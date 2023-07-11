const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const path = require('path')
const XlsxPopulate = require("xlsx-populate");
const { getweek } = require("../../libs/datetime");
const { showPerformance } = require("../../controller/performanceController");
const { isAuthEdit } = require("../middleware/checkUser");
const { writeReport, fillPerformanceReport } = require("../middleware/exportReport");

router.get("/tech/:Filter", async (req, res, next) => {
  try {
    // Filter = { PerformType, FromDate, ToDate, Tech}
    let Filter = JSON.parse(req.params.Filter)
    // PerformType: 1 Daily / 2 Weekly / 3 Custom
    let Series = await showPerformance(Filter)
    res.status(200).send(Series);
  } catch (err) {
    next(err);
  }
});
// router.use(isAuthEdit("DmPerformance"));
router.get("/tech_report/:Filter", async (req, res, next) => {
  try {
    // Filter = { PerformType, FromDate, ToDate, Tech}
    let Filter = JSON.parse(req.params.Filter)
    // PerformType: 1 Daily / 2 Weekly / 3 Custom
    let Series = await showPerformance(Filter)
    const wb = await XlsxPopulate.fromFileAsync(
      "./public/report/template/performance_template.xlsx"
    );
    const ws = wb.sheet(0);
    await fillPerformanceReport(ws, Series, Filter);
    await writeReport(wb, "Performance_Report.xlsx");
    res
      .status(200)
      .download(path.join(process.cwd(), `/public/report/Performance_Report.xlsx`));
  } catch (err) {
    next(err);
  }
});

module.exports = router;