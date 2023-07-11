const DayOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

if ($('#currentTime')) startTime();
if ($('.month-search')) monthNow();
if ($('.day-search')) dayNow();
if ($('#clockTime')) runclock();

function startTime() {
  let today = new Date();

  let date =
    ('0' + today.getDate()).slice(-2) +
    '/' +
    ('0' + (today.getMonth() + 1)).slice(-2) +
    '/' +
    today.getFullYear();
  let time =
    ('0' + today.getHours()).slice(-2) +
    ':' +
    ('0' + today.getMinutes()).slice(-2) +
    ':' +
    ('0' + today.getSeconds()).slice(-2);
  let day = DayOfWeek[today.getDay()];
  $('#currentTime').text(time);
  $('#currentDate').text(date);
  $('#currentDay').text(day);
  setTimeout(startTime, 500);
}

function monthNow() {
  var today = new Date();
  var month =
    today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2);
  $('.month-search').val(month);
}

function dayNow() {
  var today = new Date();
  var date =
    today.getFullYear() +
    '-' +
    ('0' + (today.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + today.getDate()).slice(-2);
  $('.day-search').val(date);
}

function runclock() {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  var today = new Date();
  var day = ('0' + today.getDate()).slice(-2);
  var month = monthNames[today.getMonth()];

  var Time =
    ('0' + today.getHours()).slice(-2) +
    ':' +
    ('0' + today.getMinutes()).slice(-2) +
    ':' +
    ('0' + today.getSeconds()).slice(-2);
  // console.log(month)
  $('#clockTime').val(Time);
  $('#clockMonth').val(month);
  $('#clockDay').val(day);
  var t = setTimeout(runclock, 500);
}

function getDateTimeLocal() {
  let today = new Date();
  let hh = today.getHours();
  let mm = today.getMinutes();
  let ss = today.getSeconds();
  let DD = today.getDate();
  let MM = today.getMonth() + 1;
  let YYYY = today.getFullYear();
  if (hh < 10) hh = '0' + hh;
  if (mm < 10) mm = '0' + mm;
  if (ss < 10) ss = '0' + ss;
  if (DD < 10) DD = '0' + DD;
  if (MM < 10) MM = '0' + MM;
  let date = `${YYYY}-${MM}-${DD}`;
  let time = `${hh}:${mm}:${ss}`;
  return date + ' ' + time;
}

const datediff = (startDate = '2022-12-01', endDate = '2022-12-01') => {
  let date1 = new Date(startDate);
  let date2 = new Date(endDate);
  // console.log(date1, date2)
  let diff = date2 - date1;
  // console.log(diff)
  return diff / 1000 / 60 / 60 / 24;
};
