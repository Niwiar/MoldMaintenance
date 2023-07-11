const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");

const { encrypt, decrypt } = require("../libs/utils");

router.post("/login_mfg", async (req, res, next) => {
  try {
    let { Section, SectionPass } = req.body;
    let pool = await sql.connect(dbconfig);
    // let HashPass = encrypt(Userpass);
    let login = await pool.request().query(`SELECT SectionId
        FROM [MasterSection]
        WHERE Section = N'${Section}' AND SectionPass = N'${SectionPass}' AND Active = 1`);
    if (login.recordset.length) {
      let { SectionId } = login.recordset[0];

      req.session.isLoggedIn = true;
      req.session.SectionId = SectionId;
      req.session.Section = Section;
      res.redirect("/");
    } else {
      let section = await pool.request().query(`SELECT * FROM [MasterSection]
        WHERE Section = N'${Section}'`);
      if (section.recordset.length) {
        let { Active } = section.recordset[0]
        if (Active) req.flash("sectionlogin", "Invalid Password")
        else req.flash("sectionlogin", "Section is not Activate")
      } else {
        req.flash("sectionlogin", "Invalid Section");
      }
      res.redirect("/login");
    }
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    let { Username, Userpass } = req.body;
    let pool = await sql.connect(dbconfig);
    let HashPass = encrypt(Userpass);
    let login = await pool.request().query(`SELECT *
        FROM [User]
        WHERE Username = N'${Username}' AND Userpass = N'${HashPass}' AND Active = 1`);
    if (login.recordset.length) {
      let { UserId, PositionId } = login.recordset[0];
      let auth = await pool.request().query(`SELECT * FROM [MasterPosition]
        WHERE PositionId = ${PositionId}`);
      req.session.isLoggedIn = true;
      req.session.UserId = UserId;
      req.session.Auth = auth.recordset[0];
      res.redirect("/");
    } else {
      let user = await pool.request().query(`SELECT * FROM [User]
        WHERE Username = N'${Username}'`);
      if (user.recordset.length) {
        let { Active } = user.recordset[0]
        if (Active) req.flash("login", "Invalid Password")
        else req.flash("login", "User is not Activate")
      } else {
        req.flash("login", "Invalid Username");
      }
      res.redirect("/login");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/logout", (req, res, next) => {
  req.session = null;
  req.isAuth = false;
  res.redirect("/login");
});

router.post('/check', async (req, res, next) => {
  try {
    let { Userpass, Action } = req.body
    let pool = await sql.connect(dbconfig);
    let HashPass = encrypt(Userpass);
    let sign = await pool.request().query(`SELECT a.UserId, a.SectionId, b.Section,
        a.PositionId,c.Position,a.Fullname, a.Email, a.Username, c.MgCreateOrder
      FROM [User] a
      LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
      LEFT JOIN [MasterPosition] c on a.PositionId = c.PositionId
      WHERE Userpass = N'${HashPass}' AND a.Active = 1`);
    if (!sign.recordset.length) return next(createError(403, 'Invalid Password'))
    let { Fullname, MgCreateOrder } = sign.recordset[0]
    if (Action == 'request' && !MgCreateOrder) return next(createError(403, `${Fullname} do not have permission to request maintenance order`))
    res.status(200).send(sign.recordset[0]);
  } catch (err) {
    next(err)
  }
})

router.get('/profile', async (req, res, next) => {
  try {
    if (req.session.UserId) {
      let { UserId } = req.session;
      let pool = await sql.connect(dbconfig);
      let user = await pool.request().query(`SELECT
          a.Username, b.Position, c.Section, b.MgCreateOrder,
          b.MgCheckOrder, b.MgApproveOrder, b.QaOrder,
          b.DmPerformance, b.DmReport, b.MasterMold,
          b.MasterProblem, b.MasterMfg, b.MasterDm, b.MasterPosition
        FROM [User] a
        LEFT JOIN [MasterPosition] b on a.PositionId = b.PositionId
        LEFT JOIN [MasterSection] c on a.SectionId = c.SectionId
        WHERE UserId = ${UserId}`);
      res.status(200).send(user.recordset[0]);
    } else if (req.session.Section) {
      res.status(200).send({ Username: req.session.Section });
    } else {
      res.status(200).send({ Username: 'guest' });
    }
  } catch (err) {
    next(err);
  }
})

router.get("/detail/:UserId", async (req, res, next) => {
  try {
    let { UserId } = req.params;
    let pool = await sql.connect(dbconfig);
    let user = await pool.request().query(`SELECT
        Username, Password, Position FROM [User]
      WHERE UserId = ${UserId}`);
    user.recordset[0].Password = decrypt(user.recordset[0].Password);
    res.status(200).send(JSON.stringify(user.recordset[0]));
  } catch (err) {
    next(err);
  }
});
router.get("/permission/:UserId", async (req, res, next) => {
  try {
    let { UserId } = req.params;
    let pool = await sql.connect(dbconfig);
    let Permission = await pool.request().query(`SELECT * FROM [UserAccess]
      WHERE UserId = ${UserId}`);
    res.status(200).send(JSON.stringify(Permission.recordset[0]));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
