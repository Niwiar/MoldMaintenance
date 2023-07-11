const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");
const { gettime } = require("../libs/datetime");

exports.getActualHistory = async (params) => {
  let { MoldId } = params
  let { FromDate, ToDate } = JSON.parse(params.Filter);
  let FromFilter = ''
  if (FromDate && ToDate) FromFilter = `AND DATEDIFF(minute,'${FromDate}',UpdatedTime) >= 0
    AND DATEDIFF(minute,'${ToDate}',UpdatedTime) <= 0`
  else if (FromDate) FromFilter = `AND DATEDIFF(minute,'${FromDate}',UpdatedTime) >= 0`
  let SelectActualHistory = `SELECT MoldId, PartId, PartName, ActualShot,
      FORMAT(UpdatedTime, 'yyyy-MM-dd HH:mm') UpdatedTime
    FROM [MoldActual]
    WHERE MoldId = ${MoldId} ${FromFilter} ORDER BY UpdatedTime DESC`;
  let pool = await sql.connect(dbconfig);
  let ActualHistory = await pool.request().query(SelectActualHistory);
  return ActualHistory.recordset
}

exports.getPmHistory = async (params) => {
  let { MoldId } = params
  let { FromDate, ToDate, PmType } = JSON.parse(params.Filter);
  let SelectPmHistory;
  let FromFilter = ''
  if (FromDate && ToDate) FromFilter = `AND DATEDIFF(minute,'${FromDate}',(
        SELECT TOP 1 PointCheckTime
          FROM RepairProgress c WHERE c.RepairId = a.RepairId)
      ) >= 0
    AND DATEDIFF(minute,'${ToDate}',(
        SELECT TOP 1 PointCheckTime
          FROM RepairProgress c WHERE c.RepairId = a.RepairId)
      ) <= 0`
  else if (FromDate) FromFilter = `AND DATEDIFF(minute,'${FromDate}',(
      SELECT TOP 1 PointCheckTime
        FROM RepairProgress c WHERE c.RepairId = a.RepairId)
    ) >= 0`
  if (PmType == 'ALL') {
    SelectPmHistory = `SELECT MoldId, PartId, PartName, InjShot, a.ProblemId,
        (SELECT TOP 1 FORMAT(PointCheckTime, 'yyyy-MM-dd HH:mm')
          FROM RepairProgress c WHERE c.RepairId = a.RepairId) PmDate
      FROM [RepairOrder] a
      LEFT JOIN [MasterProblem] b on a.ProblemId = b.ProblemId
      WHERE MoldId = ${MoldId} AND b.ProblemType = 2
        AND (a.ProblemId = 20 OR a.ProblemId = 21 OR a.ProblemId > 22) ${FromFilter}
      ORDER BY PmDate DESC`;
  } else if (PmType == 'Cleaning') {
    SelectPmHistory = `SELECT MoldId, PartId, PartName, InjShot, a.ProblemId,
        (SELECT TOP 1 FORMAT(PointCheckTime, 'yyyy-MM-dd HH:mm')
          FROM RepairProgress c WHERE c.RepairId = a.RepairId) PmDate
      FROM [RepairOrder] a
      LEFT JOIN [MasterProblem] b on a.ProblemId = b.ProblemId
      WHERE MoldId = ${MoldId} AND a.ProblemId = 20 ${FromFilter}
      ORDER BY PmDate DESC`;
  } else if (PmType == 'Preventive') {
    SelectPmHistory = `SELECT MoldId, PartId, PartName, InjShot, ProblemId,
        (SELECT TOP 1 FORMAT(PointCheckTime, 'yyyy-MM-dd HH:mm')
          FROM RepairProgress c WHERE c.RepairId = a.RepairId) PmDate
      FROM [RepairOrder] a
      WHERE MoldId = ${MoldId} AND ProblemId = 21 ${FromFilter}
      ORDER BY PmDate DESC`;
  } else {
    SelectPmHistory = `SELECT MoldId, PartId, PartName, InjShot, a.ProblemId,
        (SELECT TOP 1 FORMAT(PointCheckTime, 'yyyy-MM-dd HH:mm')
          FROM RepairProgress c WHERE c.RepairId = a.RepairId) PmDate
      FROM [RepairOrder] a
      LEFT JOIN [MasterProblem] b on a.ProblemId = b.ProblemId
      WHERE MoldId = ${MoldId} AND b.ProblemType = 2
        AND a.ProblemId > 22 ${FromFilter}
      ORDER BY PmDate DESC`;
  }
  let pool = await sql.connect(dbconfig);
  let PmHistory = await pool.request().query(SelectPmHistory);
  console.log(PmHistory.recordset)
  if (PmHistory.recordset)
    for (let Pm of PmHistory.recordset) {
      let { ProblemId } = Pm
      Pm['PmType'] = 'Other';
      if (ProblemId == 20) Pm['PmType'] = 'Cleaning'
      else if (ProblemId == 21) Pm['PmType'] = 'Preventive'
    }
  return PmHistory.recordset
}

exports.getCumulative = async (params) => {
  let { MoldId } = params
  let { FromDate, ToDate } = JSON.parse(params.Filter);
  let FromFilter = ''
  if (FromDate && ToDate) FromFilter = `AND DATEDIFF(minute,'${FromDate}',UpdatedTime) >= 0
    AND DATEDIFF(minute,'${ToDate}',UpdatedTime) <= 0`
  else if (FromDate) FromFilter = `AND DATEDIFF(minute,'${FromDate}',UpdatedTime) >= 0`
  let SelectCumulative = `SELECT PartName, SUM(ActualShot) CumulativeShot
    FROM [MoldActual]
    WHERE MoldId = ${MoldId} ${FromFilter}
    GROUP BY PartId,PartName ORDER BY PartId`;
  let pool = await sql.connect(dbconfig);
  let Cumulative = await pool.request().query(SelectCumulative);
  return Cumulative.recordset
}