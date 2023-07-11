const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const fs = require('fs')
const path = require('path')
const XlsxPopulate = require("xlsx-populate");
const { uploadMaster } = require("../middleware/uploadFile");
const { getdate } = require("../../libs/datetime");
const { fillMoldTemplate, fillPartTemplate, writeBackup, fillMcTemplate } = require("../middleware/exportMaster");
const { isAuthEdit } = require("../middleware/checkUser");

const FieldLimit = { MasterMold: 10, MasterPart: 3, MasterMc: 2, }

const transformRow = (pool, Table, row) => new Promise(async (resolve, reject) => {
  let result;
  if (Table == 'MasterMold') result = await insertMold(pool, row)
  else if (Table == 'MasterPart') result = await insertPart(pool, row)
  else if (Table == 'MasterMc') result = await insertMc(pool, row)
  resolve(result)
})
const insertMold = (pool, row) => new Promise(async (resolve, reject) => {
  if (typeof row[1] == 'object') row[1] = row[1].text().replaceAll("'", "") || '';
  if (typeof row[2] == 'object') row[2] = row[2].text().replaceAll("'", "") || '';
  let checkDup = await pool.request().query(`SELECT MoldId FROM [MasterMold]
    WHERE MoldControlNo = N'${row[2]}'`)
  if (checkDup.recordset.length) {
    let { MoldId } = checkDup.recordset[0]
    await pool.request().query(`UPDATE [MasterMold]
      SET MoldSection = N'${row[0]}',MoldName = N'${row[1]}',MoldControlNo = N'${row[2]}',MoldCavity = N'${row[3]}',
      CleaningPlan = N'${row[4] || 0}',PreventivePlan = N'${row[5] || 0}',LifeShot = N'${row[6] || 0}',OtherPlan = N'${row[7] || 0}',
      WarnPercent = ${row[8] || 0}, DangerPercent = ${row[9] || 0}
      WHERE MoldId = ${MoldId}`)
    return resolve('dup')
  }
  await pool.request().query(`INSERT INTO [MasterMold](MoldSection,MoldName,MoldControlNo,
      MoldCavity,CleaningPlan,PreventivePlan,LifeShot,OtherPlan,WarnPercent,DangerPercent)
    VALUES(N'${row[0]}',N'${row[1]}',N'${row[2]}',
      ${row[3] || 0},${row[4] || 0},${row[5] || 0},${row[6] || 0},${row[7] || 0},${row[8] || 0},${row[9] || 0})`)
  resolve('insert')
})
const insertPart = (pool, row) => new Promise(async (resolve, reject) => {
  if (typeof row[1] == 'object') row[1] = row[1].text().replaceAll("'", "") || '';
  if (typeof row[2] == 'object') row[2] = row[2].text().replaceAll("'", "") || '';
  let checkDup = await pool.request().query(`SELECT PartId FROM [MasterPart]
    WHERE PartNo = N'${row[2]}'`)
  if (checkDup.recordset.length) return resolve('dup')
  await pool.request().query(`INSERT INTO [MasterPart](PartSection,PartName,PartNo)
    VALUES(N'${row[0]}',N'${row[1]}',N'${row[2]}')`)
  resolve('insert')
})
const insertMc = (pool, row) => new Promise(async (resolve, reject) => {
  if (typeof row[1] == 'object') row[1] = row[1].text().replaceAll("'", "") || '';
  let checkDup = await pool.request().query(`SELECT McId FROM [MasterMc]
    WHERE McName = N'${row[1]}'`)
  if (checkDup.recordset.length) return resolve('dup')
  await pool.request().query(`INSERT INTO [MasterMc](McSection,McName)
    VALUES(N'${row[0]}',N'${row[1]}')`)
  resolve('insert')
})

router.get('/download/:Table', async (req, res, next) => {
  try {
    let { Table } = req.params
    let pool = await sql.connect(dbconfig);
    let date = getdate().replaceAll('-', '')
    let filename = `${Table}-${date}.xlsx`
    if (Table == 'MasterMold') {
      let Molds = await pool.request().query(`SELECT MoldSection, MoldName, MoldControlNo, MoldCavity,
          CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent, DangerPercent
        FROM [MasterMold] ORDER BY MoldSection,MoldControlNo`);
      const wb = await XlsxPopulate.fromFileAsync("./public/backup/template/mold_template.xlsx");
      const ws = wb.sheet(0);
      await fillMoldTemplate(ws, Molds.recordset);
      await writeBackup(wb, filename);
    } else if (Table == 'MasterPart') {
      let Parts = await pool.request().query(`SELECT PartSection, PartName, PartNo
        FROM [MasterPart] ORDER BY PartSection,PartNo`);
      const wb = await XlsxPopulate.fromFileAsync("./public/backup/template/part_template.xlsx");
      const ws = wb.sheet(0);
      await fillPartTemplate(ws, Parts.recordset);
      await writeBackup(wb, filename);
    } else if (Table == 'MasterMc') {
      let Mcs = await pool.request().query(`SELECT McSection, McName
        FROM [MasterMc] ORDER BY McSection,McName`);
      const wb = await XlsxPopulate.fromFileAsync("./public/backup/template/mc_template.xlsx");
      const ws = wb.sheet(0);
      await fillMcTemplate(ws, Mcs.recordset);
      await writeBackup(wb, filename);
    } else return next(createError(400, 'Invalid Table'))
    res.status(200).download(path.join(process.cwd(), `/public/backup/${filename}`));

  } catch (err) {
    next(err)
  }
})

router.use(isAuthEdit("MasterMold"));

router.post("/:Table", async (req, res, next) => {
  let excelFile = await uploadMaster(req, res)
  try {
    let { Table } = req.params
    let workbook = await XlsxPopulate.fromFileAsync(excelFile)
    let rows = workbook.sheet(0).usedRange().value();
    let insertArr = new Array;
    let pool = await sql.connect(dbconfig);
    for (let index = 0; index < rows.length; index++) {
      // console.log(rows[index])
      if (rows[index].length != FieldLimit[Table]) return next(createError(400, 'Invalid Form'))
      if (!index) continue;
      insertArr.push(transformRow(pool, Table, rows[index]))
    }
    if (!insertArr.length) return next(createError(400, 'No data in uploaded file'))
    let Data = await Promise.all(insertArr)
    console.log(Data)
    res.status(200).send({ message: `Import to ${Table} Success` })
  } catch (err) {
    fs.unlinkSync(excelFile)
    next(err)
  }
})



module.exports = router;
