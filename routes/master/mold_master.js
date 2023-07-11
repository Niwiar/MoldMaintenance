const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { isAuthEdit } = require("../middleware/checkUser");

router.get("/list", async (req, res, next) => {
  try {
    let SelectMold = `SELECT row_number() over(order by MoldId) as 'index',
        MoldId, MoldSection, MoldName, MoldControlNo, MoldCavity,
        CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent, DangerPercent
      FROM MasterMold
      ORDER BY MoldId`;
    let pool = await sql.connect(dbconfig);
    let Mold = await pool.request().query(SelectMold);
    res.status(200).send(JSON.stringify(Mold.recordset));
  } catch (err) {
    next(err);
  }
});
router.get("/data_part/:MoldId", async (req, res, next) => {
  try {
    let { MoldId } = req.params
    let SelectMoldPart = `SELECT row_number() over(order by MoldPartId) as 'index',
        a.MoldPartId, b.PartName
      FROM MasterMoldPart a
      LEFT JOIN MasterPart b on a.PartId = b.PartId
      WHERE MoldId = ${MoldId}
      ORDER BY MoldPartId`;
    let pool = await sql.connect(dbconfig);
    let MoldPart = await pool.request().query(SelectMoldPart);
    res.status(200).send(JSON.stringify(MoldPart.recordset));
  } catch (err) {
    next(err);
  }
});
router.get("/data_mc/:MoldId", async (req, res, next) => {
  try {
    let { MoldId } = req.params
    let SelectMoldMc = `SELECT row_number() over(order by MoldMcId) as 'index',
        a.MoldMcId, b.McName
      FROM MasterMoldMc a
      LEFT JOIN MasterMc b on a.McId = b.McId
      WHERE MoldId = ${MoldId}
      ORDER BY MoldMcId`;
    let pool = await sql.connect(dbconfig);
    let MoldMc = await pool.request().query(SelectMoldMc);
    res.status(200).send(JSON.stringify(MoldMc.recordset));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("MasterMold"));

router.post("/add", async (req, res, next) => {
  try {
    let { MoldSection, MoldName, MoldControlNo, MoldCavity,
      CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent, DangerPercent } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (key != 'OtherPlan' && value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckMold = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterMold
        WHERE MoldControlNo = N'${MoldControlNo}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckMold.recordset[0].check)
      return next(createError(400, "Duplicate Mold name or Mold Control No"));
    let InsertDie = `INSERT INTO MasterMold(
        MoldSection, MoldName, MoldControlNo, MoldCavity, CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent, DangerPercent)
      VALUES (
        N'${MoldSection}', N'${MoldName}', N'${MoldControlNo}', ${MoldCavity},
        ${CleaningPlan}, ${PreventivePlan}, ${LifeShot}, ${OtherPlan}, ${WarnPercent}, ${DangerPercent})`;
    await pool.request().query(InsertDie);
    res.status(201).send({ message: `Mold has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/edit", async (req, res, next) => {
  try {
    let { MoldId, MoldSection, MoldName, MoldControlNo, MoldCavity,
      CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent, DangerPercent } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (key != 'OtherPlan' && value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckMold = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterMold
        WHERE NOT MoldId = ${MoldId} AND MoldControlNo = N'${MoldControlNo}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckMold.recordset[0].check)
      return next(createError(400, "Duplicate Mold name or MoldNo"));
    let UpdateMold = `UPDATE MasterMold
      SET MoldSection = N'${MoldSection}', MoldControlNo = N'${MoldControlNo}',
      MoldName = N'${MoldName}', MoldCavity = ${MoldCavity},
      CleaningPlan = ${CleaningPlan}, PreventivePlan = ${PreventivePlan},
      LifeShot = ${LifeShot}, OtherPlan = ${OtherPlan},
      WarnPercent = ${WarnPercent}, DangerPercent = ${DangerPercent}
      WHERE MoldId = ${MoldId}`;
    await pool.request().query(UpdateMold);
    res.status(200).send({ message: `Mold has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/delete/:MoldId", async (req, res, next) => {
  try {
    let { MoldId } = req.params;
    let pool = await sql.connect(dbconfig);
    let DeleteMold = `
      DELETE FROM [MasterMoldPart] WHERE MoldId = ${MoldId};
      DELETE FROM [MasterMoldMc] WHERE MoldId = ${MoldId};
      DELETE FROM [MasterMold] WHERE MoldId = ${MoldId};`;
    await pool.request().query(DeleteMold);
    res.status(200).send({ message: `Mold has been deleted` });
  } catch (err) {
    next(err);
  }
});

router.post('/add_part', async (req, res, next) => {
  try {
    let { MoldId, PartId } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckMold = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterMoldPart
        WHERE MoldId = ${MoldId} AND PartId = ${PartId}
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckMold.recordset[0].check)
      return next(createError(400, "Duplicate Part"));
    let InsertMoldPart = `INSERT INTO MasterMoldPart(
      MoldId, PartId)
      VALUES (
        ${MoldId}, ${PartId})`;
    await pool.request().query(InsertMoldPart);
    res.status(201).send({ message: `Part has been added to Mold` });
  } catch (err) {
    next(err);
  }
})
router.post('/add_mc', async (req, res, next) => {
  try {
    let { MoldId, McId } = req.body
    for (let [key, value] of Object.entries(req.body)) {
      if (value == "") {
        return next(createError(400, "Please fill every field"));
      }
    }
    let pool = await sql.connect(dbconfig);
    let CheckMold = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterMoldMc
        WHERE MoldId = ${MoldId} AND McId = ${McId}
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckMold.recordset[0].check)
      return next(createError(400, "Duplicate Mc"));
    let InsertMoldMc = `INSERT INTO MasterMoldMc(
      MoldId, McId)
      VALUES (
        ${MoldId}, ${McId})`;
    await pool.request().query(InsertMoldMc);
    res.status(201).send({ message: `Mc has been added to Mold` });
  } catch (err) {
    next(err);
  }
})
router.post('/delete_part/:MoldPartId', async (req, res, next) => {
  try {
    let { MoldPartId } = req.params;
    let pool = await sql.connect(dbconfig);
    let DeleteMold = `
      DELETE FROM [MasterMoldPart] WHERE MoldPartId = ${MoldPartId}`;
    await pool.request().query(DeleteMold);
    res.status(200).send({ message: `Part has been deleted from Mold` });
  } catch (err) {
    next(err);
  }
})
router.post('/delete_mc/:MoldMcId', async (req, res, next) => {
  try {
    let { MoldMcId } = req.params;
    let pool = await sql.connect(dbconfig);
    let DeleteMold = `
      DELETE FROM [MasterMoldMc] WHERE MoldMcId = ${MoldMcId}`;
    await pool.request().query(DeleteMold);
    res.status(200).send({ message: `Mc has been deleted from Mold` });
  } catch (err) {
    next(err);
  }
})
module.exports = router;
