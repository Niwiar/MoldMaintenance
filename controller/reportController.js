const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");
const { getdate, gettime, mindiff } = require("../libs/datetime");

const OrderTypeText = ['', 'Corrective', 'Repair', 'Cleaning', 'Preventive', 'Other']

exports.getDocNo = async (DocName) => {
  let pool = await sql.connect(dbconfig);
  let selectDoc = await pool.request().query(`SELECT DocName,DocCode,
    FORMAT(DocDate,'yyyy-MM-dd') DocDate,
    FORMAT(DocDate,'dd/MM/yy') DocDateExcel
    FROM [DocNo] WHERE DocName = N'${DocName}';`);
  if (!selectDoc.recordset.length) {
    selectDoc = await pool.request().query(`INSERT INTO [DocNo](DocName,DocCode,DocDate)
        VALUES(N'${DocName}',N'F-DM','${getdate()}');
      SELECT DocName,DocCode, FORMAT(DocDate,'yyyy-MM-dd') DocDate,
        FORMAT(DocDate,'dd/MM/yy') DocDateExcel
        FROM [DocNo] WHERE DocName = N'${DocName}';`);
  }
  return selectDoc.recordset[0]
}

exports.getImg = async (RepairId) => {
  let pool = await sql.connect(dbconfig);
  let getIdx = await pool.request().query(`SELECT ProblemFilePath FROM [RepairOrder] WHERE RepairId = ${RepairId};
    SELECT TOP 1 IndexProgress,RepairFilePath FROM [RepairProgress] WHERE RepairId = ${RepairId} ORDER BY IndexProgress DESC;
    SELECT TOP 1 IndexQa,QaFilePath FROM [RepairQa] WHERE RepairId = ${RepairId} ORDER BY IndexQa DESC;`)
  let IndexProgress = 0, IndexQa = 0
  let ProblemFile = [], RepairFile = [], InspectFile = [], QaFile = []
  if (getIdx.recordsets[0][0].ProblemFilePath && !getIdx.recordsets[0][0].ProblemFilePath.includes('blank_'))
    ProblemFile.push(getIdx.recordsets[0][0].ProblemFilePath.replace('./', '/'))
  if (getIdx.recordsets[1].length) {
    IndexProgress = getIdx.recordsets[1][0].IndexProgress
    if (getIdx.recordsets[1][0].RepairFilePath)
      RepairFile.push(getIdx.recordsets[1][0].RepairFilePath.replace('./', '/'))
  }
  if (getIdx.recordsets[2].length) {
    IndexQa = getIdx.recordsets[2][0].IndexQa
    if (getIdx.recordsets[2][0].QaFilePath)
      QaFile.push(getIdx.recordsets[2][0].QaFilePath.replace('./', '/'))
  }
  let getPic = await pool.request().query(`SELECT ProblemFilePath FROM [RepairOrderImg] WHERE RepairId = ${RepairId} ORDER BY IndexImg;
    SELECT RepairFilePath FROM [RepairProgressImg] WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress} ORDER BY IndexImg;
    SELECT InspectFilePath FROM [RepairInspectImg] WHERE RepairId = ${RepairId} AND IndexProgress = ${IndexProgress} ORDER BY IndexImg;
    SELECT QaFilePath FROM [RepairQaImg] WHERE RepairId = ${RepairId} AND IndexQa = ${IndexQa} ORDER BY IndexImg;`)
  if (getPic.recordsets[0].length) getPic.recordsets[0].forEach(Pic => ProblemFile.push(Pic.ProblemFilePath.replace('./', '/')))
  if (getPic.recordsets[1].length) getPic.recordsets[1].forEach(Pic => RepairFile.push(Pic.RepairFilePath.replace('./', '/')))
  if (getPic.recordsets[2].length) getPic.recordsets[2].forEach(Pic => InspectFile.push(Pic.InspectFilePath.replace('./', '/')))
  if (getPic.recordsets[3].length) getPic.recordsets[3].forEach(Pic => QaFile.push(Pic.QaFilePath.replace('./', '/')))
  return { ProblemFile, RepairFile, InspectFile, QaFile }
}

