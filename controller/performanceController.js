const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");
const { gettime, getweek, mindiff, datediff, getdates } = require("../libs/datetime");

const BreakStart = ['10:00', '12:00', '15:00', '17:00', '21:00', '00:00', '03:00', '05:00']
const BreakEnd = ['10:10', '12:50', '15:10', '17:20', '21:40', '00:20', '03:10', '05:20']

const getMold = async (Filter) => {
  let { PerformType, FromDate, ToDate } = Filter
  let pool = await sql.connect(dbconfig);
  let selectMold;
  let Week = getweek(FromDate)
  if (PerformType == 1) // Daily
    selectMold = `SELECT MoldId, MoldName
      FROM [RepairOrder]
      WHERE ((
        DATEDIFF(Day,RequestTime,'${FromDate}') = 0
        AND DATEDIFF(Minute,'08:00',FORMAT(RequestTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'23:59',FORMAT(RequestTime, 'HH:mm')) <= 0
      ) OR
      (
        DATEDIFF(day, RequestTime, '${FromDate}') = -1
        AND DATEDIFF(Minute,'00:00',FORMAT(RequestTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'07:59',FORMAT(RequestTime, 'HH:mm')) <= 0
      ))
      GROUP BY MoldId,MoldName ORDER BY MoldId`
  else if (PerformType == 2) // Monthly
    selectMold = `SELECT MoldId, MoldName
      FROM [RepairOrder]
      WHERE ((
        DATEDIFF(day, RequestTime, '${Week[1]}') = 0
        AND DATEDIFF(Minute,'08:00',FORMAT(RequestTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'23:59',FORMAT(RequestTime, 'HH:mm')) <= 0
      ) OR (
        DATEDIFF(day, RequestTime, '${Week[1]}') < 0
        AND DATEDIFF(day, RequestTime, '${Week[6]}') >= 0
      ) OR (
        DATEDIFF(day, RequestTime, '${Week[6]}') = -1
        AND DATEDIFF(Minute,'00:00',FORMAT(RequestTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'07:59',FORMAT(RequestTime, 'HH:mm')) <= 0
      ))
      GROUP BY MoldId,MoldName ORDER BY MoldId`
  else if (PerformType == 3) // Custom
    selectMold = `SELECT MoldId, MoldName
        FROM [RepairOrder]
        WHERE DATEDIFF(minute, RequestTime, '${FromDate}') <= 0
          AND DATEDIFF(minute, RequestTime, '${ToDate}') >= 0
        GROUP BY MoldId,MoldName ORDER BY MoldId`
  let Mold = await pool.request().query(selectMold)
  return Mold.recordset
}
const getTech = async (TechFilter) => {
  let pool = await sql.connect(dbconfig);
  let Tech = [], TechIdArr = []
  console.log(TechFilter.length)
  if (TechFilter.length) {
    TechIdArr = TechFilter

    for (let idx = 0; idx < TechFilter.length; idx++) {
      console.log(idx, TechFilter[idx])
      let selectTech = await pool.request().query(`SELECT UserId, Fullname Name
        FROM [User] WHERE UserId = ${TechFilter[idx]} ORDER BY PositionId, UserId`)
      let TechName = selectTech.recordset[0].Name
      console.log(TechName)
      Tech.push(TechName.split(' ')[0])
    }
  } else {
    let selectTech = await pool.request().query(`SELECT UserId, Fullname Name
      FROM [User] a INNER JOIN [MasterSection] b on a.SectionId = b.SectionId
      WHERE b.Section = 'DM' AND a.Active = 1 ORDER BY PositionId, UserId`)
    let TechList = selectTech.recordset
    TechList.forEach(user => {
      TechIdArr.push(user.UserId)
      Tech.push(user.Name.split(' ')[0])
    })
  }

  return { TechIdArr, Tech }
}

