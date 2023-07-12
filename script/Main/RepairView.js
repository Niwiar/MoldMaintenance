const $SectionFilter = $(
  '#Section1_Filter,#Section2_Filter,#Section3_Filter,#Section4_Filter'
);
const $MulSectionFilter = $(
  '#Section1_Filter option,#Section2_Filter option,#Section3_Filter option,#Section4_Filter option'
);

let Filters = ['', 'PO', 'DC', 'MG', 'ALL'];

let alertInterval;
const notify = new Audio('./sound/notify.mp3');
function stopSound() {
  clearInterval(alertInterval);
}
function playSound() {
  clearInterval(alertInterval);
  alertInterval = setInterval(async () => {
    notify.play();
  }, 1000);
}

// Fill Table
function fillRepairOrderList(TableId, Section) {
  let isRequest = [];
  $(`${TableId}`).DataTable({
    bDestroy: true,
    scrollCollapse: true,
    scrollY: '20vh',
    searching: true,
    paging: false,
    lengthChange: false,
    ordering: false,
    info: true,
    autoWidth: false,
    dom: 'rtip',
    ajax: {
      url: `/repair/list/${Section}`,
      dataSrc: '',
    },
    columnDefs: [
      { orderData: [4, 1], targets: [0, 1] },
      {
        targets: [4],
        visible: false,
        searchable: false,
      },
      {
        targets: [5],
        visible: false,
        searchable: true,
      },
    ],
    columns: [
      {
        width: '15%',
        data: 'StatusId',
        render: function (data, type, row) {
          if (data == 1) {
            isRequest.push('request');
            playSound();
          }
          let Alert = row.ScheduleResult == 2 ? 'status-alert' : '';
          let CheckAlert =
            row.DmCheckResult == 'REJECT' || row.DmAltCheckResult == 'REJECT'
              ? 'status-alert'
              : '';
          let ApproveAlert =
            row.DmApproveResult == 'REJECT' ||
            row.DmAltApproveResult == 'REJECT'
              ? 'status-alert'
              : '';
          let QaAlert =
            row.CheckQaResult == 'REJECT' && !row.QaUserId
              ? 'status-alert'
              : '';
          let ResultAlert = row.DmCheckResult == 'PASS' ? 'status-alert' : '';

          let printTag = row.TagTime ? '<i class="fa fa-check"></i>' : '';
          let overdue =
            datediff(row.InjDate, getDateTimeLocal()) >= 0
              ? '<i class="fa fa-exclamation"></i>'
              : '';
          if (data == 1) {
            return `<span class="d-block status ${Alert} status-request">REQUEST${overdue}</span>`;
          } else if (data == 2) {
            return `<span class="d-block status status-receive">RECEIVE${overdue}</span>`;
          } else if (data == 3) {
            return `<span class="d-block status ${Alert} ${CheckAlert} status-repair">IN PROGRESS${overdue}</span>`;
          } else if (data == 4) {
            return `<span class="d-block status ${ApproveAlert} status-check">WAIT CHECK${overdue}</span>`;
          } else if (data == 5) {
            return `<span class="d-block status status-approve">WAIT APPROVE${overdue}</span>`;
          } else if (data == 6) {
            return `<span class="d-block status ${QaAlert} status-result">WAIT RESULT${printTag}${overdue}</span>`;
          } else if (data == 7) {
            return `<span class="d-block status ${ResultAlert} status-result-alt">WAIT RESULT${printTag}${overdue}</span>`;
          } else if (data == 8) {
            return `<span class="d-block status status-finish ">FINISH${printTag}${overdue}</span>`;
          }
        },
      },
      {
        width: '20%',
        data: 'InjDate',
        // render: function (data, type, row) {
        //   if (data) return `<span class="text-nowrap">${data.replace(" ", "<br/>")}</span>`;
        //   else return "-";
        // },
      },
      {
        width: '30%',
        data: 'MoldName',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start fw-bold">${data}</span></div>`;
        },
      },
      {
        width: '35%',
        data: 'Detail',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      { data: 'StatusId' },
      { data: 'Section' },
    ],
    initComplete: () => {
      if (!isRequest.length) {
        // no request
        stopSound();
      }
    },
  });
}
async function fillRepairOrderDetail(StatusBoardId, Section) {
  let Status = await AjaxGetData(`/repair/status/${Section}`);
  let StatusArr = [1, 2, 3, 4, 5, 6, 7, 8];
  Status.forEach((code) => {
    let { StatusId, StatusCount } = code;
    StatusArr = StatusArr.filter((e) => e != StatusId);
    $(`${StatusBoardId} .status-card`)
      .eq(StatusId - 1)
      .find('.card-text')
      .text(StatusCount);
  });
  StatusArr.forEach((StatusId) =>
    $(`${StatusBoardId} .status-card`)
      .eq(StatusId - 1)
      .find('.card-text')
      .text(0)
  );
}

