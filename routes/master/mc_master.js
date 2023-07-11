const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { isAuthEdit } = require("../middleware/checkUser");

router.get("/list", async (req, res, next) => {
  try {
    let SelectMc = `SELECT row_number() over(order by McId) as 'index',
        McId, McSection, McName
      FROM MasterMc
      ORDER BY McId`;
    let pool = await sql.connect(dbconfig);
    let Mc = await pool.request().query(SelectMc);
    res.status(200).send(JSON.stringify(Mc.recordset));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("MasterMold"));

router.post("/add", async (req, res, next) => {
  try {
    let { McSection, McName } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckMc = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterMc
        WHERE McSection = N'${McSection}' AND McName = N'${McName}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckMc.recordset[0].check)
      return next(createError(400, "Duplicate Mc"));
    let InsertDie = `INSERT INTO MasterMc(McSection, McName)
      VALUES  (N'${McSection}', N'${McName}')`;
    await pool.request().query(InsertDie);
    res.status(201).send({ message: `Mc has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/edit", async (req, res, next) => {
  try {
    let { McId, McSection, McName } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckMc = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterMc
        WHERE NOT McId = ${McId}
          AND (McSection = N'${McSection}' AND McName = N'${McName}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckMc.recordset[0].check)
      return next(createError(400, "Duplicate Mc"));
    let UpdateMc = `UPDATE MasterMc
      SET
      McSection = N'${McSection}', McName = N'${McName}'
      WHERE McId = ${McId}`;
    await pool.request().query(UpdateMc);
    res.status(200).send({ message: `Mc has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/delete/:McId", async (req, res, next) => {
  try {
    let { McId } = req.params;
    let pool = await sql.connect(dbconfig);
    let DeleteMc = `
      DELETE FROM [MasterMoldMc] WHERE McId = ${McId};
      DELETE FROM [MasterMc] WHERE McId = ${McId};`;
    await pool.request().query(DeleteMc);
    res.status(200).send({ message: `Mc has been deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
