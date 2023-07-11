const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbconfig = require('../../libs/dbconfig');
const createError = require('http-errors');

const { encrypt, decrypt } = require('../../libs/utils');
const { uploadUser } = require('../middleware/uploadFile');

router.get('/list/:Section', async (req, res, next) => {
  try {
    let { Section } = req.params;
    let pool = await sql.connect(dbconfig);
    let users;
    Section = Section.toUpperCase();
    if (Section == 'ALL') {
      users = await pool.request().query(`
      SELECT row_number() over(order by b.SectionNo, a.PositionId, UserId ) as 'index',
        UserId, UserNo, Fullname,Email, Username, Userpass,
        a.SectionId, b.Section, a.PositionId, c.Position,MgAltCheckOrder,MgAltApproveOrder,MgQaOrder
      FROM [User] a
      LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
      LEFT JOIN [MasterPosition] c on a.PositionId = c.PositionId
      WHERE NOT b.Section = N'DM' AND NOT b.Section = N'ADMIN' AND a.Active = 1`);
    } else {
      users = await pool.request().query(`
      SELECT row_number() over(order by b.SectionNo, a.PositionId, UserId ) as 'index',
      UserId, UserNo, Fullname,Email, Username, Userpass,
      a.SectionId, b.Section, a.PositionId, c.Position,MgAltCheckOrder,MgAltApproveOrder,MgQaOrder
      FROM [User] a
      LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
      LEFT JOIN [MasterPosition] c on a.PositionId = c.PositionId
      WHERE b.Section = N'${Section}' AND a.Active = 1`);
    }
    for (let user of users.recordset) {
      user.Userpass = decrypt(user.Userpass);
    }
    res.status(200).send(JSON.stringify(users.recordset));
  } catch (err) {
    next(err);
  }
});

router.post('/add/:Data', async (req, res, next) => {
  let Data = JSON.parse(req.params.Data);
  console.log(Data);
  let { SectionId, PositionId, Fullname, Email, Username, Userpass } = Data;
  for (let [key, value] of Object.entries(Data)) {
    if (value == '') {
      return next(createError(400, 'Please fill every field'));
    }
  }
  uploadUser(req, res, async (err) => {
    try {
      if (err) return next(err);
      let HashPass = encrypt(Userpass.toString());
      let pool = await sql.connect(dbconfig);
      let CheckUser = await pool.request().query(`
        SELECT UserId, Active
        FROM [User]
        WHERE Username = N'${Username}' OR Email = N'${Email}'
          OR Userpass = N'${HashPass}'`);
      let InsertImg1 = '',
        InsertImg2 = '',
        UpdateImg = '';
      if (req.file) {
        let ImgName = req.file.filename;
        InsertImg1 = ',UserImg';
        InsertImg2 = `,N'${ImgName}'`;
        UpdateImg = `, UserImg = ./img/user/${ImgName}`;
      }
      if (CheckUser.recordset.length) {
        let { UserId, Active } = CheckUser.recordset[0];
        if (Active)
          return next(
            createError(400, 'Duplicate Username or Email or Password')
          );
        let UpdateUser = `UPDATE [User]
            SET SectionId = ${SectionId}, PositionId = ${PositionId},
            Fullname = N'${Fullname}', Email = N'${Email}', Username = N'${Username}',
            Userpass = N'${HashPass}', Active = 1 ${UpdateImg}
          WHERE UserId = ${UserId}`;
        await pool.request().query(UpdateUser);
      } else {
        let user = await pool.request().query(`SELECT COUNT(UserId) Count
            FROM [User] WHERE SectionId = ${SectionId};
          SELECT Section FROM [MasterSection] WHERE SectionId = ${SectionId};`);
        let UserCount = user.recordsets[0][0].Count + 1;
        let UserNoTxt =
          UserCount < 10
            ? '00' + UserCount
            : UserCount < 100
            ? '0' + UserCount
            : UserCount;
        let UserNo = user.recordsets[1][0].Section + UserNoTxt;
        let InsertUser = `INSERT INTO [User](
          SectionId,PositionId,UserNo, Fullname, Email, Username, Userpass${InsertImg1})
          VALUES (${SectionId},${PositionId},N'${UserNo}',
            N'${Fullname}',N'${Email}',N'${Username}',N'${HashPass}'${InsertImg2})`;
        await pool.request().query(InsertUser);
      }
      res.status(201).send({ message: `User has been added` });
    } catch (err) {
      next(err);
    }
  });
});
router.put('/edit/:Data', async (req, res, next) => {
  let Data = JSON.parse(req.params.Data);
  console.log(Data);
  let { UserId, SectionId, PositionId, Fullname, Email, Username, Userpass } =
    Data;
  for (let [key, value] of Object.entries(Data)) {
    if (value == '') {
      return next(createError(400, 'Please fill every field'));
    }
  }
  uploadUser(req, res, async (err) => {
    try {
      if (err) return next(err);
      let HashPass = encrypt(Userpass.toString());
      let pool = await sql.connect(dbconfig);
      let CheckUser = await pool.request().query(`SELECT CASE
        WHEN EXISTS(
          SELECT *
          FROM [User]
          WHERE NOT UserId = ${UserId}
            AND (Username = N'${Username}' OR Email = N'${Email}'
            OR Userpass = N'${HashPass}')
        )
        THEN CAST (1 AS BIT)
        ELSE CAST (0 AS BIT) END AS 'check'`);
      if (CheckUser.recordset[0].check)
        return next(createError(400, 'Duplicate Username or Email'));
      if (req.file) {
        let ImgName = req.file.filename;
        let UpdateUser = `UPDATE [User]
          SET SectionId = ${SectionId}, PositionId = ${PositionId},
            Fullname = N'${Fullname}', Email = N'${Email}',
            Username = N'${Username}', Userpass = N'${HashPass}',
            UserImg = N'${ImgName}'
          WHERE UserId = ${UserId}`;
        await pool.request().query(UpdateUser);
      } else {
        let UpdateUser = `UPDATE [User]
          SET SectionId = ${SectionId}, PositionId = ${PositionId},
            Fullname = N'${Fullname}', Email = N'${Email}',
            Username = N'${Username}', Userpass = N'${HashPass}'
          WHERE UserId = ${UserId}`;
        await pool.request().query(UpdateUser);
      }
      res.status(200).send({ message: `User has been edited` });
    } catch (err) {
      next(err);
    }
  });
});