function autoRefresh() {
  fillRepairOrderList('#RepairOrder1', Filters[1]);
  fillRepairOrderList('#RepairOrder2', Filters[2]);
  fillRepairOrderList('#RepairOrder3', Filters[3]);
  fillRepairOrderList('#RepairOrder4', Filters[4]);
}
function notifyRefresh() {
  getNotify();
}
// setInterval('autoRefresh()', 1000 * 60);
// setInterval('notifyRefresh()', 1000 * 60 * 30);

const socketio = () => {
  const socket = io.connect(socketHost, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 99999,
  });

  socket.on('connect', () => {
    console.log('connected');
    socket.emit('joinRoom', `RepairOrder`);
    socket.emit('joinRoom', `PmOrder`);
  });
  socket.on('reconnection_attempt', () => {
    console.log(`reconnecting`);
  });
  socket.on('reconnect', () => {
    console.log(`reconnect`);
    socket.emit('joinRoom', `RepairOrder`);
    socket.emit('joinRoom', `PmOrder`);
  });
  socket.on('connect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on('check-connect', (msg) => {
    console.log(msg);
  });
  socket.on('pm-notify', (msg) => {
    console.log(msg);
    getNotify();
  });

  socket.on('repair-update', (msg) => {
    console.log(msg);
    fillRepairOrderList('#RepairOrder1', Filters[1]);
    fillRepairOrderList('#RepairOrder2', Filters[2]);
    fillRepairOrderList('#RepairOrder3', Filters[3]);
    fillRepairOrderList('#RepairOrder4', Filters[4]);
  });
  socket.on('disconnect', () => {
    console.log('disconnectd');
    window.setTimeout(socket.connect(), 5000);
  });
};

const getNotify = async () => {
  let LoginUser = await getProfile();
  let LoginSection = LoginUser.Section ? LoginUser.Section : LoginUser.Username;
  if (LoginSection == 'guest') LoginSection = 'ALL';
  let Res = await fetch(`/pm/list_pm/${LoginSection}`);
  let PmList = await Res.json();
  $('.notify-box .dropdown-menu').empty();
  if (!PmList.length) {
    $('.notify-box').hide();
    return LoginSection;
  }
  $('.notify-box').show();
  $('.count-notify-box').text(PmList.length > 99 ? '99+' : PmList.length);
  for (let idx = 0; idx < PmList.length; idx++) {
    if (idx > 4) {
      let Other = PmList.length - idx;
      $('.notify-box .dropdown-menu')
        .append(`<div class="notify-text box-shadow my-1 p-2">
          <span class="text-center">+${Other} need PM</span>
      </div>`);
      break;
    }
    let {
      UpdatedTime,
      MoldSection,
      MoldName,
      MoldControlNo,
      OtherShot,
      CleaningShot,
      CleaningPlan,
      PreventiveShot,
      OtherPlan,
      PreventivePlan,
      CumulativeShot,
      LifeShot,
    } = PmList[idx];
    let msg = '';
    if (OtherPlan && OtherShot > OtherPlan * 0.8) msg = 'need Maintenance';
    if (CleaningPlan && CleaningShot > CleaningPlan * 0.8)
      msg = 'need Cleaning';
    if (PreventivePlan && PreventiveShot > PreventivePlan * 0.8)
      msg = 'need Preventive';
    if (LifeShot && CumulativeShot > LifeShot * 0.8) msg = 'need Change';
    $('.notify-box .dropdown-menu')
      .append(`<div class="notify-text box-shadow my-1 p-2">
        <span>${UpdatedTime}: ${MoldName}(${MoldSection}) ${msg}</span>
      </div>`);
  }
  return LoginSection;
};

$(document).ready(async () => {
  socketio();
  $SectionFilter.select2();
  let LoginSection = await getNotify();
  await filterDropdownNoAll('#Section1_Filter', Filters[1]);
  await filterDropdownNoAll('#Section2_Filter', Filters[2]);
  await filterDropdownNoAll('#Section3_Filter', Filters[3]);
  await filterDropdownNoAll('#Section4_Filter', LoginSection);
  fillRepairOrderList('#RepairOrder1', Filters[1]);
  fillRepairOrderList('#RepairOrder2', Filters[2]);
  fillRepairOrderList('#RepairOrder3', Filters[3]);
  fillRepairOrderList('#RepairOrder4', LoginSection);
  fillRepairOrderDetail(`#statusBoard1`, Filters[1]);
  fillRepairOrderDetail(`#statusBoard2`, Filters[2]);
  fillRepairOrderDetail(`#statusBoard3`, Filters[3]);
  fillRepairOrderDetail(`#statusBoard4`, LoginSection);
  $SectionFilter.on('change', (e) => {
    // $(`#${$(e.target).attr('for')}`).DataTable().column(5).search($(e.target).val()).draw();
    console.log($(e.target).val());
    let Target = $(e.target).attr('for');
    Filters[Target] = $(e.target).val().length ? $(e.target).val() : 'ALL';
    fillRepairOrderList(`#RepairOrder${Target}`, Filters[Target]);
    fillRepairOrderDetail(`#statusBoard${Target}`, Filters[Target]);
  });
});