exports.getDaily = async (Filter) => {
  let { FromDate, ToDate, OrderType, Section } = Filter
  let pool = await sql.connect(dbconfig);
  let whereFilter = `DATEDIFF(Minute,'${FromDate}',RequestTime) >= 0
    AND DATEDIFF(Minute,'${ToDate}',RequestTime) <= 0`;
  // if (mindiff(FromTime, ToTime) >= 0) whereFilter = `DATEDIFF(Day,'${FromDate}',RequestTime) >= 0
  //   AND DATEDIFF(Day,'${ToDate}',RequestTime) <= 0
  //   AND DATEDIFF(Minute,'${FromTime}',FORMAT(a.RequestTime, 'HH:mm')) >= 0
  //   AND DATEDIFF(Minute,'${ToTime}',FORMAT(a.RequestTime, 'HH:mm')) <= 0`
  // else whereFilter = `DATEDIFF(Day,'${FromDate}',RequestTime) >= 0
  //   AND DATEDIFF(Day,'${ToDate}',RequestTime) <= 0
  //   AND ((DATEDIFF(Minute,'${FromTime}',FORMAT(a.RequestTime, 'HH:mm')) >= 0
  //   AND DATEDIFF(Minute,'23:59',FORMAT(a.RequestTime, 'HH:mm')) <= 0)
  //   OR (DATEDIFF(Minute,'${ToTime}',FORMAT(a.RequestTime, 'HH:mm')) <= 0
  //   AND DATEDIFF(Minute,'00:00',FORMAT(a.RequestTime, 'HH:mm')) >= 0))`
  if (OrderType) whereFilter += ` AND a.OrderType = ${OrderType}`
  if (Section) whereFilter += ` AND a.Section = N'${Section}'`
  let selectDaily = `SELECT a.RepairId,a.SlipNo,a.RequestUserId,
      (
        SELECT TOP 1 value
        FROM STRING_SPLIT(b.Fullname, ' ')
      ) RequestUser,
      (SELECT TOP 1 (
          SELECT TOP 1 value
          FROM STRING_SPLIT(Fullname, ' ')
        )
        FROM [RepairProgress] c
        LEFT JOIN [User] d on c.RepairUserId = d.UserId
        WHERE c.RepairId = a.RepairId
        ORDER BY c.IndexProgress DESC) RepairUser,
      a.InjShot, a.OrderType,a.PartId, a.PartName,a.MoldId, a.MoldName,
      a.Section, a.ProblemSource, a.ProblemId, a.ProblemNo, a.Problem,a.Detail,a.Cause, 
      FORMAT(a.InjDate, 'dd-MM-yyyy HH:mm') InjDate,
      FORMAT(a.RequestTime, 'dd-MM-yyyy HH:mm') RequestTime,
      (SELECT TOP 1 e.FixDetail
        FROM [RepairProgress] e
        WHERE e.RepairId = a.RepairId
        ORDER BY e.IndexProgress DESC) FixDetail,
      (SELECT TOP 1 f.IndexProgress
        FROM [RepairProgress] f
        WHERE f.RepairId = a.RepairId
        ORDER BY f.IndexProgress DESC) IndexProgress,
      (SELECT TOP 1 FORMAT(g.PointCheckTime, 'dd-MM-yyyy HH:mm')
        FROM [RepairProgress] g
        WHERE g.RepairId = a.RepairId
        ORDER BY g.IndexProgress DESC) PointCheckTime,
      (SELECT TOP 1 FORMAT(h.DmApproveTime, 'dd-MM-yyyy HH:mm')
        FROM [RepairApprove] h
        WHERE h.RepairId = a.RepairId
        ORDER BY h.IndexApprove DESC) DmApproveTime,
      (SELECT TOP 1 FORMAT(i.TryDate, 'dd-MM-yyyy HH:mm')
        FROM [RepairQa] i
        WHERE i.RepairId = a.RepairId
        ORDER BY i.IndexQa DESC) TryDate,
      DATEDIFF(minute,a.RequestTime,(SELECT TOP 1 g.PointCheckTime
        FROM [RepairProgress] g
        WHERE g.RepairId = a.RepairId
        ORDER BY g.IndexProgress DESC)) RepairMin

    FROM [RepairOrder] a
    LEFT JOIN [User] b on a.RequestUserId = b.UserId
    WHERE ${whereFilter}
    ORDER BY SlipNo`
  // console.log(selectDaily)
  let DailyReport = await pool.request().query(selectDaily)
  for (let report of DailyReport.recordset) {
    let { RepairId, OrderType, RepairMin } = report
    report.Img = await this.getImg(RepairId)
    report.TotalTime = RepairMin ? `${Math.floor(RepairMin / 60)}:${RepairMin % 60}` : '-'
    report.OrderTypeText = OrderTypeText[OrderType]
  }
  // console.log(DailyReport.recordset)
  return DailyReport.recordset
}