router.put('/altcheck', async (req, res, next) => {
  try {
    let { UserId, MgAltCheckOrder } = req.body;
    let pool = await sql.connect(dbconfig);
    let UpdateAltCheck = `UPDATE [User]
      SET MgAltCheckOrder = ${MgAltCheckOrder}
      WHERE UserId = ${UserId}`;
    await pool.request().query(UpdateAltCheck);
    res.status(200).send({ message: `User Permission has been updated` });
  } catch (err) {
    next(err);
  }
});
router.put('/altapprove', async (req, res, next) => {
  try {
    let { UserId, MgAltApproveOrder } = req.body;
    let pool = await sql.connect(dbconfig);
    let UpdateAltApprove = `UPDATE [User]
      SET MgAltApproveOrder = ${MgAltApproveOrder}
      WHERE UserId = ${UserId}`;
    await pool.request().query(UpdateAltApprove);
    res.status(200).send({ message: `User Permission has been updated` });
  } catch (err) {
    next(err);
  }
});
router.put('/altqa', async (req, res, next) => {
  try {
    let { UserId, MgQaOrder } = req.body;
    let pool = await sql.connect(dbconfig);
    let UpdateAltQa = `UPDATE [User]
      SET MgQaOrder = ${MgQaOrder}
      WHERE UserId = ${UserId}`;
    await pool.request().query(UpdateAltQa);
    res.status(200).send({ message: `User Permission has been updated` });
  } catch (err) {
    next(err);
  }
});
router.put('/permission', async (req, res, next) => {
  try {
    let {
      UserId,
      MgCreateOrder,
      DmReceiveOrder,
      DmCheckOrder,
      DmAltCheckOrder,
      DmApproveOrder,
      DmAltApproveOrder,
      QaOrder,
      DmFinishOrder,
      DmPerformance,
      DmReport,
      MasterMold,
      MasterProblem,
      MasterMfg,
      MasterDm,
      MasterPosition,
    } = req.body;
    let pool = await sql.connect(dbconfig);
    let UpdatePermission = `UPDATE UserPermission
      SET MgCreateOrder = ${MgCreateOrder},DmReceiveOrder = ${DmReceiveOrder},
        DmCheckOrder = ${DmCheckOrder},DmAltCheckOrder = ${DmAltCheckOrder},
        DmApproveOrder = ${DmApproveOrder},DmAltApproveOrder = ${DmAltApproveOrder},
        QaOrder = ${QaOrder},DmFinishOrder = ${DmFinishOrder},DmPerformance = ${DmPerformance},
        DmReport = ${DmReport},MasterMold = ${MasterMold},MasterProblem = ${MasterProblem},
        MasterMfg = ${MasterMfg},MasterDm = ${MasterDm},MasterPosition = ${MasterPosition},
      WHERE UserId = ${UserId}`;
    await pool.request().query(UpdatePermission);
    res.status(200).send({ message: `User Permission has been updated` });
  } catch (err) {
    next(err);
  }
});

router.delete('/del/:UserId', async (req, res, next) => {
  try {
    let { UserId } = req.params;
    if (UserId == 1) return next(createError(400, 'Can not delete admin'));
    let pool = await sql.connect(dbconfig);
    let DeleteUser = `
      UPDATE [User]
      SET Active = 0
      WHERE UserId = ${UserId}`;
    await pool.request().query(DeleteUser);
    res.status(200).send({ message: `User has been deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