const getWorktime = async (TechId, MoldId, Filter, Week) => {
  let { PerformType, FromDate, ToDate } = Filter
  let pool = await sql.connect(dbconfig);
  let selectWorktime;
  if (PerformType == 1)  // Daily
    selectWorktime = `SELECT FORMAT(a.LoginTime,'yyyy-MM-dd HH:mm') LoginDateTime,
      FORMAT(a.LogoutTime,'yyyy-MM-dd HH:mm') LogoutDateTime,
      DATEDIFF(minute, a.LoginTime, a.LogoutTime) Worktime
    FROM [RepairTech] a
    INNER JOIN [RepairOrder] b on a.RepairId = b.RepairId
    WHERE a.UserId = ${TechId} AND b.MoldId = ${MoldId}
    AND((
        DATEDIFF(day, a.LoginTime, '${FromDate}') = 0
        AND DATEDIFF(Minute,'08:00',FORMAT(a.LoginTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'23:59',FORMAT(a.LoginTime, 'HH:mm')) <= 0
      ) OR
      (
        DATEDIFF(day, a.LoginTime, '${FromDate}') = -1
        AND DATEDIFF(Minute,'00:00',FORMAT(a.LoginTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'07:59',FORMAT(a.LoginTime, 'HH:mm')) <= 0
      ))
    ORDER BY a.LoginTime`
  else if (PerformType == 2)  // Weekly
    selectWorktime = `SELECT FORMAT(a.LoginTime,'yyyy-MM-dd HH:mm') LoginDateTime,
      FORMAT(a.LogoutTime,'yyyy-MM-dd HH:mm') LogoutDateTime,
      DATEDIFF(minute, a.LoginTime, a.LogoutTime) Worktime
    FROM [RepairTech] a
    INNER JOIN [RepairOrder] b on a.RepairId = b.RepairId
    WHERE a.UserId = ${TechId} AND b.MoldId = ${MoldId}
      AND ((
        DATEDIFF(day, a.LoginTime, '${Week[0]}') = 0
        AND DATEDIFF(Minute,'08:00',FORMAT(a.LoginTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'23:59',FORMAT(a.LoginTime, 'HH:mm')) <= 0
      ) OR (
        DATEDIFF(day, a.LoginTime, '${Week[0]}') < 0
        AND DATEDIFF(day, a.LoginTime, '${Week[6]}') >= 0
      ) OR (
        DATEDIFF(day, a.LoginTime, '${Week[6]}') = -1
        AND DATEDIFF(Minute,'00:00',FORMAT(a.LoginTime, 'HH:mm')) >= 0
        AND DATEDIFF(Minute,'07:59',FORMAT(a.LoginTime, 'HH:mm')) <= 0
      ))
    ORDER BY a.LoginTime`
  else  // Custom
    selectWorktime = `SELECT FORMAT(a.LoginTime,'yyyy-MM-dd HH:mm') LoginDateTime,
      FORMAT(a.LogoutTime,'yyyy-MM-dd HH:mm') LogoutDateTime,
      DATEDIFF(minute, a.LoginTime, a.LogoutTime) Worktime
    FROM [RepairTech] a
    INNER JOIN [RepairOrder] b on a.RepairId = b.RepairId
    WHERE a.UserId = ${TechId} AND b.MoldId = ${MoldId}
      AND DATEDIFF(minute, a.LoginTime, '${FromDate}') <= 0
        AND DATEDIFF(minute, a.LoginTime, '${ToDate}') >= 0
    ORDER BY a.LoginTime`

  let WorkTotal = await pool.request().query(selectWorktime)
  if (WorkTotal.recordset.length) return WorkTotal.recordset
  else return 0
}

