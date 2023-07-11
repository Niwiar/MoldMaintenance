const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { isAuthEdit } = require("../middleware/checkUser");

router.get("/list/:ProblemType", async (req, res, next) => {
  try {
    let { ProblemType } = req.params
    let SelectProblem = `SELECT ProblemId, ProblemNo, Problem
      FROM MasterProblem
      WHERE ProblemType = ${ProblemType} AND ProblemActive = 1
      ORDER BY ProblemNo`;
    let pool = await sql.connect(dbconfig);
    let Problem = await pool.request().query(SelectProblem);
    res.status(200).send(JSON.stringify(Problem.recordset));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("MasterProblem"));

router.post("/add", async (req, res, next) => {
  try {
    let { ProblemType, ProblemNo, Problem } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckProblem = await pool.request().query(`
      SELECT ProblemActive,ProblemId
      FROM MasterProblem
      WHERE Problem = N'${Problem}' OR ProblemNo = '${ProblemNo}'`);
    if (CheckProblem.recordset.length) {
      let { ProblemId, ProblemActive } = CheckProblem.recordset[0]
      if (ProblemActive) return next(createError(400, "Duplicate Problem"));
      let ActiveProblem = `UPDATE MasterProblem
        SET ProblemActive = 1 WHERE ProblemId = ${ProblemId}`;
      await pool.request().query(ActiveProblem);
    } else {
      let InsertDie = `INSERT INTO MasterProblem(ProblemType,ProblemNo, Problem)
        VALUES  (${ProblemType},N'${ProblemNo}', N'${Problem}')`;
      await pool.request().query(InsertDie);
    }

    res.status(201).send({ message: `Problem has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/edit", async (req, res, next) => {
  try {
    let { ProblemId, ProblemNo, Problem } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckProblem = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterProblem
        WHERE NOT ProblemId = ${ProblemId}
          AND (Problem = N'${Problem}' OR ProblemNo = '${ProblemNo}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckProblem.recordset[0].check)
      return next(createError(400, "Duplicate Problem"));
    let UpdateProblem = `UPDATE MasterProblem
      SET
      ProblemNo = '${ProblemNo}', Problem = N'${Problem}'
      WHERE ProblemId = ${ProblemId}`;
    await pool.request().query(UpdateProblem);
    res.status(200).send({ message: `Problem has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/delete/:ProblemId", async (req, res, next) => {
  try {
    let { ProblemId } = req.params;
    let pool = await sql.connect(dbconfig);
    let DeleteProblem = `
      UPDATE MasterProblem
        SET ProblemActive = 0
        WHERE ProblemId = ${ProblemId}`;
    await pool.request().query(DeleteProblem);
    res.status(200).send({ message: `Problem has been deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
