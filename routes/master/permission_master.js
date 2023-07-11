const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { isAuthEdit } = require("../middleware/checkUser");

router.get("/section", async (req, res, next) => {
  try {
    let SelectSection = `SELECT row_number() over(order by SectionNo) as 'index',
        SectionId,SectionNo, Section, SectionPass
      FROM MasterSection WHERE NOT Section = N'ADMIN' AND Active = 1 ORDER BY SectionNo`;
    let pool = await sql.connect(dbconfig);
    let Section = await pool.request().query(SelectSection);
    res.status(200).send(JSON.stringify(Section.recordset));
  } catch (err) {
    next(err);
  }
});
router.get("/position/:SectionId", async (req, res, next) => {
  try {
    let { SectionId } = req.params
    let SelectPosition = `SELECT row_number() over(order by PositionId) as 'index',
        PositionId, Position, MgCreateOrder, MgCheckOrder,
        MgApproveOrder, QaOrder, DmPerformance, DmReport,
        MasterMold, MasterProblem, MasterMfg, MasterDm, MasterPosition
      FROM MasterPosition
      WHERE SectionId = ${SectionId} AND Active = 1
      ORDER BY PositionId`;
    let pool = await sql.connect(dbconfig);
    let Position = await pool.request().query(SelectPosition);
    res.status(200).send(JSON.stringify(Position.recordset));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("MasterPosition"));

router.post("/section_add", async (req, res, next) => {
  try {
    let { SectionNo, Section, SectionPass } = req.body
    if (SectionNo == "" || Section == "" || SectionPass == "")
      return next(createError(400, "Please fill section data"));
    let pool = await sql.connect(dbconfig);
    Section = Section.toUpperCase()
    let CheckSection = await pool.request().query(`
      SELECT SectionId,SectionNo,Active
      FROM MasterSection
      WHERE Section = N'${Section}'`);
    if (CheckSection.recordset.length) {
      let { SectionId, Active } = CheckSection.recordset[0]
      if (Active) return next(createError(400, "Duplicate Section"));
      let InsertSection = `UPDATE MasterSection
        SET Active = 1 AND SectionPass = N'${SectionPass}' WHERE SectionId = ${SectionId}`;
      await pool.request().query(InsertSection);
    } else {
      let InsertSection = `INSERT INTO MasterSection(SectionNo,Section,SectionPass)
        VALUES (${SectionNo},N'${Section}',N'${SectionPass}')`;
      await pool.request().query(InsertSection);
    }
    res.status(201).send({ message: `Section has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/section_edit", async (req, res, next) => {
  try {
    let { SectionId, SectionNo, Section, SectionPass } = req.body
    if (SectionNo == "" || Section == "" || SectionPass == "") return next(createError(400, "Please fill section data"));
    let pool = await sql.connect(dbconfig);
    Section = Section.toUpperCase()
    let CheckSection = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterSection
        WHERE NOT SectionId = ${SectionId} AND Section = N'${Section}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckSection.recordset[0].check)
      return next(createError(400, "Duplicate Section"));
    let UpdateSection = `UPDATE MasterSection
      SET SectionNo = ${SectionNo},
      Section = N'${Section}', SectionPass = N'${SectionPass}'
      WHERE SectionId = ${SectionId}`;
    await pool.request().query(UpdateSection);
    res.status(200).send({ message: `Section has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/section_del/:SectionId", async (req, res, next) => {
  try {
    let { SectionId } = req.params;
    let pool = await sql.connect(dbconfig);
    let CheckUser = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM [User]
        WHERE SectionId = ${SectionId} AND Active = 1
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckUser.recordset[0].check)
      return next(createError(400, "Cannot delete, This section have users"));
    let DeleteSection = `
      UPDATE MasterPosition SET Active = 0 WHERE SectionId = ${SectionId};
      UPDATE MasterSection SET Active = 0 WHERE SectionId = ${SectionId};`;
    await pool.request().query(DeleteSection);
    res.status(200).send({ message: `Section has been deleted` });
  } catch (err) {
    next(err);
  }
});

router.post("/position_add", async (req, res, next) => {
  try {
    let { SectionId, Position, MgCreateOrder, MgCheckOrder } = req.body
    let { MgApproveOrder, DmPerformance } = req.body
    let { DmReport, MasterMold, MasterProblem, MasterMfg, MasterDm, MasterPosition } = req.body
    if (Position == "") return next(createError(400, "Please fill Position name"));
    let pool = await sql.connect(dbconfig);
    Position = Position.toUpperCase()
    let CheckPosition = await pool.request().query(`
      SELECT PositionId,Active
      FROM MasterPosition
      WHERE SectionId = ${SectionId} AND Position = N'${Position}'`);
    if (CheckPosition.recordset.length) {
      let { PositionId, Active } = CheckPosition.recordset[0]
      if (Active) return next(createError(400, "Duplicate Position"));
      let UpdatePosition = `UPDATE MasterPosition
        SET Position = N'${Position}', MgCreateOrder = ${MgCreateOrder || 0},
        MgCheckOrder = ${MgCheckOrder || 0}, MgApproveOrder = ${MgApproveOrder || 0},
        DmPerformance = ${DmPerformance || 0}, DmReport = ${DmReport || 0},
        MasterMold = ${MasterMold || 0}, MasterProblem = ${MasterProblem || 0},
        MasterMfg = ${MasterMfg || 0}, MasterDm = ${MasterDm || 0},
        MasterPosition = ${MasterPosition || 0}, Active = 1
        WHERE PositionId = ${PositionId}`;
      await pool.request().query(UpdatePosition);
    } else {
      let InsertPosition = `INSERT INTO MasterPosition(
        SectionId,Position, MgCreateOrder, MgCheckOrder,
        MgApproveOrder, DmPerformance,
        DmReport, MasterMold,MasterProblem, MasterMfg, MasterDm, MasterPosition
      )
      VALUES (${SectionId},N'${Position}',${MgCreateOrder || 0},${MgCheckOrder || 0},
        ${MgApproveOrder || 0},${DmPerformance || 0},
        ${DmReport || 0},${MasterMold || 0},${MasterProblem || 0},
        ${MasterMfg || 0},${MasterDm || 0},${MasterPosition || 0})`;
      await pool.request().query(InsertPosition);
    }
    res.status(201).send({ message: `Position has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/position_edit", async (req, res, next) => {
  try {
    let { SectionId, PositionId, Position, MgCreateOrder, MgCheckOrder } = req.body
    let { MgApproveOrder, DmPerformance } = req.body
    let { DmReport, MasterMold, MasterProblem, MasterMfg, MasterDm, MasterPosition } = req.body
    console.log(req.body)
    if (Position == "") return next(createError(400, "Please fill Position name"));
    let pool = await sql.connect(dbconfig);
    Position = Position.toUpperCase()
    let CheckPosition = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterPosition
        WHERE SectionId = ${SectionId} AND NOT PositionId = ${PositionId}
          AND Position = N'${Position}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckPosition.recordset[0].check)
      return next(createError(400, "Duplicate Position"));
    let UpdatePosition = `UPDATE MasterPosition
      SET Position = N'${Position}', MgCreateOrder = ${MgCreateOrder || 0},
      MgCheckOrder = ${MgCheckOrder || 0}, MgApproveOrder = ${MgApproveOrder || 0},
      DmPerformance = ${DmPerformance || 0}, DmReport = ${DmReport || 0},
      MasterMold = ${MasterMold || 0}, MasterProblem = ${MasterProblem || 0},
      MasterMfg = ${MasterMfg || 0}, MasterDm = ${MasterDm || 0},
      MasterPosition = ${MasterPosition || 0}, Active = 1
      WHERE PositionId = ${PositionId}`;
    await pool.request().query(UpdatePosition);
    res.status(200).send({ message: `Position has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/position_del/:PositionId", async (req, res, next) => {
  try {
    let { PositionId } = req.params;
    let pool = await sql.connect(dbconfig);
    let CheckUser = await pool.request().query(`SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM [User]
        WHERE PositionId = ${PositionId} AND Active = 1
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`);
    if (CheckUser.recordset[0].check)
      return next(createError(400, "Cannot delete, This Position have users"));
    let DeletePosition = `
      UPDATE [MasterPosition] SET Active = 0 WHERE PositionId = ${PositionId};`;
    await pool.request().query(DeletePosition);
    res.status(200).send({ message: `Position has been deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