const calBreakTime = async (Shift, LoginTime, LogoutTime) => {
  let BreakTime = 0;
  if (Shift == 'full') { // full time
    for (let count = 0; count < 8; count++) {
      if (mindiff(LoginTime, BreakStart[count]) >= 0 && mindiff(LogoutTime, BreakEnd[count]) <= 0)
        BreakTime += mindiff(BreakStart[count], BreakEnd[count])
      else if (mindiff(LoginTime, BreakStart[count]) >= 0 && mindiff(LogoutTime, BreakStart[count]) <= 0 && mindiff(LogoutTime, BreakEnd[count]) >= 0)
        BreakTime += mindiff(BreakStart[count], LogoutTime)
      else if (mindiff(LoginTime, BreakStart[count]) <= 0 && mindiff(LoginTime, BreakEnd[count]) >= 0 && mindiff(LogoutTime, BreakEnd[count]) <= 0)
        BreakTime += mindiff(LoginTime, BreakEnd[count])
      else if (mindiff(LoginTime, BreakStart[count]) <= 0 && mindiff(LoginTime, BreakEnd[count]) >= 0 && mindiff(LogoutTime, BreakStart[count]) <= 0 && mindiff(LogoutTime, BreakEnd[count]) >= 0)
        BreakTime += mindiff(LoginTime, LogoutTime)
    }
  } else if (Shift == 'full-in') { // full time from login time
    for (let count = 0; count < 8; count++) {
      if (mindiff(LoginTime, BreakStart[count]) >= 0)
        BreakTime += mindiff(BreakStart[count], BreakEnd[count])
      else if (mindiff(LoginTime, BreakStart[count]) <= 0 && mindiff(LoginTime, BreakEnd[count]) >= 0)
        BreakTime += mindiff(LoginTime, BreakEnd[count])
    }
  } else if (Shift == 'full-out') {// full time from logout time
    for (let count = 0; count < 8; count++) {
      if (mindiff(LogoutTime, BreakEnd[count]) <= 0)
        BreakTime += mindiff(BreakEnd[count], BreakEnd[count])
      else if (mindiff(LogoutTime, BreakEnd[count]) <= 0 && mindiff(LogoutTime, BreakEnd[count]) >= 0)
        BreakTime += mindiff(BreakEnd[count], LogoutTime)
    }
  } else if (Shift == 'day') { // day break
    for (let count = 0; count < 5; count++) {
      if (mindiff(LoginTime, BreakStart[count]) >= 0)
        BreakTime += mindiff(BreakStart[count], BreakEnd[count])
      else if (mindiff(LoginTime, BreakStart[count]) <= 0 && mindiff(LoginTime, BreakEnd[count]) >= 0)
        BreakTime += mindiff(LoginTime, BreakEnd[count])
    }
  } else if (Shift == 'night') { // night break
    for (let count = 5; count < 8; count++) {
      if (mindiff(LogoutTime, BreakEnd[count]) <= 0)
        BreakTime += mindiff(BreakEnd[count], BreakEnd[count])
      else if (mindiff(LogoutTime, BreakEnd[count]) <= 0 && mindiff(LogoutTime, BreakEnd[count]) >= 0)
        BreakTime += mindiff(BreakEnd[count], LogoutTime)
    }
  }
  return BreakTime
}

