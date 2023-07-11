const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { isAuthEdit } = require("../middleware/checkUser");

router.get("/list", async (req, res, next) => {
  try {
    let SelectPart = `SELECT row_number() over(order by PartId) as 'index',
        PartId, PartSection, PartNo, PartName
      FROM MasterPart
      ORDER BY PartId`;
    let pool = await sql.connect(dbconfig);
    let Part = await pool.request().query(SelectPart);
    res.status(200).send(JSON.stringify(Part.recordset));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("MasterMold"));

router.post("/add", async (req, res, next) => {
  try {
    let { PartSection, PartNo, PartName } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckPart = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterPart
        WHERE PartNo = N'${PartNo}' OR PartName = N'${PartName}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckPart.recordset[0].check)
      return next(createError(400, "Duplicate Part name or PartNo"));
    let InsertDie = `INSERT INTO MasterPart(PartSection, PartNo, PartName)
      VALUES  (N'${PartSection}',N'${PartNo}', N'${PartName}')`;
    await pool.request().query(InsertDie);
    res.status(201).send({ message: `Part has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/edit", async (req, res, next) => {
  try {
    let { PartId, PartSection, PartNo, PartName } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckPart = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterPart
        WHERE NOT PartId = ${PartId}
          AND (PartNo = N'${PartNo}' OR PartName = N'${PartName}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckPart.recordset[0].check)
      return next(createError(400, "Duplicate Part name or PartNo"));
    let UpdatePart = `UPDATE MasterPart
      SET PartSection = N'${PartSection}',
      PartNo = N'${PartNo}', PartName = N'${PartName}'
      WHERE PartId = ${PartId}`;
    await pool.request().query(UpdatePart);
    res.status(200).send({ message: `Part has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/delete/:PartId", async (req, res, next) => {
  try {
    let { PartId } = req.params;
    let pool = await sql.connect(dbconfig);
    let DeletePart = `
      DELETE FROM [MasterMoldPart] WHERE PartId = ${PartId};
      DELETE FROM [MasterPart] WHERE PartId = ${PartId};`;
    await pool.request().query(DeletePart);
    res.status(200).send({ message: `Part has been deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