exports.getMoldProblem = async (params) => {
  let { Month, Section } = params
  let where1 = '', where2 = ''
  if (Section != 'ALL') {
    where1 = ` AND b.Section = N'${Section}'`
    where2 = ` AND c.Section = N'${Section}'`
  }
  let pool = await sql.connect(dbconfig);
  let selectMoldProblem = `SELECT cast(a.ProblemNo as int) ProblemNo, a.Problem,
  (
    SELECT COUNT(RepairId)
    FROM [RepairOrder] b
    WHERE DATEDIFF(month,'${Month}',b.RequestTime) = 0 AND b.ProblemId = a.ProblemId
      ${where1}
  ) ProblemCount,
  (
    SELECT COUNT(RepairId) FROM [RepairOrder] c
      LEFT JOIN [MasterProblem] d on d.ProblemId = c.ProblemId
      WHERE DATEDIFF(month,'${Month}',c.RequestTime) = 0 AND d.ProblemType = 1
      ${where2}
  ) ProblemTotal
    FROM [MasterProblem] a
    WHERE a.ProblemType = 1 AND a.ProblemActive = 1
    ORDER BY cast(a.ProblemNo as int)`
  let MoldProblem = await pool.request().query(selectMoldProblem)
  for (let problem of MoldProblem.recordset) {
    let { ProblemCount, ProblemTotal } = problem
    problem.ProblemPercent = ProblemTotal ? (ProblemCount / ProblemTotal * 100).toFixed(2) : 0;
  }
  return MoldProblem.recordset
}
exports.getMoldPrepare = async (params) => {
  let { Month, Section } = params
  let where1 = '', where2 = ''
  if (Section != 'ALL') {
    where1 = ` AND b.Section = N'${Section}'`
    where2 = ` AND c.Section = N'${Section}'`
  }
  let pool = await sql.connect(dbconfig);
  let selectMoldPrepare = `SELECT a.ProblemNo, a.Problem,
  (
    SELECT COUNT(RepairId)
    FROM [RepairOrder] b
    WHERE DATEDIFF(month,'${Month}',b.RequestTime) = 0 AND b.ProblemId = a.ProblemId
      ${where1}
  ) ProblemCount,
  (
    SELECT COUNT(RepairId) FROM [RepairOrder] c
      LEFT JOIN [MasterProblem] d on d.ProblemId = c.ProblemId
      WHERE DATEDIFF(month,'${Month}',c.RequestTime) = 0 AND d.ProblemType = 2
        AND NOT a.Problem = N'ปัญหาเกิดจากเครื่องจักร' ${where2}
  ) ProblemTotal
    FROM [MasterProblem] a
    WHERE a.ProblemType = 2 AND a.ProblemActive = 1 AND NOT a.Problem = N'ปัญหาเกิดจากเครื่องจักร'
    ORDER BY a.ProblemNo`
  let MoldPrepare = await pool.request().query(selectMoldPrepare)
  for (let prepare of MoldPrepare.recordset) {
    let { ProblemCount, ProblemTotal } = prepare
    prepare.ProblemPercent = ProblemTotal ? (ProblemCount / ProblemTotal * 100).toFixed(2) : 0;
  }
  return MoldPrepare.recordset
}
exports.getTopMoldProblem = async (params) => {
  let { Month, Section } = params
  let where = ''
  if (Section != 'ALL') where = ` AND Section = N'${Section}'`
  let pool = await sql.connect(dbconfig);
  let selectProblem = `SELECT ProblemId,ProblemNo, Problem
    FROM [MasterProblem]
    WHERE ProblemType = 1 AND ProblemActive = 1
    ORDER BY ProblemId`
  let Problems = await pool.request().query(selectProblem)
  for (let Problem of Problems.recordset) {
    let { ProblemId } = Problem
    let selectMold = `SELECT TOP 1 MoldId, COUNT(RepairId) MoldCount
    FROM [RepairOrder]
    WHERE ProblemId = ${ProblemId} AND DATEDIFF(month,'${Month}',RequestTime) = 0
      ${where}
    GROUP BY MoldId ORDER BY MoldCount DESC`
    let Molds = await pool.request().query(selectMold)
    if (!Molds.recordset.length) {
      Problem.MoldName = '-'
      Problem.RequestTime = '-'
      Problem.MoldCount = 0
    } else {
      let { MoldId, MoldCount } = Molds.recordset[0]
      let Mold = await pool.request().query(`SELECT TOP 1 MoldName,
          FORMAT(RequestTime, 'dd-MM-yyyy') RequestTime
        FROM [RepairOrder]
        WHERE MoldId = ${MoldId} AND DATEDIFF(month,'${Month}',RequestTime) = 0
          ${where}
        ORDER BY RequestTime DESC`)
      let { MoldName, RequestTime } = Mold.recordset[0]
      Problem.MoldName = MoldName || '-'
      Problem.RequestTime = RequestTime || '-'
      Problem.MoldCount = MoldCount || 0
    }

  }
  return Problems.recordset
}
exports.getMoldCountermeasure = async (params) => {
  let { Month, Section } = params
  let where = ` AND Section = N'${Section}'`
  let pool = await sql.connect(dbconfig);
  let selectCountermeasure = `SELECT FORMAT(Month, 'yyyy-MM-dd') Month,
    IndexMold, MoldId,MoldName,
    FORMAT(RepairDate, 'yyyy-MM-dd HH:mm') RepairDate,
    FORMAT(RepairDate, 'dd-MM-yyyy HH:mm') RepairDateShow,
    Cause,FixDetail,ProblemCount,ResponsibleUserId, (
      SELECT TOP 1 value
      FROM STRING_SPLIT(Fullname, ' ')
      ) ResponsibleUser
    FROM [ReportMonthly] a
    LEFT JOIN [User] b on a.ResponsibleUserId = b.UserId
    WHERE DATEDIFF(month,'${Month}',Month) = 0 ${where}
    ORDER BY IndexMold`
  let Countermeasure = await pool.request().query(selectCountermeasure)
  if (!Countermeasure.recordset.length) { // New Counter measure
    let InsertCounterMeasure = `INSERT INTO [ReportMonthly](Month,Section,IndexMold)
      VALUES(N'${Month}',N'${Section}',1),(N'${Month}',N'${Section}',2),(N'${Month}',N'${Section}',3)`
    await pool.request().query(InsertCounterMeasure)
    let reselectCountermeasure = `SELECT FORMAT(Month, 'yyyy-MM-dd') Month,
      IndexMold, MoldId,MoldName,
      FORMAT(RepairDate, 'yyyy-MM-dd HH:mm') RepairDate,
      FORMAT(RepairDate, 'dd-MM-yyyy HH:mm') RepairDateShow,
      Cause,FixDetail,ProblemCount,ResponsibleUserId, (
        SELECT TOP 1 value
        FROM STRING_SPLIT(Fullname, ' ')
        ) ResponsibleUser
      FROM [ReportMonthly] a
      LEFT JOIN [User] b on a.ResponsibleUserId = b.UserId
      WHERE DATEDIFF(month,'${Month}',Month) = 0 ${where}
      ORDER BY IndexMold`
    Countermeasure = await pool.request().query(reselectCountermeasure)
  }
  let selectTopMold = `SELECT TOP 3 MoldId TopMoldId,MoldName TopMoldName, COUNT(RepairId) MoldCount
    FROM [RepairOrder]
    WHERE DATEDIFF(month,'${Month}',RequestTime) = 0 ${where}
    GROUP BY MoldId,MoldName ORDER BY MoldCount DESC`
  let TopMolds = await pool.request().query(selectTopMold)
  if (!TopMolds.recordset.length) return Countermeasure.recordset
  for (let counter = 0; counter < Countermeasure.recordset.length; counter++) {
    if (!TopMolds.recordset[counter]) continue;
    let { TopMoldId, TopMoldName, MoldCount } = TopMolds.recordset[counter]
    let { IndexMold, MoldId, ProblemCount } = Countermeasure.recordset[counter]
    if (MoldId == TopMoldId) {
      if (ProblemCount != MoldCount)
        await pool.request().query(`UPDATE [ReportMonthly]
          SET ProblemCount = ${MoldCount}
          WHERE DATEDIFF(month,'${Month}',Month) = 0 AND IndexMold = ${IndexMold}
            ${where}`)
      continue;
    }
    await pool.request().query(`UPDATE [ReportMonthly]
      SET MoldId = ${TopMoldId},MoldName = N'${TopMoldName}',ProblemCount = ${MoldCount}
      WHERE DATEDIFF(month,'${Month}',Month) = 0 AND IndexMold = ${IndexMold}
        ${where}`)
  }
  let selectupdatedCountermeasure = `SELECT FORMAT(Month, 'yyyy-MM-dd') Month,
    IndexMold, MoldId,MoldName,
    FORMAT(RepairDate, 'yyyy-MM-dd HH:mm') RepairDate,
    FORMAT(RepairDate, 'dd-MM-yyyy HH:mm') RepairDateShow,
    Cause,FixDetail,ProblemCount,ResponsibleUserId, (
      SELECT TOP 1 value
      FROM STRING_SPLIT(Fullname, ' ')
      ) ResponsibleUser
    FROM [ReportMonthly] a
    LEFT JOIN [User] b on a.ResponsibleUserId = b.UserId
    WHERE DATEDIFF(month,'${Month}',Month) = 0 ${where}
    ORDER BY IndexMold`
  let updatedCountermeasure = await pool.request().query(selectupdatedCountermeasure)
  return updatedCountermeasure.recordset
}