const calWorkTime = async (TechWork, Filter, Ranges) => {
  let { PerformType, FromDate, ToDate } = Filter
  let { LoginDateTime, LogoutDateTime, Worktime } = TechWork
  if (Worktime == 0 || !LogoutDateTime) return 0;
  let TempWorktime = Worktime, SpareWorkTime = 0
  let [LoginDate, LoginTime] = LoginDateTime.split(' ')
  let [LogoutDate, LogoutTime] = LogoutDateTime.split(' ')
  if (PerformType == 1) { //Daily
    if (LoginDate == LogoutDate) {
      TempWorktime -= await calBreakTime('full', LoginTime, LogoutTime)
    } else if (datediff(LoginDate, FromDate) == 0 && datediff(LogoutDate, FromDate) == -1) {
      console.log('Same Night')
      TempWorktime -= await calBreakTime('day', LoginTime, LogoutTime)
      TempWorktime -= await calBreakTime('night', LoginTime, LogoutTime)
    } else {
      console.log('Different Day')
      let WorkDay = datediff(LoginDate, LogoutDate)
      console.log(datediff(LoginDate, FromDate))
      if (datediff(LoginDate, FromDate) == 0) {
        console.log('Login Day')
        TempWorktime -= 1440 * (WorkDay - 1)
        TempWorktime -= mindiff('00:00', LogoutTime)
        TempWorktime -= await calBreakTime('full-in', LoginTime, LogoutTime)
      } else if (datediff(LogoutDate, FromDate) == 0) {
        console.log('Logout Day')
        TempWorktime -= 1440 * (WorkDay - 1)
        TempWorktime -= mindiff(LoginTime, '23:59')
        TempWorktime -= await calBreakTime('full-out', LoginTime, LogoutTime)

      } else {
        console.log('Between Day')
        TempWorktime -= (1440 * (WorkDay - 2) + 790)
        TempWorktime -= mindiff('00:00', LogoutTime)
        TempWorktime -= mindiff(LoginTime, '23:59')
      }
    }
  } else { // Custom
    console.log('Week & custom')
    if (LoginDate == LogoutDate) {
      TempWorktime -= await calBreakTime('full', LoginTime, LogoutTime)
    } else {
      console.log('difdate')
      console.log(Ranges)
      // let WorkDay = datediff(LoginDate, LogoutDate)
      for (let loop = 0; loop < Ranges.length; loop++) {
        console.log(Ranges[loop])
        if (datediff(LoginDate, Ranges[loop]) == 0 && datediff(LogoutDate, Ranges[loop]) == -1) {
          console.log('Same Night')
          TempWorktime -= await calBreakTime('day', LoginTime, LogoutTime)
          TempWorktime -= await calBreakTime('night', LoginTime, LogoutTime)
        } else if (datediff(LoginDate, Ranges[loop]) == 0) {
          SpareWorkTime += mindiff(LoginTime, '23:59')
          SpareWorkTime -= await calBreakTime('full-in', LoginTime, LogoutTime)
        } else if (datediff(LogoutDate, Ranges[loop]) == 0) {
          SpareWorkTime += mindiff('00:00', LogoutTime)
          SpareWorkTime -= await calBreakTime('full-out', LoginTime, LogoutTime)
        } else if (datediff(LoginDate, Ranges[loop]) >= 0 && datediff(LogoutDate, Ranges[loop]) <= 0) {
          SpareWorkTime += 790
        }
        console.log(TempWorktime, SpareWorkTime)
      }
    }
  }
  console.log(LoginDateTime, LogoutDateTime, Worktime, Worktime - TempWorktime, SpareWorkTime)
  if (SpareWorkTime) return SpareWorkTime;
  else return TempWorktime;
}

const createSerie = async (Mold, TechList, Filter, Ranges) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { MoldId, MoldName } = Mold
      let { TechIdArr } = TechList
      let Work = Array(TechIdArr.length).fill(0)
      for (let tech = 0; tech < TechIdArr.length; tech++) {
        // let { TechId } = TechIdArr[tech]
        let TechWorkArr = await getWorktime(TechIdArr[tech], MoldId, Filter, Ranges)
        if (TechWorkArr == 0) continue;
        // console.log(TechWorkArr)
        for (let work = 0; work < TechWorkArr.length; work++) {
          let RealWorkTime = await calWorkTime(TechWorkArr[work], Filter, Ranges)
          Work[tech] += RealWorkTime
          console.log(MoldName, 'work tech update', Work[tech])
        }
      }
      resolve({ text: MoldName, values: Work })
    } catch (err) {
      reject(err)
    }
  })

}

exports.showPerformance = async (Filter) => {
  let { PerformType, FromDate, ToDate, TechFilter } = Filter
  console.log(TechFilter)
  let MoldList = await getMold(Filter);
  let TechList = await getTech(TechFilter);
  console.log(TechList)
  let SeriesArr = [], Ranges;
  if (PerformType == 2) Ranges = getweek(FromDate)
  if (PerformType == 3) Ranges = getdates(FromDate, ToDate)
  MoldList.forEach(Mold => SeriesArr.push(createSerie(Mold, TechList, Filter, Ranges)))
  let Series = await Promise.all(SeriesArr)
  if (!Series.length) Series = [{ text: 'No Repair', values: Array(TechList.Tech.length).fill(0) }]
  console.log(Series)
  for (let idx = 0; idx < Series.length; idx++) {
    console.log(Series[idx])
    if (Series[idx].values.every(value => value == 0)) {
      Series.splice(idx, 1);
      idx--;
    }
  }
  console.log(Series)
  return { Tech: TechList.Tech, Series }
}


