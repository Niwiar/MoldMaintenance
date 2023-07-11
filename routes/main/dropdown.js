const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");

router.get("/section/:Section", async (req, res, next) => {
  try {
    let { Section } = req.params
    Section.toUpperCase()
    let pool = await sql.connect(dbconfig);
    if (Section == 'ALL') {
      let Sections = await pool.request().query(`
        SELECT * FROM [MasterSection] WHERE Active = 1 AND NOT Section = N'DM'`);
      res.status(200).send(Sections.recordset);
    } else {
      let Sections = await pool.request().query(`
        SELECT * FROM [MasterSection] WHERE Active = 1 AND Section = N'${Section}'`);
      res.status(200).send(Sections.recordset);
    }

  } catch (err) {
    next(err)
  }
});
router.get("/position/:SectionId", async (req, res, next) => {
  try {
    let { SectionId } = req.params
    let pool = await sql.connect(dbconfig);
    let Position = await pool.request().query(`
      SELECT * FROM [MasterPosition]
      WHERE SectionId = ${SectionId} AND Active = 1`);
    res.status(200).send(Position.recordset);
  } catch (err) {
    next(err)
  }
});
router.get("/user/:Section", async (req, res, next) => {
  try {
    let { Section } = req.params
    let pool = await sql.connect(dbconfig);
    let User = await pool.request().query(`
      SELECT UserId,Fullname,Username
      FROM [User] a
      INNER JOIN [MasterSection] b on a.SectionId = b.SectionId
      WHERE b.Section = N'${Section}' AND b.Active = 1`);
    res.status(200).send(User.recordset);
  } catch (err) {
    next(err)
  }
});

router.get("/mold", async (req, res, next) => {
  try {
    let pool = await sql.connect(dbconfig);
    let Molds = await pool.request().query(`SELECT * FROM [MasterMold]`);
    res.status(200).send(Molds.recordset);
  } catch (err) {
    next(err)
  }

});
router.get('/mold_detail/:MoldId', async (req, res, next) => {
  try {
    let { MoldId } = req.params
    let pool = await sql.connect(dbconfig);
    let Mold = await pool.request().query(`
      SELECT * FROM [MasterMold]
      WHERE MoldId = ${MoldId}`);
    res.status(200).send(Mold.recordset[0]);
  } catch (err) {
    next(err)
  }

})
router.get('/part/:MoldId', async (req, res, next) => {
  try {
    let { MoldId } = req.params
    let pool = await sql.connect(dbconfig);
    let Parts = await pool.request().query(`
      SELECT a.PartId, b.PartName, b.PartNo FROM [MasterMoldPart] a
      LEFT JOIN [MasterPart] b on a.PartId = b.PartId
      WHERE a.MoldId = ${MoldId}`);
    res.status(200).send(Parts.recordset);
  } catch (err) {
    next(err)
  }
})
router.get('/part_detail/:PartId', async (req, res, next) => {
  try {
    let { PartId } = req.params
    let pool = await sql.connect(dbconfig);
    let Part = await pool.request().query(`
      SELECT * FROM [MasterPart]
      WHERE PartId = ${PartId}`);
    res.status(200).send(Part.recordset[0]);
  } catch (err) {
    next(err)
  }
})
router.get('/mc/:MoldId', async (req, res, next) => {
  try {
    let { MoldId } = req.params
    let pool = await sql.connect(dbconfig);
    let Mcs = await pool.request().query(`
      SELECT a.McId, b.McName FROM [MasterMoldMc] a
      LEFT JOIN [MasterMc] b on a.McId = b.McId
      WHERE a.MoldId = ${MoldId}`);
    res.status(200).send(Mcs.recordset);
  } catch (err) {
    next(err)
  }
})
router.get("/mold_section/:Section", async (req, res, next) => {
  try {
    let { Section } = req.params
    let pool = await sql.connect(dbconfig);
    let Molds = await pool.request().query(`SELECT MoldId, MoldName, MoldControlNo
      FROM [MasterMold] WHERE MoldSection = N'${Section}'`);
    res.status(200).send(Molds.recordset);
  } catch (err) {
    next(err)
  }

});
router.get('/part_section/:Section', async (req, res, next) => {
  try {
    let { Section } = req.params
    let pool = await sql.connect(dbconfig);
    let Parts = await pool.request().query(`
      SELECT PartId, PartName, PartNo FROM [MasterPart] 
      WHERE PartSection = N'${Section}'`);
    res.status(200).send(Parts.recordset);
  } catch (err) {
    next(err)
  }
})
router.get('/mc_section/:Section', async (req, res, next) => {
  try {
    let { Section } = req.params
    let pool = await sql.connect(dbconfig);
    let Mcs = await pool.request().query(`
      SELECT McId, McName FROM [MasterMc] 
      WHERE McSection = N'${Section}'`);
    res.status(200).send(Mcs.recordset);
  } catch (err) {
    next(err)
  }
})
router.get('/problem', async (req, res, next) => {
  try {
    let pool = await sql.connect(dbconfig);
    let Problem = await pool.request().query(`
      SELECT ProblemId, ProblemNo, Problem FROM [MasterProblem]
      WHERE ProblemActive = 1
      ORDER BY ProblemType, ProblemId`);
    res.status(200).send(Problem.recordset);
  } catch (err) {
    next(err)
  }
})

module.exports = router;