exports.getPO = async (Filter) => {
  let { FromDate, ToDate } = Filter
  let pool = await sql.connect(dbconfig);
  let selectPO = `SELECT row_number() over(order by a.RequestTime) as 'index', a.RepairId,
      FORMAT(a.RequestTime, 'dd-MM-yyyy') RequestDate,
      FORMAT(a.RequestTime, 'HH:mm') RequestTime,
      a.SlipNo,a.RequestUserId,(
        SELECT TOP 1 value
        FROM STRING_SPLIT(b.Fullname, ' ')
        ) RequestUser,
      a.Section,a.PartId,a.PartNo, a.PartName,a.McName,
      a.NoHAT,a.AS400,a.Detail,a.MgLeader,a.MgMgr,a.ProblemFilePath
    FROM [RepairOrder] a
    LEFT JOIN [User] b on a.RequestUserId = b.UserId
    WHERE DATEDIFF(day,'${FromDate}',RequestTime) >= 0 AND
      DATEDIFF(day,'${ToDate}',RequestTime) <= 0 AND
      a.Section = N'PO'
    ORDER BY a.RequestTime`
  let POReport = await pool.request().query(selectPO)
  for (let PO of POReport.recordset) {
    let { RepairId, ProblemFilePath } = PO
    PO['Document'] = !ProblemFilePath || ProblemFilePath.includes('blank') ? '-' : '/'
    let selectDetail = `SELECT TOP 1 IndexProgress, FixDetail,
        FORMAT(PointCheckTime, 'dd-MM-yyyy') PointCheckTime
      FROM [RepairProgress] WHERE RepairId = ${RepairId}
      ORDER BY IndexProgress DESC;
      SELECT TOP 1 IndexQa,
        FORMAT(TryDate, 'dd-MM-yyyy') TryDate,QaResult,QaRemark
      FROM [RepairQa] WHERE RepairId = ${RepairId}
      ORDER BY IndexQa DESC;`
    let Detail = await pool.request().query(selectDetail)
    if (Detail.recordsets[0].length) {
      let { IndexProgress, FixDetail, PointCheckTime } = Detail.recordsets[0][0]
      PO['IndexProgress'] = IndexProgress || 0
      PO['FixDetail'] = FixDetail || '-'
      PO['PointCheckTime'] = PointCheckTime || '-'
    } else {
      PO['IndexProgress'] = 0
      PO['FixDetail'] = '-'
      PO['PointCheckTime'] = '-'
    }
    if (Detail.recordsets[1].length) {
      let { IndexQa, TryDate, QaResult, QaRemark } = Detail.recordsets[1][0]
      PO['IndexQa'] = IndexQa || 0
      PO['TryDate'] = TryDate || '-'
      PO['QaResult'] = QaResult || '-'
      PO['QaRemark'] = QaRemark || '-'
    } else {
      PO['IndexQa'] = 0
      PO['TryDate'] = '-'
      PO['QaResult'] = '-'
      PO['QaRemark'] = '-'
    }
  }
  return POReport.recordset
}

