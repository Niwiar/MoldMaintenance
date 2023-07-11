const today = () => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  return dd + "/" + mm + "/" + yyyy;
};

const getdate = (day = 0, month = 1, year = 0) => {
  let today = new Date();
  let dd = today.getDate() + day;
  let mm = today.getMonth() + month;
  let yyyy = today.getFullYear() + year;
  let lastday = lastdayInMonth(mm - 1, yyyy);
  if (dd > lastday) {
    dd = dd - lastday
    mm++
  }
  if (mm > 12) {
    mm = mm - 12;
    year++;
  }
  if (dd > lastday) dd = lastday;
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  return yyyy + "-" + mm + "-" + dd;
};
const gettime = () => {
  let today = new Date();
  let hh = today.getHours();
  let mm = today.getMinutes();
  let ss = today.getSeconds();
  let DD = today.getDate();
  let MM = today.getMonth() + 1;
  let YYYY = today.getFullYear();
  if (hh < 10) hh = "0" + hh;
  if (mm < 10) mm = "0" + mm;
  if (ss < 10) ss = "0" + ss;
  if (DD < 10) DD = "0" + DD;
  if (MM < 10) MM = "0" + MM;
  let date = `${YYYY}-${MM}-${DD}`;
  let time = `${hh}:${mm}:${ss}`;
  return date + " " + time;
};
const ymd2dmydate = (Datetime) => {
  let today = new Date(Datetime);
  let DD = today.getDate();
  let MM = today.getMonth() + 1;
  let YYYY = today.getFullYear();
  if (DD < 10) DD = "0" + DD;
  if (MM < 10) MM = "0" + MM;
  let date = `${DD}-${MM}-${YYYY}`;
  return date;
}
const ymd2dmytime = (Datetime) => {
  let today = new Date(Datetime);
  let hh = today.getHours();
  let mm = today.getMinutes();
  let ss = today.getSeconds();
  let DD = today.getDate();
  let MM = today.getMonth() + 1;
  let YYYY = today.getFullYear();
  if (hh < 10) hh = "0" + hh;
  if (mm < 10) mm = "0" + mm;
  if (ss < 10) ss = "0" + ss;
  if (DD < 10) DD = "0" + DD;
  if (MM < 10) MM = "0" + MM;
  let date = `${DD}-${MM}-${YYYY}`;
  let time = `${hh}:${mm}:${ss}`;
  return date + " " + time;
}
const getdates = (FromDate, ToDate) => {
  let dateArray = new Array()
  let startDate = new Date(FromDate);
  let stopDate = new Date(ToDate);
  let currentDate = startDate;
  while (currentDate <= stopDate) {
    let DD = currentDate.getDate();
    let MM = currentDate.getMonth() + 1;
    let YYYY = currentDate.getFullYear();
    if (DD < 10) DD = "0" + DD;
    if (MM < 10) MM = "0" + MM;
    let date = `${YYYY}-${MM}-${DD}`;
    dateArray.push(date)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dateArray;
};
const getweek = (checkDate) => {
  let today = new Date(checkDate);
  today.setDate(today.getDate() - today.getDay() + 1)
  let Week = new Array;
  for (let i = 0; i < 7; i++) {
    let day = new Date(today);
    let DD = day.getDate();
    let MM = day.getMonth() + 1;
    let YYYY = day.getFullYear();
    if (DD < 10) DD = "0" + DD;
    if (MM < 10) MM = "0" + MM;
    let date = `${YYYY}-${MM}-${DD}`;
    let Dow = day.getDay()
    Dow = Dow == 0 ? 6 : Dow - 1
    Week[Dow] = date;
    today.setDate(today.getDate() + 1)
  }
  return Week;
};
const getDayOfWeek = (checkDate) => {
  let today = new Date(checkDate);
  let DayOfWeek = today.getDay();
  return DayOfWeek;
};

const datediff = (startDate = '2022-12-01', endDate = '2022-12-01') => {
  let date1 = new Date(startDate)
  let date2 = new Date(endDate)
  // console.log(date1, date2)
  let diff = date2 - date1
  // console.log(diff)
  return diff / 1000 / 60 / 60 / 24
}
const mindiff = (startTime, endTime, startDate = '2022-12-01', endDate = '2022-12-01') => {
  let date1 = new Date(`${startDate} ${startTime}`)
  let date2 = new Date(`${endDate} ${endTime}`)
  // console.log(date1, date2)
  let diff = date2 - date1
  // console.log(diff)
  return diff / 1000 / 60
}

const getfirst = (month, year) =>
  new Date(parseInt(year), parseInt(month) - 1, 1);
const getlast = (month, year) => new Date(parseInt(year), parseInt(month), 0);
const lastdayInMonth = (month, year) => new Date(year, month, 0).getDate();

module.exports = {
  today,
  getdate,
  gettime,
  ymd2dmydate,
  ymd2dmytime,
  getdates,
  getweek,
  getDayOfWeek,
  getfirst,
  getlast,
  datediff,
  mindiff,
  lastdayInMonth,
};