exports.getRepairHistory = async (Filter) => {
  let { FromDate, ToDate, FromTime, ToTime } = Filter
  let pool = await sql.connect(dbconfig);
  let whereFilter = `DATEDIFF(Minute,'${FromDate}',RequestTime) >= 0
    AND DATEDIFF(Minute,'${ToDate}',RequestTime) <= 0`;
  // if (mindiff(FromTime, ToTime) >= 0) whereFilter = `DATEDIFF(Day,'${FromDate}',RequestTime) >= 0
  //   AND DATEDIFF(Day,'${ToDate}',RequestTime) <= 0
  //   AND DATEDIFF(Minute,'${FromTime}',FORMAT(a.RequestTime, 'HH:mm')) >= 0
  //   AND DATEDIFF(Minute,'${ToTime}',FORMAT(a.RequestTime, 'HH:mm')) <= 0`
  // else whereFilter = `DATEDIFF(Day,'${FromDate}',RequestTime) >= 0
  //   AND DATEDIFF(Day,'${ToDate}',RequestTime) <= 0
  //   AND ((DATEDIFF(Minute,'${FromTime}',FORMAT(a.RequestTime, 'HH:mm')) >= 0
  //   AND DATEDIFF(Minute,'23:59',FORMAT(a.RequestTime, 'HH:mm')) <= 0)
  //   OR (DATEDIFF(Minute,'${ToTime}',FORMAT(a.RequestTime, 'HH:mm')) <= 0
  //   AND DATEDIFF(Minute,'00:00',FORMAT(a.RequestTime, 'HH:mm')) >= 0))`
  let RepairHistory = `SELECT a.RepairId,a.SlipNo,a.InjShot,a.OrderType,
      a.PartId,a.PartName,a.PartNo,a.MoldId,a.MoldName,a.McName,
      a.Section,a.ProblemSource,a.ProblemId,a.ProblemNo,a.Problem,a.Detail,a.Cause,
      FORMAT(a.InjDate, 'dd-MM-yyyy HH:mm') InjDate,
      a.RequestUserId,(
        SELECT TOP 1 value
        FROM STRING_SPLIT(b.Fullname, ' ')
        ) RequestUser,
      FORMAT(a.RequestTime, 'dd-MM-yyyy HH:mm') RequestTime,
      a.ReceiveUserId,(
        SELECT TOP 1 value
        FROM STRING_SPLIT(c.Fullname, ' ')
        ) ReceiveUser,
      FORMAT(a.ReceiveTime, 'dd-MM-yyyy HH:mm') ReceiveTime,
      a.FinishUserId,(
        SELECT TOP 1 value
        FROM STRING_SPLIT(d.Fullname, ' ')
        ) FinishUser,
      FORMAT(a.FinishTime, 'dd-MM-yyyy HH:mm') FinishTime,
      DATEDIFF(minute,a.RequestTime,(SELECT TOP 1 e.PointCheckTime
        FROM [RepairProgress] e
        WHERE e.RepairId = a.RepairId
        ORDER BY e.IndexProgress DESC)) ProgressMin,
      DATEDIFF(minute,a.RequestTime,FinishTime) RepairMin
    FROM [RepairOrder] a
    LEFT JOIN [User] b on a.RequestUserId = b.UserId
    LEFT JOIN [User] c on a.ReceiveUserId = c.UserId
    LEFT JOIN [User] d on a.FinishUserId = d.UserId
    WHERE ${whereFilter}
    ORDER BY SlipNo`
  // console.log(RepairHistory)
  let RepairReport = await pool.request().query(RepairHistory)
  let TotalMin = 0
  for (let Repair of RepairReport.recordset) {
    let { RepairId, ProgressMin, RepairMin, OrderType } = Repair
    Repair['OrderTypeText'] = OrderTypeText[OrderType]
    Repair['ProgressTime'] = ProgressMin ? `${Math.floor(ProgressMin / 60)}:${ProgressMin % 60}` : '-'
    Repair['RepairTime'] = RepairMin ? `${Math.floor(RepairMin / 60)}:${RepairMin % 60}` : '-'
    TotalMin += RepairMin
    let selectDetail = `SELECT TOP 1 a.IndexProgress,
          a.FixDetail,a.RepairUserId,
          (
            SELECT TOP 1 value
            FROM STRING_SPLIT(b.Fullname, ' ')
          ) RepairUser,
          FORMAT(RepairStart, 'dd-MM-yyyy HH:mm') RepairStart,
          FORMAT(PointCheckTime, 'dd-MM-yyyy HH:mm') PointCheckTime
        FROM [RepairProgress] a
        LEFT JOIN [User] b on a.RepairUserId = b.UserId
        WHERE RepairId = ${RepairId}
        ORDER BY IndexProgress DESC;
      SELECT TOP 1 a.IndexCheck, a.DmCheckUserId,
          (
            SELECT TOP 1 value
            FROM STRING_SPLIT(b.Fullname, ' ')
          ) DmCheckUser,
          FORMAT(DmCheckTime, 'dd-MM-yyyy HH:mm') DmCheckTime
        FROM [RepairCheck] a
        LEFT JOIN [User] b on a.DmCheckUserId = b.UserId
        WHERE RepairId = ${RepairId}
        ORDER BY IndexCheck DESC;
      SELECT TOP 1 a.IndexApprove, a.DmApproveUserId,
          (
            SELECT TOP 1 value
            FROM STRING_SPLIT(b.Fullname, ' ')
          ) DmApproveUser,
          FORMAT(DmApproveTime, 'dd-MM-yyyy HH:mm') DmApproveTime
        FROM [RepairApprove] a
        LEFT JOIN [User] b on a.DmApproveUserId = b.UserId
        WHERE RepairId = ${RepairId}
        ORDER BY IndexApprove DESC;
      SELECT TOP 1 a.IndexQa,a.QaResult,a.QaRemark, a.QaUserId,
          (
            SELECT TOP 1 value
            FROM STRING_SPLIT(b.Fullname, ' ')
          ) QaUser,
          FORMAT(a.TryDate, 'dd-MM-yyyy HH:mm') TryDate
        FROM [RepairQa] a
        LEFT JOIN [User] b on a.QaUserId = b.UserId
        WHERE RepairId = ${RepairId}
        ORDER BY IndexQa DESC;`
    // console.log(selectDetail)
    let Detail = await pool.request().query(selectDetail)
    if (Detail.recordsets[0].length) {
      let { IndexProgress, FixDetail, RepairUserId, RepairUser, RepairStart, PointCheckTime } = Detail.recordsets[0][0]
      Repair['IndexProgress'] = IndexProgress || 0
      Repair['FixDetail'] = FixDetail || '-'
      Repair['RepairUserId'] = RepairUserId || 0
      Repair['RepairUser'] = RepairUser || '-'
      Repair['RepairStart'] = RepairStart || '-'
      Repair['PointCheckTime'] = PointCheckTime || '-'
    } else {
      Repair['IndexProgress'] = 0
      Repair['FixDetail'] = '-'
      Repair['RepairUserId'] = 0
      Repair['RepairUser'] = '-'
      Repair['RepairStart'] = '-'
      Repair['PointCheckTime'] = '-'
    }
    if (Detail.recordsets[1].length) {
      let { IndexCheck, DmCheckUserId, DmCheckUser, DmCheckTime } = Detail.recordsets[1][0]
      Repair['IndexCheck'] = IndexCheck || 0
      Repair['DmCheckUserId'] = DmCheckUserId || 0
      Repair['DmCheckUser'] = DmCheckUser || '-'
      Repair['DmCheckTime'] = DmCheckTime || '-'
    } else {
      Repair['IndexCheck'] = 0
      Repair['DmCheckUserId'] = 0
      Repair['DmCheckUser'] = '-'
      Repair['DmCheckTime'] = '-'
    }
    if (Detail.recordsets[2].length) {
      let { IndexApprove, DmApproveUserId, DmApproveUser, DmApproveTime } = Detail.recordsets[2][0]
      Repair['IndexApprove'] = IndexApprove || 0
      Repair['DmApproveUserId'] = DmApproveUserId || 0
      Repair['DmApproveUser'] = DmApproveUser || '-'
      Repair['DmApproveTime'] = DmApproveTime || '-'
    } else {
      Repair['IndexApprove'] = 0
      Repair['DmApproveUserId'] = 0
      Repair['DmApproveUser'] = '-'
      Repair['DmApproveTime'] = '-'
    }
    if (Detail.recordsets[3].length) {
      let { IndexQa, TryDate, QaResult, QaRemark, QaUserId, QaUser } = Detail.recordsets[3][0]
      Repair['IndexQa'] = IndexQa || 0
      Repair['TryDate'] = TryDate || '-'
      Repair['QaResult'] = QaResult || '-'
      Repair['QaRemark'] = QaRemark || '-'
      Repair['QaUserId'] = QaUserId || 0
      Repair['QaUser'] = QaUser || '-'
    } else {
      Repair['IndexQa'] = 0
      Repair['TryDate'] = '-'
      Repair['QaResult'] = '-'
      Repair['QaRemark'] = '-'
      Repair['QaUserId'] = 0
      Repair['QaUser'] = '-'
    }
    Repair['Img'] = await this.getImg(RepairId)

  }
  let TotalTime = TotalMin ? `${Math.floor(TotalMin / 60)}:${TotalMin % 60}` : '-'
  return { RepairReport: RepairReport.recordset, TotalTime }
}