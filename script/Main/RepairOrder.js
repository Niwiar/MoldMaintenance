function dataURLtoBlob(dataURL) {
  var byteString = atob(dataURL.split(',')[1]);
  var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  var blob = new Blob([ab], { type: mimeString });
  return blob;
}
function uploadFilePNG(
  ajaxURL,
  dataURL,
  CheckFileName,
  FileName,
  Method = 'put'
) {
  return new Promise(async (resolve, reject) => {
    console.log('dataURL: ', dataURL);
    let FilePic = new FormData();
    for (let count = 0; count < dataURL.length; count++) {
      let ImgFile = dataURL[count];
      // console.log(ImgFile)
      console.log(FileName);
      FilePic.append(FileName, ImgFile, `${CheckFileName}_${count}`);
    }
    $.ajax({
      url: ajaxURL,
      method: Method,
      processData: false,
      contentType: false,
      data: FilePic,
      success: (res) => {
        let success = res.message;
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Upload',
          text: success,
          showConfirmButton: false,
          timer: 1500,
        });
        resolve(res.ImgArr);
      },
      error: (err) => {
        let error = err.responseJSON.message;
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Warning',
          text: error,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#FF5733',
        });
        reject(err);
      },
    });
  });
}
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

var RepairOrderList;
// Fill Table
function fillRepairOrderList(Section) {
  let isRequest = [];
  // console.log('Section: ',Section)
  if (Section.length == 0) Section = ['ALL'];
  RepairOrderList = $('#RepairOrderList').DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    lengthChange: false,
    ordering: false,
    info: false,
    autoWidth: false,
    dom: 'rtp',
    ajax: {
      url: `/repair/list/${Section}`,
      dataSrc: '',
    },
    columnDefs: [
      { orderData: [10, 1], targets: [0, 1] },
      {
        targets: [10],
        visible: false,
        searchable: false,
      },
    ],
    columns: [
      {
        width: '10%',
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
        width: '8%',
        data: 'InjDate',
        render: function (data, type, row) {
          if (data) return data.replace(' ', '<br/>');
          else return '-';
        },
      },
      {
        width: '5%',
        data: 'Section',
      },
      {
        width: '15%',
        data: 'MoldName',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start fw-bold">${data}</span></div>`;
        },
      },
      {
        width: '15%',
        data: 'SlipNo',
      },
      {
        width: '15%',
        data: 'Detail',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        width: '8%',
        data: 'RequestUser',
      },
      {
        width: '8%',
        data: 'RepairUser',
        render: function (data) {
          return data == null ? '-' : data;
        },
      },
      {
        width: '8%',
        data: 'RequestTime',
        render: function (data, type, row) {
          if (data) return data.replace(' ', '<br/>');
          else return '-';
        },
      },
      {
        width: '8%',
        data: 'FinishTime',
        render: function (data, type, row) {
          if (data) return data.replace(' ', '<br/>');
          else return '-';
        },
      },
      { data: 'StatusId' },
    ],
    initComplete: () => {
      if (!isRequest.length) {
        console.log('no request');
        stopSound();
      }
    },
  });
}
function tableNoData(id, col) {}
async function fillRepairOrderDetail(Section) {
  if (Section.length == 0) Section = ['ALL'];
  let Status = await AjaxGetData(`/repair/status/${Section}`);
  let StatusArr = [1, 2, 3, 4, 5, 6, 7, 8];
  Status.forEach((code) => {
    let { StatusId, StatusCount } = code;
    StatusArr = StatusArr.filter((e) => e != StatusId);
    $('#statusBoard .status-card')
      .eq(StatusId - 1)
      .find('.card-text')
      .text(StatusCount);
  });
  StatusArr.forEach((StatusId) =>
    $('#statusBoard .status-card')
      .eq(StatusId - 1)
      .find('.card-text')
      .text(0)
  );
}

let TechnicianList;
function fillTechnicianList(RepairId, Section) {
  TechnicianList = $('#TechnicianList').DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: false,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    order: [[1, 'desc']],
    ajax: {
      url: `/repair/repairtech/${RepairId}`,
      dataSrc: '',
    },
    columns: [
      {
        data: 'Technician',
      },
      {
        data: 'LoginTime',
      },
      {
        data: 'LogoutTime',
        render: function (data) {
          if (!data)
            return Section == 'DM'
              ? `<button class="btn btn-danger btn-sm" id="Signout_ReqBtn" type="button">ลงชื่อออก</button>`
              : '-';
          else return data;
        },
      },
    ],
  });
}

function DelMcTable(URL, tbId, method = 'delete') {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: URL,
        method: method,
        contentType: 'application/json',
        success: (res) => {
          let success = res.message;
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Deleted',
            text: success,
            showConfirmButton: false,
            timer: 1500,
          });
          tbId.ajax.reload(null, false);
        },
        error: (err) => {
          let error = err.responseJSON.message;
          console.log(err);
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Warning',
            text: error,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF5733',
          });
        },
      });
    }
  });
}

function searchRepairOrderList() {
  $('#RepairOrderList thead tr')
    .clone(true)
    .addClass('filters')
    .appendTo('#RepairOrderList thead');
  $('#RepairOrderList .filters th').each(function (i) {
    var title = $('#RepairOrderList thead th').eq($(this).index()).text();
    $(this).html(
      `<input class="form-control p-1" type="text" placeholder="${title}"/>`
    );
  });
  RepairOrderList.columns()
    .eq(0)
    .each(function (colIdx) {
      $('input', $('.filters th')[colIdx]).on('keyup change', function () {
        if (colIdx == 10) return;
        RepairOrderList.column(colIdx).search(this.value).draw();
      });
    });
}

function checkPointChecked(RepairId, Data) {
  $.ajax({
    url: `/repair/pointcheck_check/${RepairId}`,
    method: 'put',
    contentType: 'application/json',
    data: Data,
    success: (res) => {
      let success = res.message;
      Swal.fire({
        position: 'center',
        icon: 'success',
        title: success,
        showConfirmButton: false,
        timer: 700,
      });
    },
    error: (err) => {
      let error = err.responseJSON.message;
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Warning',
        text: error,
        showConfirmButton: true,
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF5733',
      });
    },
  });
}
const $File_Req = $('#DpFile_Req .dp-scrollY .preview-img');

const $SubmitBtn = $('#Submit_ReqBtn'),
  $CheckBtn = $('#Check_ReqBtn'),
  $CheckSubmitBtn = $('#CheckSubmit_ReqBtn'),
  $SaveSchedule = $('#Save_ScheduleBtn'),
  $SaveMfgSchedule = $('#Save_MfgScheduleBtn'),
  $SavePointcheck_Btn = $('#SavePointcheck_Btn'),
  $LoginBtn = $('#LoginBtn');
const RepairRequestModal = $('#RepairRequestModal'),
  RepairCheckModal = $('#PointCheckRepair'),
  RepairLoginModal = $('#RepairLogin'),
  LoginForm = $('#LoginForm'),
  RepairCheckForm = $('#RepairCheckForm');
const RepairCheckList = $('#RepairCheckList'),
  PreventiveCheckList = $('#PreventiveCheckList');
const DownmoldDiv = $('#downmoldDiv');

const PreventiveRadio = $('#TypePreventiveCheck'),
  ConnectiveRadio = $('#TypeConnectiveCheck'),
  RepairRadio = $('#TypeRepairCheck'),
  ProductionRadio = $('#TypeProductionCheck');

const $PointCheckField = $('#RepairCheckForm input'),
  $PointCheckTime = $('#StartCheck_Req, #StopCheck_Req, #TimeCheck_Req');

const $PrintBtn = $('#PrintTag_ReqBtn, #PrintOrder_ReqBtn');
const $RequestField = $(
  '#Date_Req,#Shot_Req,#MoldName_Req,#PartName_Req, #Mc_Req, #Problem_Req, #Detail_Req, #Reason_Req, #ScheduleInj_Req, #SchedulePart_Req'
);
const $InprogressFieid = $(
  "input[type='radio'][name='Cooling_Req'], input[type='radio'][name='Type_Req'], input[type='radio'][name='Source_Req'], #Problem_Req, #Detail_Req, #Reason_Req, #Shot_Req"
);
const $MoldCheckField = $('#Check1_Req, #Check2_Req');
const $TypeRadioField = $("input[type='radio'][name='Type_Req']");
const $ScheduleCheck = $(
  "input[type='radio'][name='ScheduleCheck_Req'], #Schedule_Req"
);
const $RadioField = $(
  "input[type='radio'][name='Cooling_Req'], input[type='radio'][name='Source_Req']"
);
const $QaField = $(
  "#TryDate_Req, #Remark_Req, input[type='radio'][name='Result_Req']"
);

function getRequestTemplate(UserId, Section) {
  $.ajax({
    url: `/repair/template/${UserId}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
  })
    .done((res) => {
      let { RequestTime, RequestUser, CheckMold } = res;
      $('#Date_Req').val(RequestTime);
      $('#Approved_Req').val(RequestUser);
      DownmoldDiv.html('');
      CheckMold.forEach((Downmold) => {
        let { CheckMoldId, CheckMoldNo, CheckMold } = Downmold;
        DownmoldDiv.append(`
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="Check${CheckMoldId}_Req"/>
                    <label class="form-check-label" for="Check${CheckMoldId}_Req" style="font-size: 12px">${CheckMoldNo}) ${CheckMold}</label>
                </div>`);
      });

      dropdownMold(Section);
      dropdownPart(1, Section);
      dropdownMc(1, Section);
      dropdownProblem();
    })
    .fail((err) => {
      $('#UserSection_ option, #UserSection_ optgroup').remove();
      $('#UserPosition_ option, #UserPosition_ optgroup').remove();
      $('#UserSection_, #UserPosition_').append(
        "<optgroup label='No data in database'></optgroup>"
      );
    });
}

function getRequestDetail(RepairId) {
  return new Promise(async (resolve, reject) => {
    $.ajax({
      url: `/repair/repair/${RepairId}`,
      method: 'get',
      contentType: 'application/json',
      dataType: 'json',
    })
      .done((res) => {
        return resolve(res);
      })
      .fail((err) => {
        // err
        reject(err);
      });
  });
}
const $PointCheckInput = $(
  '#CheckDetail_Req, #SparePart_Req, #StartCheck_Req, #StopCheck_Req, #TimeCheck_Req'
);

function getCheckPoint(RepairId, IndexProgress, OrderType) {
  return new Promise(async (resolve, reject) => {
    $.ajax({
      url: `/repair/pointcheck/${RepairId}&${IndexProgress}`,
      method: 'get',
      contentType: 'application/json',
      dataType: 'json',
    })
      .done((res) => {
        console.log(res);
        let {
          CheckText,
          CheckStart,
          CheckEnd,
          Checklist,
          FixDetail,
          SparePartSlip,
        } = res;
        CheckStart = CheckStart ? CheckStart : '-';
        CheckEnd = CheckEnd ? CheckEnd : '-';
        $PointCheckInput.val('');
        $('#CheckDetail_Req').val(FixDetail);
        $('#SparePart_Req').val(SparePartSlip);
        $('#StartCheck_Req').val(CheckStart);
        $('#StopCheck_Req').val(CheckEnd);
        $('#TimeCheck_Req').val(CheckText);
        $('#RepairCheckList div.col:nth-child(1)').html(
          '<p class="text-start mb-1" style="font-weight: bold"> รายละเอียดในการตรวจเช็คและประกอบ</p>'
        );
        $('#RepairCheckList div.col:nth-child(2)').html(
          '<p class="text-start mb-1">&nbsp;</p>'
        );
        $('#PreventiveCheckList div.col:nth-child(1)').html(
          '<p class="text-start mb-1" style="font-weight: bold"> รายละเอียดในการตรวจเช็ค</p>'
        );
        $('#PreventiveCheckList div.col:nth-child(2)').html(
          '<p class="text-start mb-1">&nbsp;</p>'
        );
        getPointCheckConnection(Checklist, OrderType);
        resolve(res);
      })
      .fail((err) => {
        reject(err);
      });
  });
}
function getPointCheckConnection(Checklist, OrderType) {
  let lastTopic = '',
    indexTopic = 0;
  for (let i = 0; i < Checklist.length; i++) {
    let { Checked, CheckListId, CheckListNo, CheckList, CheckTopic } =
      Checklist[i];
    let ColCheckPoint, CheckStatus, Check_TextDec, Disabled;
    if (Checked == 0) {
      CheckStatus = '';
      Check_TextDec = 'none';
      Disabled = '';
    } else if (Checked == 1) {
      CheckStatus = 'checked';
      Check_TextDec = 'none';
      Disabled = '';
    } else if (Checked == 2) {
      CheckStatus = '';
      Check_TextDec = 'line-through';
      Disabled = 'disabled';
    }
    if (OrderType == 4) {
      ColCheckPoint = indexTopic < 5 ? 1 : 2;
      if (lastTopic != CheckTopic) {
        indexTopic++;
        lastTopic = CheckTopic;
        $(`#PreventiveCheckList div.col:nth-child(${ColCheckPoint})`).append(
          `<p class="m-2" style=" font-weight: bold; text-decoration: underline; text-align: left; ">${CheckTopic}</p>`
        );
      }
      $(`#PreventiveCheckList div.col:nth-child(${ColCheckPoint})`).append(
        `<div class="form-check" style="text-align: left">
                  <input class="form-check-input" type="checkbox" value="${Checked}" id="Preventivetlist-${CheckListId}" ${CheckStatus}/>
                  <label class="form-check-label" style="text-decoration: ${Check_TextDec}" for="Preventivetlist-${CheckListId}">${CheckListNo}) ${CheckList}
                    <button class="btn btn-sm check-disable py-0 px-1" type="button"><i class="fa fa-ban"></i></button>
                  </label>
                </div >`
      );
    } else {
      let HalfChecklist = Checklist.length / 2;
      ColCheckPoint = i <= HalfChecklist ? 1 : 2;
      $(`#RepairCheckList div.col:nth-child(${ColCheckPoint})`).append(
        `<div class="form-check" style="text-align: left">
                  <input class="form-check-input" type="checkbox" value="${Checked}" id="RepairCheckList-${CheckListId}" ${CheckStatus} ${Disabled}/>
                  <label class="form-check-label" style="text-decoration: ${Check_TextDec}" for="RepairCheckList-${CheckListId}">${CheckListNo})  ${CheckList}
                    <button class="btn btn-sm check-disable py-0 px-1" type="button"><i class="fa fa-ban"></i></button>
                  </label>
                </div >`
      );
    }
  }
}
function finishRepair(RepairId, UserId, IndexProgress) {
  return new Promise(async (resolve, reject) => {
    $.ajax({
      url: `/repair/repair_finish/${RepairId}`,
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify({
        RepairUserId: UserId,
        IndexProgress: IndexProgress,
      }),
      success: async (res) => {
        callSwal(res.message, 'success', 'Success');
        TechnicianList.ajax.reload(null, false);
        $SigninGroup.hide();
        resolve(res);
      },
      error: (err) => {
        let error = err.responseJSON.message;
        callSwal(error);
        reject(err);
      },
    });
  });
}

function showHistory(History, RepairImg, StatusId) {
  // CHECK & APPROVE USER
  if (StatusId < 4) {
    // Not show
    $('#Dm_CheckGroup').hide();
    $('#Dm_ApproveGroup').hide();
  } else if (StatusId == 4) {
    // Sign Check
    $('#Dm_CheckGroup').show();
    $('#Dm_ApproveGroup').hide();
  } else {
    // Sign Check
    $('#Dm_CheckGroup').show();
    $('#Dm_ApproveGroup').show();
  }
  let {
    ScheduleHistory,
    ProgressHistory,
    CheckHistory,
    ApproveHistory,
    QaHistory,
  } = History;
  // console.log(ScheduleHistory, ProgressHistory, CheckHistory, ApproveHistory, QaHistory);
  let { ProgressImgHistory, InspectImgHistory, QaImgHistory } = RepairImg;
  // console.log('RepairImg: ',RepairImg)
  if (!ScheduleHistory.length) $('#ScheduleHistory_Req').hide();
  else {
    $('#ScheduleHistory_Req .dropdown-menu').html('');

    ScheduleHistory.forEach((Schedule) => {
      let { ScheduleResult, ScheduleDate, CreatedTime, ScheduleUser } =
        Schedule;
      let ResultTxt =
        ScheduleResult == 1 ? 'ทำได้ตามกำหนดการ' : 'ทำไม่ได้ตามกำหนดการ';
      if (ScheduleDate == '1900-01-01 00:00:00' || !ScheduleDate)
        ScheduleDate = '-';
      $('#ScheduleHistory_Req .dropdown-menu').append(`
        <div class="history-div p-2">
            <p class="fw-semibold m-0">Schedule BY: <span class="fw-normal">${ScheduleUser}</span></p>
            <p class="fw-semibold m-0">Create Time: <span class="fw-normal">${CreatedTime}</span></p>
            <p class="fw-semibold m-0">Result: <span class="fw-normal">${ResultTxt}</span></p>
            <p class="fw-semibold m-0">New Schedule: <span class="fw-normal">${ScheduleDate}</span></p>
        </div>`);
    });
    $('#ScheduleHistory_Req').show();
  }
  if (!ProgressHistory.length)
    $('#RepairHistory_Req,#InspectHistory_Req,#PointCheck_Req').hide();
  else {
    $('#RepairHistory_Req .dropdown-menu').html('');
    $('#InspectHistory_Req .dropdown-menu').html('');
    $('#PointCheck_Req').html(
      "<option value='' selected>การตรวจเช็คปัจจุบัน</option>"
    );
    ProgressHistory.forEach((Repair) => {
      let {
        IndexProgress,
        RepairFilePath,
        RepairStart,
        RepairEnd,
        RepairUser,
      } = Repair;
      // console.log("UploadUser: ", UploadUser);
      let HistoryIndex = IndexProgress;
      // History Progress
      let $Repair_History_div = $(`
        <div class="history-div p-2">
            <p class="fw-semibold m-0">Repair BY: <span class="fw-normal">${RepairUser}</span></p>
            <p class="fw-semibold m-0">Repair Time: <span class="fw-normal">${RepairStart} to ${RepairEnd}</span></p>
        </div>
      `).appendTo('#RepairHistory_Req .dropdown-menu');
      let $Repair_dp_scroll = $(`<div class="row dp-scrollY2"></div>`).appendTo(
        $Repair_History_div
      );
      if (RepairFilePath && RepairFilePath != null) {
        if (!RepairFilePath.includes('blank')) {
          $(`
            <div class="col preview-container">
              <div class="index-img">1</div>  
              <img  class="preview-img box-shadow" src="${RepairFilePath}"/>
              <button class="btn btn-lg preview-download" value="${IndexProgress} type="button"><i class="fa fa-download"></i></button>
            </div>
          `).appendTo($Repair_dp_scroll);
        }
      }
      if (ProgressImgHistory.length != 0) {
        let IndexImg = 1;
        ProgressImgHistory.forEach((ProgressImg) => {
          let { RepairFilePath, IndexProgress } = ProgressImg;
          if (HistoryIndex == IndexProgress) {
            $(`
              <div class="col preview-container">
                <div class="index-img">${IndexImg}</div>
                <img  class="preview-img box-shadow" src="${RepairFilePath}"/>
                <button class="btn btn-lg preview-download" value="${IndexProgress} type="button"><i class="fa fa-download"></i></button>
              </div>
            `).appendTo($Repair_dp_scroll);
            IndexImg++;
          }
        });
      }

      // History Inspect
      let $Inspect_History_div = $(`
        <div class="history-div p-2">
            <p class="fw-semibold m-0">Repair BY: <span class="fw-normal">${RepairUser}</span></p>
            <p class="fw-semibold m-0">Repair Time: <span class="fw-normal">${RepairStart} to ${RepairEnd}</span></p>
        </div>
      `).appendTo('#InspectHistory_Req .dropdown-menu');
      let $Inspect_dp_scroll = $(
        `<div class="row dp-scrollY2"></div>`
      ).appendTo($Inspect_History_div);
      if (InspectImgHistory.length != 0) {
        let IndexImg = 1;
        InspectImgHistory.forEach((InspectImg) => {
          let { InspectFilePath, IndexProgress } = InspectImg;
          if (HistoryIndex == IndexProgress) {
            $(`
              <div class="col preview-container">
                <div class="index-img">${IndexImg}</div>
                <img  class="preview-img box-shadow" src="${InspectFilePath}"/>
                <button class="btn btn-lg preview-download" value="${IndexProgress} type="button"><i class="fa fa-download"></i></button>
              </div>
            `).appendTo($Inspect_dp_scroll);
            IndexImg++;
          }
        });
      }
      $('#PointCheck_Req').append(
        `<option value='${IndexProgress}'>ประวัติการตรวจเช็ค: ${RepairEnd}</option>`
      );
    });
    $('#PointCheck_Req,#RepairHistory_Req').show();
  }
  if (!CheckHistory.length) $('#Dm_CheckHistory_Req').hide();
  else {
    $('#Dm_CheckHistory_Req .dropdown-menu').html('');
    CheckHistory.forEach((Check) => {
      let {
        DmCheckResult,
        DmAltCheckResult,
        DmCheckTime,
        DmAltCheckTime,
        DmCheckUser,
        DmAltCheckUser,
      } = Check;
      $('#Dm_CheckHistory_Req .dropdown-menu').append(`
          <div class="history-div p-2">
              <p class="fw-semibold m-0">CHECK BY: 
                <span class="fw-normal">${DmCheckUser || '-'}</span>
              </p>
              <p class="fw-semibold m-0">Result: 
                <span class="fw-normal">${
                  DmCheckResult || '-'
                }</span> Check Date: 
                <span class="fw-normal">${DmCheckTime || '-'}</span></p>
              <p class="fw-semibold m-0">ALT-CHECK BY: 
                <span class="fw-normal">${DmAltCheckUser || '-'}</span>
              </p>
              <p class="fw-semibold m-0">Result: 
                <span class="fw-normal">${
                  DmAltCheckResult || '-'
                }</span> Check Date: 
                <span class="fw-normal">${DmAltCheckTime || '-'}</span>
              </p>
          </div>`);
    });
    $('#Dm_CheckGroup').show();
    $('#Dm_CheckHistory_Req').show();
  }
  if (!ApproveHistory.length) $('#Dm_ApproveHistory_Req').hide();
  else {
    $('#Dm_ApproveHistory_Req .dropdown-menu').html('');
    ApproveHistory.forEach((Approve) => {
      let {
        DmApproveResult,
        DmAltApproveResult,
        DmApproveTime,
        DmAltApproveTime,
        DmApproveUser,
        DmAltApproveUser,
      } = Approve;
      $('#Dm_ApproveHistory_Req .dropdown-menu').append(
        `<div class="history-div p-2">
            <p class="fw-semibold m-0">Approve BY: 
              <span class="fw-normal">${DmApproveUser || '-'}</span>
            </p>
            <p class="fw-semibold m-0">Result: 
              <span class="fw-normal">${
                DmApproveResult || '-'
              }</span> Approve Date: 
              <span class="fw-normal">${DmApproveTime || '-'}</span>
            </p>
            <p class="fw-semibold m-0">ALT-Approve BY: 
              <span class="fw-normal">${DmAltApproveUser || '-'}</span>
            </p>
            <p class="fw-semibold m-0">Result: 
            <span class="fw-normal">${
              DmAltApproveResult || '-'
            }</span> Approve Date: 
            <span class="fw-normal">${DmAltApproveTime || '-'}</span>
            </p>
        </div>`
      );
    });
    $('#Dm_ApproveGroup').show();
    $('#Dm_ApproveHistory_Req').show();
  }
  if (!QaHistory.length) $('#QaHistory_Req').hide();
  else {
    $('#QaHistory_Req .dropdown-menu').html('');
    console.log('QaHistory: ', QaHistory);
    QaHistory.forEach((Qa) => {
      let { IndexQa, TryDate, QaResult, QaRemark, QaFilePath, QaTime, QaUser } =
        Qa;
      let HistoryIndex = IndexQa;
      if (!QaResult) return;
      let $Qa_History_div = $(
        `<div class="history-div p-2">
            <p class="fw-semibold m-0">QA CHECK BY: 
              <span class="fw-normal">${QaUser || '-'}</span>
            </p>
            <p class="fw-semibold m-0">Result: 
              <span class="fw-normal">${QaResult || '-'}</span> TRY DATE: 
              <span class="fw-normal">${TryDate || '-'}</span>
            </p>
            <p class="fw-semibold m-0">Remark: 
              <span class="fw-normal">${QaRemark || '-'}</span>
            </p>
            
          </div>`
      ).appendTo('#QaHistory_Req .dropdown-menu');
      let $Qa_dp_scroll = $('<div class="row dp-scrollY2"></div>').appendTo(
        $Qa_History_div
      );
      if (QaFilePath && QaFilePath != null) {
        $(`
          <div class="col preview-container">
            <div class="index-img">1</div>
            <img  class="preview-img box-shadow" src="${QaFilePath}"/>
            <button class="btn btn-lg preview-download" value="${IndexQa} type="button"><i class="fa fa-download"></i></button>
          </div>
        `).appendTo($Qa_dp_scroll);
      }
      if (QaImgHistory.length != 0) {
        let IndexImg = 1;
        QaImgHistory.forEach((QaImg) => {
          let { QaFilePath, IndexQa } = QaImg;
          if (HistoryIndex == IndexQa) {
            $(`
              <div class="col preview-container">
                <div class="index-img">${IndexImg}</div>
                <img  class="preview-img box-shadow" src="${QaFilePath}"/>
                <button class="btn btn-lg preview-download" value="${IndexQa} type="button"><i class="fa fa-download"></i></button>
              </div>
            `).appendTo($Qa_dp_scroll);
            IndexImg++;
          }
        });
      }
    });
    $('#QaHistory_Req').show();
  }
}
async function showPointCheckHistory(
  RepairId,
  StatusId,
  PointIndexProgress,
  IndexProgress,
  OrderType
) {
  if (
    StatusId == 3 &&
    (PointIndexProgress == IndexProgress || PointIndexProgress == '')
  ) {
    $('#CheckDetail_Req').removeAttr('disabled');
    $('#SparePart_Req').removeAttr('disabled');
    $CheckSubmitBtn.show();
    $('#SavePointcheck_Btn').show();
    await getCheckPoint(RepairId, IndexProgress, OrderType);
    showCheck(true);
  } else if (PointIndexProgress == '') {
    $('#CheckDetail_Req').attr('disabled', '');
    $('#SparePart_Req').attr('disabled', '');
    $CheckSubmitBtn.hide();
    $('#SavePointcheck_Btn').hide();
    await getCheckPoint(RepairId, IndexProgress, OrderType);
    showCheck(false);
  } else {
    $('#CheckDetail_Req').attr('disabled', '');
    $('#SparePart_Req').attr('disabled', '');
    $CheckSubmitBtn.hide();
    $('#SavePointcheck_Btn').hide();
    await getCheckPoint(RepairId, PointIndexProgress, OrderType);
    showCheck(false);
  }
}
function checkReject(Check, Approve, Qa) {
  $('#Dm_CheckReject,#Dm_ApproveReject,#Dm_QaReject').hide();
  let {
    DmCheckUser,
    DmCheckResult,
    DmCheckTime,
    DmCheckReason,
    DmAltCheckUser,
    DmAltCheckResult,
    DmAltCheckTime,
    DmAltCheckReason,
  } = Check;
  let {
    DmApproveUser,
    DmApproveResult,
    DmApproveTime,
    DmApproveReason,
    DmAltApproveUser,
    DmAltApproveResult,
    DmAltApproveTime,
    DmAltApproveReason,
  } = Approve;
  let { CheckQaUser, CheckQaResult, CheckQaTime, CheckQaReason } = Qa;
  if (DmCheckResult == 'REJECT' || DmAltCheckResult == 'REJECT') {
    $('#Dm_CheckReject').html('');
    $('#Dm_CheckReject').append(`
            <p class="fw-semibold m-0">CHECK BY: <span class="fw-normal">${
              DmCheckUser || '-'
            }</span></p>
            <p class="fw-semibold m-0">Result: <span class="fw-normal">${
              DmCheckResult || '-'
            }</span> Check Date: <span class="fw-normal">${
      DmCheckTime || '-'
    }</span></p>
            <p class="fw-semibold m-0">Reason: <span class="fw-normal">${
              DmCheckReason || '-'
            }</span></p>
            <p class="fw-semibold m-0">ALT-CHECK BY: <span class="fw-normal">${
              DmAltCheckUser || '-'
            }</span></p>
            <p class="fw-semibold m-0">Result: <span class="fw-normal">${
              DmAltCheckResult || '-'
            }</span> Check Date: <span class="fw-normal">${
      DmAltCheckTime || '-'
    }</span></p>
            <p class="fw-semibold m-0">Reason: <span class="fw-normal">${
              DmAltCheckReason || '-'
            }</span></p>
        `);
    $('#Dm_CheckReject').show();
  }
  if (DmApproveResult == 'REJECT' || DmAltApproveResult == 'REJECT') {
    $('#Dm_ApproveReject').html('');
    $('#Dm_ApproveReject').append(`
            <p class="fw-semibold m-0">Approve BY: <span class="fw-normal">${
              DmApproveUser || '-'
            }</span></p>
            <p class="fw-semibold m-0">Result: <span class="fw-normal">${
              DmApproveResult || '-'
            }</span> Approve Date: <span class="fw-normal">${
      DmApproveTime || '-'
    }</span></p>
            <p class="fw-semibold m-0">Reason: <span class="fw-normal">${
              DmApproveReason || '-'
            }</span></p>
            <p class="fw-semibold m-0">ALT-Approve BY: <span class="fw-normal">${
              DmAltApproveUser || '-'
            }</span></p>
            <p class="fw-semibold m-0">Result: <span class="fw-normal">${
              DmAltApproveResult || '-'
            }</span> Approve Date: <span class="fw-normal">${
      DmAltApproveTime || '-'
    }</span></p>
            <p class="fw-semibold m-0">Reason: <span class="fw-normal">${
              DmAltApproveReason || '-'
            }</span></p>
        `);
    $('#Dm_ApproveReject').show();
  }
  if (CheckQaResult == 'REJECT') {
    $('#Dm_QaReject').html('');
    $('#Dm_QaReject').append(`
      <p class="fw-semibold m-0">
        QA REJECT BY: <span class="fw-normal">${CheckQaUser}</span>
        Result: <span class="fw-normal">${CheckQaResult}</span>
      </p>
      <p class="fw-semibold m-0">
        Check Date: <span class="fw-normal">${CheckQaTime}</span>
        Reason: <span class="fw-normal">${CheckQaReason}</span>
      </p>`);
    $('#Dm_QaReject').show();
  }
}

function bindPreviewEvent(UserId) {
  $('.preview-download').unbind();
  $('.preview-download').on('click', (e) => {
    let ImgPath = $(e.target).html().includes('fa')
      ? $(e.target).siblings('img').attr('src')
      : $(e.target).parent().siblings('img').attr('src');
    window.open(`/repair/download_img/${ImgPath.replaceAll('/', '%2F')}`);
  });
  $('.preview-close').unbind();
  $('.preview-close').on('click', async (e) => {
    let ImgPath = $(e.target).html().includes('fa')
      ? $(e.target).siblings('img').attr('src')
      : $(e.target).parent().siblings('img').attr('src');
    let Data = JSON.stringify({
      ImgPath: ImgPath.replaceAll('/', '%2F'),
      UserId,
    });
    AjaxDeleteImage(`/repair/image/${Data}`)
      .then(() => $(e.target).parents('.preview-container').remove())
      .catch((err) => console.log(err));
  });
}

function showImg(RepairImg) {
  // console.log('show', RepairImg)
  let { OrderImg, ProgressImg, InspectImg, QaImg } = RepairImg;
  $('.dp-scrollY').empty();
  if (OrderImg.length != 0) {
    OrderImg.forEach((OrderImg, Num) => {
      let { IndexImg, ProblemFilePath } = OrderImg;
      $(`<div class="col preview-container"><div class="index-img">${
        Num + 1
      }</div><img id="preview-request${IndexImg}" class="preview-img box-shadow" src="${ProblemFilePath}" />
      <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>  
      </div>`).appendTo('#DpFile_Req .dp-scrollY');
    });
    console.log('Req_File: ', $('#DpFile_Req .dp-scrollY').children().length);
  } else {
    console.log('no OrderImg');
  }
  if (ProgressImg.length != 0) {
    ProgressImg.forEach((ProgressImg, Num) => {
      let { IndexImg, RepairFilePath } = ProgressImg;
      $(`<div class="col preview-container">
      <div class="index-img">${Num + 1}</div>
      <img id="preview-progress${IndexImg}" class="preview-img box-shadow" src="${RepairFilePath}" />
        <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>
        <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
        '#DpCheckFile_ReqBtn .dp-scrollY'
      );
    });
  } else {
    console.log('no ProgressImg');
  }

  if (InspectImg.length != 0) {
    InspectImg.forEach((InspectImg, Num) => {
      let { IndexImg, InspectFilePath } = InspectImg;
      $(`<div class="col preview-container"><div class="index-img">${
        Num + 1
      }</div><img id="preview-inspect${IndexImg}" class="preview-img box-shadow" src="${InspectFilePath}" />
      <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>  
      <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
        '#DpInspectFile_ReqBtn .dp-scrollY'
      );
    });
  } else {
    console.log('no InspectImg');
  }

  if (QaImg.length != 0) {
    QaImg.forEach((QaImg, Num) => {
      let { IndexImg, QaFilePath } = QaImg;
      $(`<div class="col preview-container"><div class="index-img">${
        Num + 1
      }</div><img id="preview-qa${IndexImg}" class="preview-img box-shadow" src="${QaFilePath}" />
      <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>  
      <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
        '#DpQaFile_ReqBtn .dp-scrollY'
      );
    });
  } else {
    console.log('no QaImg');
  }

  // console.log('show finish')
}
function showDetail(Data) {
  // console.log(Data)
  let {
    SlipNo,
    RequestUser,
    RequestTime,
    InjShot,
    MoldId,
    MoldControlNo,
    MoldName,
    PartId,
    PartNo,
    PartName,
    McName,
    Cavity,
    CoolingType,
    OrderType,
    InjDate,
    PartDate,
    ProblemId,
    ProblemSource,
    ProblemFilePath,
    Detail,
    Cause,
    CheckMold,
  } = Data;
  dropdownProblem(ProblemId);
  $('.SlipNo_Req').val(SlipNo);
  $('#Approved_Req').val(RequestUser);
  $('#Date_Req').val(RequestTime);
  $('#Shot_Req').val(InjShot);
  $('#MoldCtrl_Req').val(MoldControlNo);
  $('#MoldName_Req').val(`${MoldId}) ${MoldName}`);
  $('#PartName_Req').val(`${PartId}) ${PartName}`);
  $('#PartNo_Req').val(PartNo);
  $('#Mc_Req').val(McName);
  $('#Cavity_Req').val(Cavity);
  $(`input[type="radio"][name=Cooling_Req][value="${CoolingType}"]`).prop(
    'checked',
    true
  );
  $(`input[type="radio"][name=Type_Req][value="${OrderType}"]`).prop(
    'checked',
    true
  );
  $(
    `input[type="radio"][name=Source_Req][value="${ProblemSource.toUpperCase()}"]`
  ).prop('checked', true);
  $('#ScheduleInj_Req').val(InjDate);
  $('#SchedulePart_Req').val(PartDate);
  $('#Detail_Req').val(Detail);
  $('#Reason_Req').val(Cause);
  // $("#preview-request").attr("src", ProblemFilePath);

  DownmoldDiv.html('');
  CheckMold.forEach((Downmold) => {
    let { CheckMoldId, CheckMoldNo, CheckMold, Checked } = Downmold;
    let CheckedStatus;
    Checked == 1 ? (CheckedStatus = true) : (CheckedStatus = false);

    DownmoldDiv.append(`
    <div class="form-check">
        <input class="form-check-input" type="checkbox" id="Check${CheckMoldId}_Req" disabled checked ="${CheckedStatus}"/>
        <label class="form-check-label" for="Check${CheckMoldId}_Req" style="font-size: 12px">${CheckMoldNo}) ${CheckMold}</label>
    </div>`);
  });
  if (ProblemFilePath && !ProblemFilePath.includes('/blank')) {
    $(`<div class="col preview-container"><img id="preview-request" class="preview-img box-shadow" src="${ProblemFilePath}" />
      <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>  
      </div>`).appendTo('#DpFile_Req .dp-scrollY');
  }
}

const disableSelect = (Elm) => {
  $(`${Elm}`).attr('disabled', '');
  $(`${Elm} option`).remove();
  $(`${Elm} optgroup`).remove();
  $(`${Elm}`).append(
    "<option value=''><span>Please select mold..</span></option>"
  );
};
const callSwal = (txt, action = 'error', title = 'Warning') => {
  if (action == 'error') {
    Swal.fire({
      position: 'center',
      icon: 'warning',
      title: title,
      text: txt,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#FF5733',
    });
  } else if (action == 'success') {
    Swal.fire({
      position: 'center',
      icon: 'success',
      title: title,
      text: txt,
      showConfirmButton: false,
      timer: 1500,
    });
  }
};

const userSign = (RepairId, Action, Data) => {
  return new Promise(async (resolve, reject) => {
    // console.log(`/repair/${Action}/${RepairId}`);
    $.ajax({
      url: `/repair/${Action}/${RepairId}`,
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify(Data),
    })
      .done((res) => {
        // console.log(res);
        if (Action.includes('repair')) {
          callSwal(res.message, 'success', 'Success');
          TechnicianList.ajax.reload(null, false);
        } else if (Action.includes('qa')) {
          callSwal(res.message, 'success', 'Success');
          if (Action.includes('check')) {
            $QaField.attr('disabled', '');
            $('#QA_Req').val(res.Fullname);
            $('#DpQaUser_ReqBtn').hide();
          }
        } else if (Action.includes('check_pass')) {
          callSwal(res.message, 'success', 'Success');
          // console.log(Action, res);
          let { Fullname, isAlt, Time } = res;
          let prefix = `${isAlt ? 'Alt' : ''}`;
          $(`#Dm_${prefix}CheckUser_`).val(Fullname);
          $(`#Dm_${prefix}CheckTime_`).val(Time);
          $('.DpCheck_ReqBtn').hide();
          if (Data.StatusId == 7) {
            RepairRequestModal.modal('hide');
            fillRepairOrderList($('#Section_Filter').val());
            fillRepairOrderDetail($('#Section_Filter').val());
          }
        } else if (Action.includes('approve_pass')) {
          callSwal(res.message, 'success', 'Success');
          // console.log(Action, res);
          let { Fullname, isAlt, Time } = res;
          let prefix = `${isAlt ? 'Alt' : ''}`;
          $(`#Dm_${prefix}ApproveUser_`).val(Fullname);
          $(`#Dm_${prefix}ApproveTime_`).val(Time);
          $('.DpApprove_ReqBtn').hide();
          if (Data.StatusId == 7) {
            RepairRequestModal.modal('hide');
            fillRepairOrderList($('#Section_Filter').val());
            fillRepairOrderDetail($('#Section_Filter').val());
          }
        } else if (Action.includes('print')) {
          let urlDownload;
          urlDownload = Action.includes('doc')
            ? 'download_doc'
            : 'download_tag';
          $('#pdfDoc').replaceWith(
            `<object data="${res.message}" type="application/pdf" style="width: 100%;height:880px;" id="pdfDoc" title="RepairDoc"></object>`
          );
          $('#RepairDocument').modal('show');
          $('#dol_Btn').unbind();
          $('#dol_Btn').on('click', function () {
            window.open(`/repair/${urlDownload}/${RepairId}`);
          });
        } else {
          callSwal(res.message, 'success', 'Success');
          RepairRequestModal.modal('hide');
          fillRepairOrderList($('#Section_Filter').val());
          fillRepairOrderDetail($('#Section_Filter').val());
        }
        resolve(res);
      })
      .fail((err) => {
        callSwal(err.responseJSON.message);
      });
  });
};
const fillUser = (Action, Data, StatusId = 0) => {
  if (Action == 'check') {
    let { DmCheckTime, DmAltCheckTime, DmCheckUser, DmAltCheckUser } = Data;
    if (StatusId == 4 || StatusId == 7)
      DmCheckUser
        ? $('.DM_DpCheck_ReqBtn').hide()
        : $('.DM_DpCheck_ReqBtn').show();
    else $('.DM_DpCheck_ReqBtn').hide();

    $('#Dm_CheckUser_').val(DmCheckUser || '-');
    $('#Dm_CheckTime_').val(DmCheckTime || null);
    $('#Dm_AltCheckUser_').val(DmAltCheckUser || '-');
    $('#Dm_AltCheckTime_').val(DmAltCheckTime || null);
  } else if (Action == 'approve') {
    let { DmApproveTime, DmAltApproveTime, DmApproveUser, DmAltApproveUser } =
      Data;
    if (StatusId == 5 || StatusId == 7)
      DmApproveUser
        ? $('.DM_DpApprove_ReqBtn').hide()
        : $('.DM_DpApprove_ReqBtn').show();
    else $('.DM_DpApprove_ReqBtn').hide();
    $('#Dm_ApproveUser_').val(DmApproveUser || '-');
    $('#Dm_ApproveTime_').val(DmApproveTime || null);
    $('#Dm_AltApproveUser_').val(DmAltApproveUser || '-');
    $('#Dm_AltApproveTime_').val(DmAltApproveTime || null);
  } else if (Action == 'qa') {
    let { QaResult, QaRemark, TryDate, QaUser, QaFilePath } = Data;
    // console.log(Data);
    $('#TryDate_Req').val(TryDate || null);
    if (QaResult) {
      $(`input[type="radio"][name="Result_Req"][value="${QaResult}"]`).prop(
        'checked',
        true
      );
    } else {
      $(`input[type="radio"][name="Result_Req"]`).prop('checked', false);
    }

    $('#Remark_Req').val(QaRemark || '-');
    $('#QA_Req').val(QaUser || '-');
    if (StatusId <= 5 || StatusId == 8 || QaUser) {
      $SubmitBtn.show();
      $QaField.attr('disabled', '');
      $(
        '#DpQaUser_ReqBtn,#QaFile_ReqBtn, #DpQaFile_ReqBtn, #DpQaUser_RejectBtn'
      ).hide();
      if (QaUser && !$('#DpQaFile_ReqBtn .dp-scrollY').children().length == 0) {
        $('#DpQaFile_ReqBtn').show();
      }

      if (StatusId == 8) {
        $('#DpQaFile_ReqBtn .preview-close').hide();
        $('#DpQaFile_Req').text('ดูไฟล์ QA');
        $('#DpQaUser_RejectBtn').show();
        if (!$('#DpQaFile_ReqBtn .dp-scrollY').children().length == 0) {
          $('#DpQaFile_ReqBtn').show();
        }
      }
    } else {
      $('#DpQaFile_ReqBtn .preview-close').show();
      $QaField.removeAttr('disabled');
      $('#DpQaUser_RejectBtn').hide();
      $('#QaFile_ReqBtn, #DpQaFile_Req').show().text('แนบไฟล์ QA');
      $('#DpQaUser_ReqBtn,#QaFile_ReqBtn, #DpQaFile_ReqBtn').show();
    }
  } else if ((Action == 'dm') & (Data !== 'DM')) {
    $('.DM_DpCheck_ReqBtn, .DM_DpApprove_ReqBtn, #DpQaUser_RejectBtn').hide();
  }
};
const checkUser = (Data) => {
  return new Promise(async (resolve, reject) => {
    $.ajax({
      url: '/user/check',
      method: 'post',
      contentType: 'application/json',
      data: JSON.stringify(Data),
    })
      .done((user) => {
        resolve(user);
      })
      .fail((err) => {
        let error = err.responseJSON.message;
        callSwal(error);
        reject('error');
      });
  });
};

const showRequestField = (StatusId = 0, section = '') => {
  RepairLoginModal.modal('hide');
  showField(StatusId, section);
  showFile(StatusId, section);
  showUser(StatusId, section);
  if (StatusId == 0) {
    // REQUEST
    $SubmitBtn.text('ส่งคำสั่งซ่อม');
  } else if (StatusId == 1) {
    // Status Request
    $SubmitBtn.text('รับงาน');
  } else if (StatusId == 2) {
    // Status Receive
    $SubmitBtn.text('ดำเนินการ');
  } else if (StatusId == 3) {
    // Status In Progress
    $SubmitBtn.text('ตรวจสอบ');
  } else if (StatusId == 4) {
    // Status Check
    $SubmitBtn.text('ตรวจสอบสำเร็จ');
  } else if (StatusId == 5) {
    // Status Approve
    $SubmitBtn.text('อนุมัติสำเร็จ');
  } else if (StatusId == 6) {
    // Status Wait Result
    $SubmitBtn.text('จบงาน');
  } else if (StatusId == 7) {
    // Status Wait Result Alt
    $SubmitBtn.text('จบงาน');
  } else if (StatusId == 8) {
    // Status finish
    $SubmitBtn.text('ปิดงาน');
  }

  RepairRequestModal.modal('show');
};

const showField = (StatusId, section) => {
  // $QaField.attr("disabled", "");
  $PrintBtn.hide();
  if (StatusId == 0) {
    // REQUEST
    $('#SlipNoGroup').hide();
    $('#NoteTextDiv').show();
    $('#Cancel_ReqBtn').text('ยกเลิก');
    $('#RepairForm').trigger('reset');
    $RequestField.removeAttr('disabled');
    $TypeRadioField.prop('checked', false);
    $TypeRadioField.removeAttr('disabled');
    $RadioField.prop('checked', false);
    $RadioField.removeAttr('disabled');
    $MoldCheckField.removeAttr('disabled');
  } else {
    // OTHER
    $('#SlipNoGroup').show();
    $('#NoteTextDiv').hide();
    $('#Cancel_ReqBtn').text('ปิด');
    $RequestField.attr('disabled', '');
    $MoldCheckField.attr('disabled', '');
    $TypeRadioField.attr('disabled', '');
    $RadioField.attr('disabled', '');
  }
  StatusId < 1 ? $('#ReceiveGroup').hide() : $('#ReceiveGroup').show();
  StatusId <= 3 ? $CheckBtn.hide() : $CheckBtn.show();
  if (StatusId == 6 || StatusId == 7) {
    $PrintBtn.show();
  }
  if (StatusId == 8) $('#PrintOrder_ReqBtn').show();
};

/* -------------------------- FILE -------------------------- */
const showFile = (StatusId, section) => {
  $('#File_ReqBtn').unbind();
  $('#CheckFile_ReqBtn').unbind();
  $('#QaFile_ReqBtn').unbind();
  // History
  if (StatusId == 0) {
    $(
      'ScheduleHistory_Req, #RepairHistory_Req, #InspectHistory_Req, #CheckHistory_Req, #ApproveHistory_Re, #QaHistory_Re'
    ).hide();
  }
  // REQUEST FILE
  if (StatusId == 0) {
    $('#File_ReqBtn, #DpFile_ReqBtn').text('แนบไฟล์แจ้งซ่อม');
    $('#File_ReqBtn, #DpFile_ReqBtn').show();
    $('#File_ReqBtn').on('click', function () {
      $('#File_Req').click();
    });
  } else {
    if ($('#DpFile_Req .dp-scrollY').children().length == 0) {
      $('#DpFile_ReqBtn').hide();
    } else {
      $('#File_ReqBtn, #DpFile_ReqBtn').text('ดูไฟล์แจ้งซ่อม');
      $('#DpFile_ReqBtn').show();
      $('#File_ReqBtn').hide();
    }
  }
  // CHECK FILE
  if (StatusId <= 2) {
    $('#DpCheckFile_ReqBtn, #DpInspectFile_ReqBtn').hide();
  } else if (StatusId == 3) {
    $('#CheckFile_ReqBtn, #DpCheckFile_Req').text('แนบไฟล์การซ่อม');
    $('#CheckFile_ReqBtn, #DpCheckFile_ReqBtn').show();
    $('#CheckFile_ReqBtn').unbind();
    $('#CheckFile_ReqBtn').on('click', function () {
      $('#CheckFile_Req').click();
    });
    $('#InspectFile_ReqBtn, #DpInspectFile_Req').text('แนบไฟล์จุดตรวจสอบ');
    $('#InspectFile_ReqBtn, #DpInspectFile_ReqBtn').show();
    $('#InspectFile_ReqBtn').unbind();
    $('#InspectFile_ReqBtn').on('click', function () {
      $('#InspectFile_Req').click();
    });

    $('#DpCheckFile_ReqBtn .preview-close').show();
    $('#DpInspectFile_ReqBtn .preview-close').show();
  } else {
    $('#DpCheckFile_ReqBtn .preview-close').hide();
    $('#DpInspectFile_ReqBtn .preview-close').hide();
    if (!$('#DpCheckFile_ReqBtn .dropdown-menu .preview-container').length) {
      $('#DpCheckFile_ReqBtn').hide();
    } else {
      $('#CheckFile_ReqBtn, #DpCheckFile_Req').text('ดูไฟล์การซ่อม');
      $('#DpCheckFile_ReqBtn').show();
      $('#CheckFile_ReqBtn').hide();
    }
    if (!$('#DpInspectFile_ReqBtn .dropdown-menu .preview-container').length) {
      $('#DpInspectFile_ReqBtn').hide();
    } else {
      $('#InspectFile_ReqBtn, #DpInspectFile_Req').text('ดูไฟล์จุดตรวจสอบ');
      $('#DpInspectFile_ReqBtn').show();
      $('#InspectFile_ReqBtn').hide();
    }
  }
  // QA FILE
  $('#QaFile_ReqBtn').unbind();
  $('#QaFile_ReqBtn').on('click', function () {
    $('#QaFile_Req').click();
  });
};
/* -------------------------- USER -------------------------- */
const $TechGroup = $('#TechGroup');
const $SigninGroup = $('#SigninGroup');
const $CheckUser = $('#CheckUser_ReqBtn');
const $ApprovrUser = $('#ApproveUser_ReqBtn');
const $QaGroup = $('#QaGroup');
const $QaGroupBtn = $QaGroup.find('button');
const showUser = (StatusId, section) => {
  // TECH USER
  if (StatusId < 3) {
    // Not show
    $TechGroup.hide();
    $SigninGroup.hide();
  } else if (StatusId == 3) {
    // Show Table & Login
    $TechGroup.show();
    if (section == 'DM') $('#SigninGroup').show();
    else $('#SigninGroup').hide();
  } else {
    // ShowTable
    // $("#download_CheckBtn").show();
    $TechGroup.show();
    $SigninGroup.hide();
  }
  // QA USER
  if (StatusId == 6 || StatusId == 7 || StatusId == 8) {
    // Sign Qa
    $QaGroupBtn.show();
    $('#QaUser_ReqBtn').unbind();
  } else {
    // Disable
    $QaGroupBtn.hide();
  }
};

const showCheck = (editable = false) => {
  if (PreventiveRadio.prop('checked')) {
    $('#CheckListHead').text('Preventive');
    showCheckField(1, editable);
  } else if (ConnectiveRadio.prop('checked')) {
    $('#CheckListHead').text('Corrective');
    showCheckField(2, editable);
  } else if (RepairRadio.prop('checked')) {
    $('#CheckListHead').text('Repair');
    showCheckField(2, editable);
  } else if (ProductionRadio.prop('checked')) {
    $('#CheckListHead').text('Cleaning');
    showCheckField(2, editable);
  } else {
    $('#CheckListHead').text('Other');
    showCheckField(2, editable);
  }
  RepairCheckModal.modal('show');
};
const showCheckField = (StatusId = 1, editable) => {
  if (StatusId == 1) {
    RepairCheckList.hide();
    PreventiveCheckList.show();
  } else if (StatusId == 2) {
    PreventiveCheckList.hide();
    RepairCheckList.show();
  }
  console.log('editable', editable);
  if (editable) {
    $('.check-disable').show();
    // $("#RepairCheckForm input").removeAttr("checked");

    $('#RepairCheckForm input').removeAttr('disabled');
    if ($("#RepairCheckForm label[style='text-decoration: line-through']")) {
      let $Cancel_Input = $(
        "#RepairCheckForm label[style='text-decoration: line-through']"
      ).siblings();
      $Cancel_Input.attr('disabled', '');
    }
    $('#SavePointcheck_Btn').show();
    $PointCheckTime.attr('disabled', '');
    $CheckSubmitBtn.show();
  } else {
    // console.log("check false");
    $('.check-disable').hide();
    $('#SavePointcheck_Btn').hide();
    // $("#RepairCheckForm input").attr("checked", "");
    $('#RepairCheckForm input').attr('disabled', '');
    $CheckSubmitBtn.hide();
  }

  RepairCheckModal.modal('show');
};

const dropdownProblem = (ProblemId = 0) => {
  $.ajax({
    url: '/dropdown/problem',
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (!res.length) {
        $('#Problem_Req option').remove();
        $('#Problem_Req optgroup').remove();
        $('#Problem_Req').append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $('#Problem_Req option').remove();
        $('#Problem_Req optgroup').remove();
        $('#Problem_Req').append(
          `<option value=''><span>Please select problem..</span></option>`
        );
        res.forEach((obj) => {
          // console.log(ProblemId, obj.ProblemId)
          let ProblemSelected;
          ProblemSelected = obj.ProblemId == ProblemId ? 'selected' : '';
          $('#Problem_Req').append(
            `<option value='${obj.ProblemId}' ${ProblemSelected}> 
                        <span>${obj.ProblemNo}) ${obj.Problem}</span>
                      </option>`
          );
        });
      }
    },
    error: function (err) {
      $('#Problem_Req option').remove();
      $('#Problem_Req optgroup').remove();
      $('#Problem_Req').append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
};
const dropdownMold = (Section) => {
  $.ajax({
    url: `/dropdown/mold_section/${Section}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      // console.log("dpMold: ", res);
      if (res.length == 0) {
        $('#MoldName_ReqOpt option').remove();
        $('#MoldName_ReqOpt').append("<option value='No data'>");
        $('#MoldName_Req').attr('disabled', '');
      } else {
        $('#MoldName_ReqOpt option').remove();
        $('#MoldName_ReqOpt optgroup').remove();
        $('#MoldName_ReqOpt').append("<option value=''> ");
        res.forEach((obj) => {
          $('#MoldName_ReqOpt').append(
            `<option value='${obj.MoldId}) ${obj.MoldName}'>`
          );
        });
      }
    },
    error: function (err) {
      $('#MoldName_ReqOpt option').remove();
      $('#MoldName_ReqOpt').append("<option value='No data'>");
      $('#MoldName_Req').attr('disabled', '');
    },
  });
};
const dropdownPart = (StatusId = 1, Filter = 'PO') => {
  $.ajax({
    url:
      StatusId == 1
        ? `/dropdown/part_section/${Filter}`
        : `/dropdown/part/${Filter}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.length == 0) {
        $('#PartName_ReqOpt option').remove();
        $('#PartName_ReqOpt').append("<option value='No data'>");
        $('#PartName_Req').attr('disabled', '');
      } else {
        $('#PartName_ReqOpt option').remove();
        $('#PartName_ReqOpt optgroup').remove();
        $('#PartName_ReqOpt').append("<option value=''> ");
        res.forEach((obj) => {
          $('#PartName_ReqOpt').append(
            `<option value='${obj.PartId})  ${obj.PartName}'>`
          );
        });
      }
    },
    error: function (err) {
      $('#PartName_ReqOpt option').remove();
      $('#PartName_ReqOpt').append("<option value='No data'>");
      $('#PartName_Req').attr('disabled', '');
    },
  });
};
const dropdownMc = (StatusId = 1, Filter = 'PO') => {
  $.ajax({
    url:
      StatusId == 1
        ? `/dropdown/mc_section/${Filter}`
        : `/dropdown/mc/${Filter}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.length == 0) {
        $('#Mc_ReqOpt option').remove();
        $('#Mc_ReqOpt').append("<option value='No data'>");
        $('#Mc_Req').attr('disabled', '');
      } else {
        $('#Mc_ReqOpt option').remove();
        $('#Mc_ReqOpt optgroup').remove();
        $('#Mc_ReqOpt').append("<option value=''> ");
        res.forEach((obj) => {
          $('#Mc_ReqOpt').append(`<option value='${obj.McName}'>`);
        });
      }
    },
    error: function (err) {
      $('#Mc_ReqOpt option').remove();
      $('#Mc_ReqOpt').append("<option value='No data'>");
      $('#Mc_Req').attr('disabled', '');
    },
  });
};
const dropdownMoldDetail = (MoldId) => {
  $.ajax({
    url: `/dropdown/mold_detail/${MoldId}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      $('#MoldCtrl_Req').val(res.MoldControlNo);
      $('#Cavity_Req').val(res.MoldCavity);
    },
    error: function (err) {
      $('#MoldCtrl_Req').val('No Data');
      $('#Cavity_Req').val('No Data');
    },
  });
};
const dropdownPartDetail = (PartId) => {
  $.ajax({
    url: `/dropdown/part_detail/${PartId}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      $('#PartNo_Req').val(res.PartNo);
    },
    error: function (err) {
      $('#PartNo_Req').val('No Data');
    },
  });
};

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
    fillRepairOrderList($('#Section_Filter').val());
    fillRepairOrderDetail($('#Section_Filter').val());
    // if (msg == 'alert') playSound()
  });
  socket.on('disconnect', () => {
    console.log('disconnectd');
    window.setTimeout(socket.connect(), 5000);
  });
};

function autoRefresh() {
  fillRepairOrderList($('#Section_Filter').val());
  fillRepairOrderDetail($('#Section_Filter').val());
}
function notifyRefresh() {
  getNotify();
}
// setInterval('autoRefresh()', 1000 * 60);
// setInterval('notifyRefresh()', 1000 * 60 * 30);

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

  let LoginSection = await getNotify();
  // await filterDropdown("#Section_Filter", LoginSection);
  $('#Section_Filter').select2({
    placeholder: 'Please select section..',
  });
  await filterDropdownNoAll('#Section_Filter', LoginSection);

  fillRepairOrderList($('#Section_Filter').val());
  fillRepairOrderDetail($('#Section_Filter').val());
  searchRepairOrderList();
  $('#Section_Filter').on('change', (e) => {
    fillRepairOrderList($('#Section_Filter').val());
    fillRepairOrderDetail($('#Section_Filter').val());
  });
  $('#LoginPassword_Req').unbind();
  $('#LoginPassword_Req').on('keypress', function (e) {
    // If the user presses the "Enter" key on the keyboard
    if (e.key === 'Enter') {
      // Cancel the default action, if needed
      e.preventDefault();
      $LoginBtn.click();
    }
  });
  // Add Maintenance List
  $('#Repair_ReqBtn').unbind();
  $('#Repair_ReqBtn').on('click', function () {
    $('#DpQaFile_ReqBtn, #Edit_InprogressBtn, #Dm_QaReject').hide();
    $('#LoginPassword_Req').val('');
    $('.dp-scrollY').empty();
    RepairLoginModal.modal('show');
    let UserId, Section;
    $LoginBtn.unbind();
    $LoginBtn.on('click', async (e) => {
      let LoginData = {
        Userpass: $('#LoginPassword_Req').val(),
        Action: 'request',
      };
      let user = await checkUser(LoginData);
      if (user == 'error') return;
      UserId = user.UserId;
      Section = user.Section;
      getRequestTemplate(UserId, Section);

      showRequestField();
      $(
        '#ScheduleHistory_Req,#RepairHistory_Req,#InspectHistory_Req,#Dm_CheckHistory_Req,#Dm_ApproveHistory_Req,#QaHistory_Req'
      ).hide();
      $SubmitBtn.show();
      $QaField.attr('disabled', '');
      $('#OffSchedule_Req, #OnSchedule_Req, #Schedule_Req').attr(
        'disabled',
        ''
      );
      $('#Save_MfgScheduleBtn').hide();
      RepairLoginModal.modal('hide');
      $('#MoldName_Req').unbind();
      $('#PartName_Req').unbind();
      $('#MoldName_Req').on('keyup change', () => {
        let MoldId = $('#MoldName_Req').val().split(')')[0];
        dropdownMoldDetail(MoldId);
      });
      $('#PartName_Req').on('keyup change', () => {
        let PartId = $('#PartName_Req').val().split(')')[0];
        dropdownPartDetail(PartId);
      });
    });
    $('#File_Req').unbind();
    $('#File_Req').change(function (e) {
      for (let i = 0; i < this.files.length; i++) {
        var reader = new FileReader();
        reader.onload = function (e) {
          // get loaded data and render thumbnail.
          $(`<div class="col preview-container"><img id="preview-request${i}" class="preview-img box-shadow" src="${e.target.result}" />
          <button class="preview-request-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
            '#DpFile_Req .dp-scrollY'
          );
        };
        // read the image file as a data URL.
        reader.readAsDataURL(this.files[i]);
      }
      $('#DpFile_Req').unbind();
      $('#DpFile_Req').on('click', '.preview-request-close', async (e) => {
        console.log('delete pic');
        $(e.target).parents('.preview-container').remove();
      });
    });

    $('input[type="radio"][name="Type_Req"]').unbind();
    $('input[type="radio"][name="Type_Req"]').change((e) => {
      let Type = $('input[type="radio"][name="Type_Req"]:checked').val();
      Type == 3 || Type == 4
        ? $('input[type="radio"][name="Source_Req"][value="MOLD"]').prop(
            'checked',
            true
          )
        : $('input[type="radio"][name="Source_Req"][value="MOLD"]').prop(
            'checked',
            false
          );
      if (Type == 3) {
        $('#Problem_Req').val(19);
        let InputText = $(`#Problem_Req option[value='19'] span`).text();
        let Check = InputText.split(') ');
        if (isNaN(Check[0])) {
          $('#Detail_Req,#Reason_Req').val(Check[1]);
        }
      } else if (Type == 4) {
        $('#Problem_Req').val(21);
        let InputText = $(`#Problem_Req option[value='21'] span`).text();
        let Check = InputText.split(') ');
        if (isNaN(Check[0])) {
          $('#Detail_Req,#Reason_Req').val(Check[1]);
        }
      } else {
        $('#Problem_Req,#Detail_Req,#Reason_Req').val('');
      }
    });
    $('#Problem_Req').unbind();
    $('#Problem_Req').change((e) => {
      let value = $('#Problem_Req').val();
      let InputText = $(`#Problem_Req option[value='${value}'] span`).text();
      let Check = InputText.split(') ');
      if (isNaN(Check[0])) {
        $('#Detail_Req,#Reason_Req').val(Check[1]);
      }
    });
    $SubmitBtn.unbind();
    $SubmitBtn.on('click', () => {
      console.log('ส่งคำสั่งซ่อม');
      let MoldCheckList = [];
      let DownmoldList = DownmoldDiv.children();
      for (let downmold = 0; downmold < DownmoldList.length; downmold++) {
        let checkbox = $(DownmoldList[downmold]).find('input[type="checkbox"]');
        let Checked = $(checkbox).is(':checked') ? 1 : 0;
        let CheckMoldId = checkbox
          .attr('id')
          .split('_')[0]
          .replace('Check', '');
        let [CheckMoldNo, CheckMold] = $(DownmoldList[downmold])
          .find('label')
          .text()
          .split(') ');
        MoldCheckList.push({ CheckMoldId, CheckMoldNo, CheckMold, Checked });
      }
      let count_Pic = $('#DpFile_Req .dp-scrollY').children().length;
      let RequestPic = new FormData();
      for (let i = 0; i < count_Pic; i++) {
        let blob = dataURLtoBlob(
          $($('#DpFile_Req .dp-scrollY .preview-container img')[i]).attr('src')
        );
        RequestPic.append('orderimg', blob, `orderimg_${i}`);
      }
      let Data = {
        RequestUserId: UserId,
        RequestTime: $('#Date_Req').val().replace('T', ' '),
        MoldId: parseInt($('#MoldName_Req').val().split(')')[0]),
        PartId: parseInt($('#PartName_Req').val().split(')')[0]),
        McName: $('#Mc_Req').val(),
        Cavity: $('#Cavity_Req').val(),
        OrderType: $('input[type="radio"][name="Type_Req"]:checked').val() || 0,
        CoolingType:
          $('input[type="radio"][name="Cooling_Req"]:checked').val() || 0,
        InjDate: $('#ScheduleInj_Req').val().replace('T', ' '),
        PartDate: $('#SchedulePart_Req').val().replace('T', ' '),
        Detail: $('#Detail_Req').val(),
        Cause: $('#Reason_Req').val(),
        ProblemId: $('#Problem_Req').val(),
        ProblemSource:
          $('input[type="radio"][name="Source_Req"]:checked').val() || 0,
        InjShot: $('#Shot_Req').val(),
        MoldCheckList,
        IsOther: 0,
      };
      // console.log(Data);
      $.ajax({
        url: `/repair/request/${JSON.stringify(Data).replaceAll('/', '%2F')}`,
        method: 'post',
        processData: false,
        contentType: false,
        data: RequestPic,
        success: (res) => {
          let success = res.message;
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Created',
            text: success,
            showConfirmButton: false,
            timer: 1500,
          });
          fillRepairOrderList($('#Section_Filter').val());
          fillRepairOrderDetail($('#Section_Filter').val());
          RepairRequestModal.modal('hide');
        },
        error: (err) => {
          let error = err.responseJSON.message;
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Warning',
            text: error,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF5733',
          });
        },
      });
    });
  });

  // Click Table
  $('#RepairOrderList tbody').unbind();
  $('#RepairOrderList tbody').on('click', 'tr', function () {
    let row = $(this).closest('tr');
    let { StatusId, RepairId } = RepairOrderList.row(row).data();
    let UserId,
      Section,
      Index = {
        IndexProgress: 0,
        IndexCheck: 0,
        IndexApprove: 0,
        IndexQa: 0,
      };
    let OrderType;
    $('#LoginPassword_Req').val('');
    RepairLoginModal.modal('show');
    $LoginBtn.unbind();
    $LoginBtn.on('click', async () => {
      let LoginData = {
        Userpass: $('#LoginPassword_Req').val(),
      };
      let user = await checkUser(LoginData);
      if (user == 'error') return;

      UserId = user.UserId;
      Section = user.Section;
      let res = await getRequestDetail(RepairId);

      OrderType = res.OrderType;
      let { Schedule, Progress, Check, Approve, Qa, RepairImg } = res;
      let { IndexProgress, RepairFilePath, RepairEnd } = Progress;
      let { IndexCheck } = Check;
      let { IndexApprove } = Approve;
      let { IndexQa, QaFilePath } = Qa;
      Index = {
        IndexProgress,
        IndexCheck,
        IndexApprove,
        IndexQa,
      };
      showImg(RepairImg);

      if (RepairFilePath) {
        $(`<div class="col preview-container"><img id="preview-progress" class="preview-img box-shadow" src="${RepairFilePath}" />
          <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>
          <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
          '#DpCheckFile_ReqBtn .dropdown-menu .row'
        );
      }

      if (QaFilePath) {
        $(`<div class="col preview-container"><img id="preview-qa" class="preview-img box-shadow" src="${QaFilePath}" />
          <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>  
          <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
          '#DpQaFile_ReqBtn .dp-scrollY'
        );
      }

      showDetail(res);
      showHistory(res, RepairImg, StatusId);
      checkReject(Check, Approve, Qa);
      fillUser('check', Check, StatusId);
      fillUser('approve', Approve, StatusId);
      fillUser('qa', Qa, StatusId);
      fillUser('dm', Section, StatusId);
      fillTechnicianList(RepairId, Section);
      showRequestField(StatusId, Section);
      bindPreviewEvent(UserId);

      // fill request detail
      // if have history show history else hide history
      // if section is null hide section

      if (StatusId == 2 || StatusId >= 4) {
        $SubmitBtn.show();
        // console.log("sce hide");
        $('#Save_ScheduleBtn, #Save_MfgScheduleBtn').hide();
        $('#OffSchedule_Req, #OnSchedule_Req, #Schedule_Req').attr(
          'disabled',
          ''
        );
        if (!jQuery.isEmptyObject(Schedule)) {
          let { ScheduleDate, ScheduleResult } = Schedule;
          if (ScheduleResult == 0) {
            $(`input[type="radio"][name=ScheduleCheck_Req]`).prop(
              'checked',
              false
            );
            $('#Schedule_Req').val(null);
          } else {
            $(
              `input[type="radio"][name=ScheduleCheck_Req][value="${ScheduleResult}"]`
            ).prop('checked', true);
            ScheduleResult == 2
              ? $('#Schedule_Req').val(ScheduleDate)
              : $('#Schedule_Req').val(null);
          }
        } else {
          $(`input[type="radio"][name=ScheduleCheck_Req]`).prop(
            'checked',
            false
          );
          $('#Schedule_Req').val(null);
        }
      } else {
        // console.log("sce show");
        $('#Save_MfgScheduleBtn').hide();
        $SubmitBtn.show();
        $('#Save_ScheduleBtn').show();
        $('#OffSchedule_Req, #OnSchedule_Req, #Schedule_Req').removeAttr(
          'disabled'
        );
        if (!jQuery.isEmptyObject(Schedule)) {
          let { ScheduleDate, ScheduleResult } = Schedule;
          if (ScheduleResult == 0) {
            $SubmitBtn.hide();
            $(`input[type="radio"][name=ScheduleCheck_Req]`).prop(
              'checked',
              false
            );
            $('#Schedule_Req').val(null);
          } else {
            $(
              `input[type="radio"][name=ScheduleCheck_Req][value="${ScheduleResult}"]`
            ).prop('checked', true);
            ScheduleResult == 2
              ? $('#Schedule_Req').val(ScheduleDate)
              : $('#Schedule_Req').val(null);
            if (ScheduleResult == 1) $SubmitBtn.show();
            else {
              $SubmitBtn.hide();
              if (Section != 'DM') {
                $('#Save_MfgScheduleBtn').show();
                $('#ScheduleInj_Req,#SchedulePart_Req').removeAttr('disabled');
              }
            }
          }
        } else {
          $SubmitBtn.hide();
          $(`input[type="radio"][name=ScheduleCheck_Req]`).prop(
            'checked',
            false
          );
          $('#Schedule_Req').val(null);
        }
      }
      if (StatusId == 2 || StatusId == 3) {
        $InprogressFieid.removeAttr('disabled');
        if (StatusId == 3) {
          $('#RepairFinish_Btn').show();
          $TypeRadioField.attr('disabled', '');
        }
        $('#Edit_InprogressBtn').show();
      } else {
        $('#RepairFinish_Btn').hide();
        $InprogressFieid.attr('disabled', '');
        $('#Edit_InprogressBtn').hide();
      }
      if (Section != 'DM') {
        $('#Save_ScheduleBtn').hide();
        $('#OffSchedule_Req, #OnSchedule_Req, #Schedule_Req').attr(
          'disabled',
          ''
        );
        $InprogressFieid.attr('disabled', '');
        $('#Edit_InprogressBtn').hide();
        $SubmitBtn.hide();
        if (StatusId == 6 || StatusId == 7) {
          $SubmitBtn.show();
        }
      }
      // console.log("RepairEnd", RepairEnd);
      if (RepairEnd != null) {
        $('#SigninGroup').hide();
        $('#RepairFinish_Btn').hide();
      }
    });
    $SubmitBtn.unbind();
    // console.log(StatusId);
    if (StatusId == 1) {
      // REQ
      // next status
      $SaveMfgSchedule.unbind();
      $SaveMfgSchedule.on('click', () => {
        $.ajax({
          url: `/repair/schedule_mfg_save/${RepairId}`,
          method: 'put',
          contentType: 'application/json',
          data: JSON.stringify({
            ScheduleUserId: UserId,
            InjDate: $('#ScheduleInj_Req').val().replace('T', ' '),
            PartDate: $('#SchedulePart_Req').val().replace('T', ' '),
          }),
          success: (res) => {
            let success = res.message;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Created',
              text: success,
              showConfirmButton: false,
              timer: 1500,
            });
            if (
              $(
                'input[type="radio"][name="ScheduleCheck_Req"]:checked'
              ).val() == 1
            )
              $SubmitBtn.show();
          },
          error: (err) => {
            let error = err.responseJSON.message;
            callSwal(error);
          },
        });
      });

      $('#OffSchedule_Req').prop('checked')
        ? $('#Schedule_Req').removeAttr('disabled')
        : $('#Schedule_Req').attr('disabled', '');
      $('#OffSchedule_Req, #OnSchedule_Req').change(function () {
        if ($('#OffSchedule_Req').prop('checked')) {
          $('#Schedule_Req').removeAttr('disabled');
        } else {
          $('#Schedule_Req').attr('disabled', '');
          $('#Schedule_Req').val(null);
        }
      });
      $SaveSchedule.unbind();
      $SaveSchedule.on('click', () => {
        $.ajax({
          url: `/repair/schedule_save/${RepairId}`,
          method: 'put',
          contentType: 'application/json',
          data: JSON.stringify({
            ScheduleUserId: UserId,
            ScheduleResult: $(
              'input[type="radio"][name="ScheduleCheck_Req"]:checked'
            ).val(),
            ScheduleDate: $('#Schedule_Req').val().replace('T', ' '),
          }),
          success: (res) => {
            let success = res.message;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Created',
              text: success,
              showConfirmButton: false,
              timer: 1500,
            });
            if (
              $(
                'input[type="radio"][name="ScheduleCheck_Req"]:checked'
              ).val() == 1
            )
              $SubmitBtn.show();
            else $SubmitBtn.hide();
          },
          error: (err) => {
            let error = err.responseJSON.message;
            callSwal(error);
          },
        });
      });
      $SubmitBtn.on('click', () => {
        console.log('รับงาน');
        $.ajax({
          url: `/repair/receive/${RepairId}`,
          method: 'put',
          contentType: 'application/json',
          data: JSON.stringify({
            ReceiveUserId: UserId,
          }),
          success: (res) => {
            let success = res.message;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Created',
              text: success,
              showConfirmButton: false,
              timer: 1500,
            });
            fillRepairOrderList($('#Section_Filter').val());
            fillRepairOrderDetail($('#Section_Filter').val());
            RepairRequestModal.modal('hide');
          },
          error: (err) => {
            let error = err.responseJSON.message;
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Warning',
              text: error,
              showConfirmButton: true,
              confirmButtonText: 'OK',
              confirmButtonColor: '#FF5733',
            });
          },
        });
      });
    } else if (StatusId == 2) {
      // RECIVE
      $('#Edit_InprogressBtn').unbind();
      $('#Edit_InprogressBtn').on('click', function () {
        let url = `/repair/repair_edit/${RepairId}`;
        let Data = {
          EditUserId: UserId,
          Detail: $('#Detail_Req').val(),
          Cause: $('#Reason_Req').val(),
          ProblemId: $('#Problem_Req').val(),
          ProblemSource:
            $('input[type="radio"][name="Source_Req"]:checked').val() || 0,
          OrderType:
            $('input[type="radio"][name="Type_Req"]:checked').val() || 0,
          CoolingType:
            $('input[type="radio"][name="Cooling_Req"]:checked').val() || 0,
          InjShot: $('#Shot_Req').val(),
        };
        AjaxPut(url, RepairOrderList, Data);
      });
      // next status
      $SubmitBtn.on('click', () => {
        console.log('ดำเนินการ');
        $.ajax({
          url: `/repair/repair_start/${RepairId}`,
          method: 'put',
          contentType: 'application/json',
          data: JSON.stringify({
            RepairUserId: UserId,
          }),
          success: (res) => {
            let success = res.message;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Created',
              text: success,
              showConfirmButton: false,
              timer: 1500,
            });
            fillRepairOrderList($('#Section_Filter').val());
            fillRepairOrderDetail($('#Section_Filter').val());
            RepairRequestModal.modal('hide');
          },
          error: (err) => {
            let error = err.responseJSON.message;
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Warning',
              text: error,
              showConfirmButton: true,
              confirmButtonText: 'OK',
              confirmButtonColor: '#FF5733',
            });
          },
        });
      });
    } else if (StatusId == 3) {
      $('#InspectFile_Req').unbind();
      $('#InspectFile_Req').change(async function (e) {
        let Data = {
          IndexProgress: Index.IndexProgress,
          UploadUserId: UserId,
        };
        let ajaxUrl = `/repair/repair_inspect_upload/${RepairId}&${JSON.stringify(
          Data
        ).replaceAll('/', '%2F')}`;
        let Img = $('#InspectFile_Req').prop('files');
        // read the image file as a data URL.
        let ImgArr = await uploadFilePNG(
          ajaxUrl,
          Img,
          `check${Index.IndexProgress}`,
          'orderimg'
        );
        console.log(ImgArr);
        for (let count = 0; count < ImgArr.length; count++) {
          let { IndexImg, InspectFilePath } = ImgArr[count];
          $(`<div class="col preview-container"><img id="preview-inspect${IndexImg}" class="preview-img box-shadow" src="${InspectFilePath}" />
            <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>
            <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
            '#DpInspectFile_ReqBtn .dropdown-menu .row'
          );
        }
        bindPreviewEvent(UserId);

        $('#InspectFile_Req').val('');
      });
      $('#CheckFile_Req').unbind();
      $('#CheckFile_Req').change(async function (e) {
        let Data = {
          IndexProgress: Index.IndexProgress,
          UploadUserId: UserId,
        };
        let ajaxUrl = `/repair/repair_upload/${RepairId}&${JSON.stringify(
          Data
        ).replaceAll('/', '%2F')}`;
        let Img = $('#CheckFile_Req').prop('files');

        // read the image file as a data URL.
        let ImgArr = await uploadFilePNG(
          ajaxUrl,
          Img,
          `check${Index.IndexProgress}`,
          'orderimg'
        );
        console.log(ImgArr);
        for (let count = 0; count < ImgArr.length; count++) {
          let { IndexImg, RepairFilePath } = ImgArr[count];
          $(`<div class="col preview-container"><img id="preview-progress${IndexImg}" class="preview-img box-shadow" src="${RepairFilePath}" />
            <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>
            <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
            '#DpCheckFile_ReqBtn .dropdown-menu .row'
          );
        }
        bindPreviewEvent(UserId);

        $('#CheckFile_Req').val('');
      });
      $SaveMfgSchedule.unbind();
      $SaveMfgSchedule.on('click', () => {
        $.ajax({
          url: `/repair/schedule_mfg_save/${RepairId}`,
          method: 'put',
          contentType: 'application/json',
          data: JSON.stringify({
            ScheduleUserId: UserId,
            InjDate: $('#ScheduleInj_Req').val().replace('T', ' '),
            PartDate: $('#SchedulePart_Req').val().replace('T', ' '),
          }),
          success: (res) => {
            let success = res.message;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Created',
              text: success,
              showConfirmButton: false,
              timer: 1500,
            });
            if (
              $(
                'input[type="radio"][name="ScheduleCheck_Req"]:checked'
              ).val() == 1
            )
              $SubmitBtn.show();
          },
          error: (err) => {
            let error = err.responseJSON.message;
            callSwal(error);
          },
        });
      });

      $('#OffSchedule_Req').prop('checked')
        ? $('#Schedule_Req').removeAttr('disabled')
        : $('#Schedule_Req').attr('disabled', '');
      $('#OffSchedule_Req, #OnSchedule_Req').change(function () {
        if ($('#OffSchedule_Req').prop('checked')) {
          $('#Schedule_Req').removeAttr('disabled');
        } else {
          $('#Schedule_Req').attr('disabled', '');
          $('#Schedule_Req').val(null);
        }
      });
      $SaveSchedule.unbind();
      $SaveSchedule.on('click', () => {
        $.ajax({
          url: `/repair/schedule_save/${RepairId}`,
          method: 'put',
          contentType: 'application/json',
          data: JSON.stringify({
            ScheduleUserId: UserId,
            ScheduleResult: $(
              'input[type="radio"][name="ScheduleCheck_Req"]:checked'
            ).val(),
            ScheduleDate: $('#Schedule_Req').val().replace('T', ' '),
          }),
          success: (res) => {
            let success = res.message;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Created',
              text: success,
              showConfirmButton: false,
              timer: 1500,
            });
            if (
              $(
                'input[type="radio"][name="ScheduleCheck_Req"]:checked'
              ).val() == 1
            )
              $SubmitBtn.show();
            else $SubmitBtn.hide();
          },
          error: (err) => {
            let error = err.responseJSON.message;
            callSwal(error);
          },
        });
      });

      $('#TechPassword_Req').val('');
      // Technician Action
      $('#Signin_ReqBtn').unbind();
      $(document).unbind();
      $('#Signin_ReqBtn').on('click', async function () {
        let Userpass = $('#TechPassword_Req').val();
        // console.log(Userpass);
        await userSign(RepairId, 'repair_login', { Userpass });
      });
      $(document).on('click', '#Signout_ReqBtn', async function () {
        let tr = $(this).closest('tr');
        let { UserId } = TechnicianList.row(tr).data();
        await userSign(RepairId, 'repair_logout', { UserId });
      });
      $('#Edit_InprogressBtn').unbind();
      $('#Edit_InprogressBtn').on('click', function () {
        let url = `/repair/repair_edit/${RepairId}`;
        let Data = {
          EditUserId: UserId,
          Detail: $('#Detail_Req').val(),
          Cause: $('#Reason_Req').val(),
          ProblemId: $('#Problem_Req').val(),
          ProblemSource:
            $('input[type="radio"][name="Source_Req"]:checked').val() || 0,
          OrderType:
            $('input[type="radio"][name="Type_Req"]:checked').val() || 0,
          CoolingType:
            $('input[type="radio"][name="Cooling_Req"]:checked').val() || 0,
          InjShot: $('#Shot_Req').val(),
        };
        AjaxPut(url, RepairOrderList, Data);
      });
      $SubmitBtn.on('click', async function () {
        // Point Check
        console.log('ตรวจสอบ');

        await getCheckPoint(RepairId, Index.IndexProgress, OrderType);
        showCheck(true);

        // Repair Finish
        $('#RepairFinish_Btn').unbind();
        $('#RepairFinish_Btn').on('click', async () => {
          await finishRepair(RepairId, UserId, Index.IndexProgress, OrderType);
        });
        $SavePointcheck_Btn.unbind();
        $SavePointcheck_Btn.on('click', function () {
          $.ajax({
            url: `/repair/pointcheck_save/${RepairId}`,
            method: 'put',
            contentType: 'application/json',
            data: JSON.stringify({
              ScheduleUserId: UserId,
              IndexProgress: Index.IndexProgress,
              SparePartSlip: $('#SparePart_Req').val(),
              FixDetail: $('#CheckDetail_Req').val(),
            }),
            success: (res) => {
              let success = res.message;
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Created',
                text: success,
                showConfirmButton: false,
                timer: 1500,
              });
            },
            error: (err) => {
              let error = err.responseJSON.message;
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: 'Warning',
                text: error,
                showConfirmButton: true,
                confirmButtonText: 'OK',
                confirmButtonColor: '#FF5733',
              });
            },
          });
        });
        // PointCheck History
        $('#PointCheck_Req').unbind();
        $('#PointCheck_Req').on('change', async () => {
          let PointIndexProgress = $('#PointCheck_Req').val();
          await showPointCheckHistory(
            RepairId,
            StatusId,
            PointIndexProgress,
            Index.IndexProgress,
            OrderType
          );
        });
        //check point checked
        $(
          '#RepairCheckList .form-check-input, #PreventiveCheckList .form-check-input'
        ).unbind();
        $(
          '#RepairCheckList .form-check-input, #PreventiveCheckList .form-check-input'
        ).on('click', function () {
          let OldVal = $(this).val();
          if (OldVal == 0) $(this).val(1);
          if (OldVal == 1) $(this).val(0);
          let Data = JSON.stringify({
            IndexProgress: Index.IndexProgress,
            CheckListId: $(this).attr('id').split('-').pop(),
            Checked: $(this).val(),
          });
          checkPointChecked(RepairId, Data);
        });
        $('.check-disable').unbind();
        $('.check-disable').on('click', function () {
          let $CheckBoxLabel = $(this).parent();
          let $CheckBox = $CheckBoxLabel.siblings('input');
          if ($CheckBox.prop('disabled')) {
            $CheckBoxLabel.css('text-decoration', 'none');
            $CheckBox.removeAttr('disabled');
            $CheckBox.val(0);
          } else {
            $CheckBoxLabel.css('text-decoration', 'line-through');
            $CheckBox.attr('disabled', '');
            $CheckBox.prop('checked', false);
            $CheckBox.val(2);
          }
          let Data = JSON.stringify({
            IndexProgress: Index.IndexProgress,
            CheckListId: $CheckBox.attr('id').split('-').pop(),
            Checked: $CheckBox.val(),
          });
          checkPointChecked(RepairId, Data);
        });
        // next status
        $CheckSubmitBtn.unbind();
        $CheckSubmitBtn.on('click', function () {
          console.log('ตรวจสอบสำเร็จ');
          $.ajax({
            url: `/repair/pointcheck_finish/${RepairId}`,
            method: 'put',
            contentType: 'application/json',
            data: JSON.stringify({
              PointCheckUserId: UserId,
              IndexProgress: Index.IndexProgress,
            }),
            success: (res) => {
              let success = res.message;
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Created',
                text: success,
                showConfirmButton: false,
                timer: 1500,
              });
              fillRepairOrderList($('#Section_Filter').val());
              fillRepairOrderDetail($('#Section_Filter').val());
              RepairCheckModal.modal('hide');
              RepairRequestModal.modal('hide');
            },
            error: (err) => {
              let error = err.responseJSON.message.replaceAll('\n', '<br>');
              console.log(error);
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: 'Warning',
                html: error,
                showConfirmButton: true,
                confirmButtonText: 'OK',
                confirmButtonColor: '#FF5733',
              });
            },
          });
        });
      });
    } else if (StatusId == 4) {
      $CheckBtn.unbind();
      $CheckBtn.on('click', async function () {
        await getCheckPoint(RepairId, Index.IndexProgress, OrderType);
        showCheck();
        // PointCheck History
        $('#PointCheck_Req').unbind();
        $('#PointCheck_Req').on('change', async () => {
          let PointIndexProgress = $('#PointCheck_Req').val();
          await showPointCheckHistory(
            RepairId,
            StatusId,
            PointIndexProgress,
            Index.IndexProgress,
            OrderType
          );
        });
      });
      $(
        '#CheckRejectPassword_Req, #CheckPassword_Req, #Dm_CheckRejectPassword_Req, #Dm_CheckPassword_Req'
      ).val('');
      $(document).unbind();
      // DM CHECK REJECT
      $(document).on('click', '#Dm_CheckReject_ReqBtn', async function () {
        // console.log("dm check reject");
        let Userpass = $('#Dm_CheckRejectPassword_Req').val();
        let Reason = $('#Dm_CheckRejectReason_Req').val();
        await userSign(RepairId, 'check_reject', {
          Userpass,
          IndexCheck: Index.IndexCheck,
          Reason,
        });
      });
      // DM CHECK PASS
      $(document).on('click', '#Dm_CheckUser_ReqBtn', async function () {
        // console.log("dm check pass");
        let Userpass = $('#Dm_CheckPassword_Req').val();
        await userSign(RepairId, 'check_pass', {
          Userpass,
          IndexCheck: Index.IndexCheck,
        });
      });
      // Check Finish
      $SubmitBtn.on('click', async () => {
        await userSign(RepairId, 'check_finish', {
          CheckUserId: UserId,
          IndexCheck: Index.IndexCheck,
        });
      });
    } else if (StatusId == 5) {
      $CheckBtn.unbind();
      $CheckBtn.on('click', async function () {
        await getCheckPoint(RepairId, Index.IndexProgress, OrderType);
        showCheck();
        // PointCheck History
        $('#PointCheck_Req').unbind();
        $('#PointCheck_Req').on('change', async () => {
          let PointIndexProgress = $('#PointCheck_Req').val();
          await showPointCheckHistory(
            RepairId,
            StatusId,
            PointIndexProgress,
            Index.IndexProgress,
            OrderType
          );
        });
      });
      $(
        '#ApproveRejectPassword_Req, #ApprovePassword_Req, #Dm_ApproveRejectPassword_Req, #Dm_ApprovePassword_Req'
      ).val('');
      $(document).unbind();
      // DM APPROVE REJECT
      $(document).on('click', '#Dm_ApproveReject_ReqBtn', async function () {
        // console.log("dm approve reject");
        let Userpass = $('#Dm_ApproveRejectPassword_Req').val();
        let Reason = $('#Dm_ApproveRejectReason_Req').val();
        await userSign(RepairId, 'approve_reject', {
          Userpass,
          IndexApprove: Index.IndexApprove,
          Reason,
        });
      });
      // DM APPROVE PASS
      $(document).on('click', '#Dm_ApproveUser_ReqBtn', async function () {
        // console.log("dm approve pass");
        let Userpass = $('#Dm_ApprovePassword_Req').val();
        await userSign(RepairId, 'approve_pass', {
          Userpass,
          IndexApprove: Index.IndexApprove,
        });
      });
      // Approve Finish
      $SubmitBtn.on('click', async () => {
        await userSign(RepairId, 'approve_finish', {
          ApproveUserId: UserId,
          IndexApprove: Index.IndexApprove,
          IndexCheck: Index.IndexCheck,
        });
      });
    } else if (StatusId == 6) {
      $('#QaFile_Req').unbind();
      $('#QaFile_Req').change(async function (e) {
        let Data = {
          IndexQa: Index.IndexQa,
          UploadUserId: UserId,
        };
        let ajaxUrl = `/repair/qa_upload/${RepairId}&${JSON.stringify(
          Data
        ).replaceAll('/', '%2F')}`;
        let Img = $('#QaFile_Req').prop('files');

        // read the image file as a data URL.
        let ImgArr = await uploadFilePNG(
          ajaxUrl,
          Img,
          `check${Index.IndexQa}`,
          'orderimg'
        );
        console.log(ImgArr);
        for (let count = 0; count < ImgArr.length; count++) {
          let { IndexImg, QaFilePath } = ImgArr[count];
          $(`<div class="col preview-container"><img id="preview-qa${IndexImg}" class="preview-img box-shadow" src="${QaFilePath}" />
            <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>
            <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
            '#DpQaFile_ReqBtn .dp-scrollY'
          );
        }
        bindPreviewEvent(UserId);

        $('#QaFile_Req').val('');
      });
      $CheckBtn.unbind();
      $CheckBtn.on('click', async function () {
        await getCheckPoint(RepairId, Index.IndexProgress, OrderType);
        showCheck();
        // PointCheck History
        $('#PointCheck_Req').unbind();
        $('#PointCheck_Req').on('change', async () => {
          let PointIndexProgress = $('#PointCheck_Req').val();
          await showPointCheckHistory(
            RepairId,
            StatusId,
            PointIndexProgress,
            Index.IndexProgress,
            OrderType
          );
        });
      });
      $('#QaPassword_Req').val('');
      $(document).unbind();
      $(document).on('click', '#QaUser_ReqBtn', async function () {
        // console.log("qa pass");
        let Userpass = $('#QaPassword_Req').val();
        // QA PASS
        await userSign(RepairId, 'qa_check', {
          Userpass,
          IndexProgress: Index.IndexProgress,
          IndexQa: Index.IndexQa,
          TryDate: $('#TryDate_Req').val().replace('T', ' '),
          QaRemark: $('#Remark_Req').val(),
          QaResult:
            $('input[type="radio"][name="Result_Req"]:Checked').val() || 0,
        });
      });
      // PRINT TAG
      $('#PrintTag_ReqBtn').unbind();
      $('#PrintTag_ReqBtn').on('click', async function () {
        // RepairOrderList.ajax.reload(null, false);
        await userSign(RepairId, 'print_tag', { TagUserId: UserId });
      });
      // PRINT REPAIR ORDER
      $('#PrintOrder_ReqBtn').unbind();
      $('#PrintOrder_ReqBtn').on('click', async function () {
        // console.log("print order", RepairId);
        await userSign(RepairId, 'print_doc', { DocUserId: UserId });
      });
      // next status
      $SubmitBtn.on('click', async () => {
        console.log('จบงาน');
        await userSign(RepairId, 'finish', {
          FinishUserId: UserId,
          IndexApprove: Index.IndexApprove,
          IndexCheck: Index.IndexCheck,
          IndexQa: Index.IndexQa,
        });
      });
    } else if (StatusId == 7) {
      $('#QaFile_Req').unbind();
      $('#QaFile_Req').change(async function (e) {
        let Data = {
          IndexQa: Index.IndexQa,
          UploadUserId: UserId,
        };
        let ajaxUrl = `/repair/qa_upload/${RepairId}&${JSON.stringify(
          Data
        ).replaceAll('/', '%2F')}`;
        let Img = $('#QaFile_Req').prop('files');

        // read the image file as a data URL.
        let ImgArr = await uploadFilePNG(
          ajaxUrl,
          Img,
          `check${Index.IndexQa}`,
          'orderimg'
        );
        console.log(ImgArr);
        for (let count = 0; count < ImgArr.length; count++) {
          let { IndexImg, QaFilePath } = ImgArr[count];
          $(`<div class="col preview-container"><img id="preview-qa${IndexImg}" class="preview-img box-shadow" src="${QaFilePath}" />
            <button class="btn btn-lg preview-download" type="button"><i class="fa fa-download"></i></button>
            <button class="preview-close bg-danger" type="button"><i class="fa fa-remove"></i></button></div>`).appendTo(
            '#DpQaFile_ReqBtn .dp-scrollY'
          );
        }
        bindPreviewEvent(UserId);

        $('#QaFile_Req').val('');
      });
      $CheckBtn.unbind();
      $CheckBtn.on('click', async function () {
        await getCheckPoint(RepairId, Index.IndexProgress, OrderType);
        showCheck();
        // PointCheck History
        $('#PointCheck_Req').unbind();
        $('#PointCheck_Req').on('change', async () => {
          let PointIndexProgress = $('#PointCheck_Req').val();
          await showPointCheckHistory(
            RepairId,
            StatusId,
            PointIndexProgress,
            Index.IndexProgress,
            OrderType
          );
        });
      });
      $('#Dm_CheckRejectPassword_Req, #Dm_CheckPassword_Req').val('');
      $('#Dm_ApproveRejectPassword_Req, #Dm_ApprovePassword_Req').val('');
      $('#QaPassword_Req').val('');

      $(document).unbind();
      $(document).on('click', '#Dm_CheckReject_ReqBtn', async function () {
        // console.log("check reject");
        let Userpass = $('#Dm_CheckRejectPassword_Req').val();
        let Reason = $('#Dm_CheckRejectReason_Req').val();
        // RE-CHECK REJECT
        await userSign(RepairId, 'check_reject', {
          Userpass,
          IndexCheck: Index.IndexCheck,
          Reason,
        });
      });
      $(document).on('click', '#Dm_CheckUser_ReqBtn', async function () {
        // console.log("check pass");
        let Userpass = $('#Dm_CheckPassword_Req').val();
        // RE-CHECK PASS
        await userSign(RepairId, 'check_pass', {
          Userpass,
          IndexCheck: Index.IndexCheck,
          StatusId,
        });
      });
      $(document).on('click', '#Dm_ApproveReject_ReqBtn', async function () {
        // console.log("approve reject");
        let Userpass = $('#Dm_ApproveRejectPassword_Req').val();
        let Reason = $('#Dm_ApproveRejectReason_Req').val();
        // RE-APPROVE REJECT
        await userSign(RepairId, 'approve_reject', {
          Userpass,
          IndexApprove: Index.IndexApprove,
          Reason,
        });
      });
      $(document).on('click', '#Dm_ApproveUser_ReqBtn', async function () {
        console.log('approve pass');
        let Userpass = $('#Dm_ApprovePassword_Req').val();
        // RE-APPROVE PASS
        await userSign(RepairId, 'approve_pass', {
          Userpass,
          IndexApprove: Index.IndexApprove,
          StatusId,
        });
      });
      $(document).on('click', '#QaUser_ReqBtn', async function () {
        // console.log("qa pass");
        let Userpass = $('#QaPassword_Req').val();
        // QA PASS
        await userSign(RepairId, 'qa_check', {
          Userpass,
          IndexProgress: Index.IndexProgress,
          IndexQa: Index.IndexQa,
          TryDate: $('#TryDate_Req').val().replace('T', ' '),
          QaRemark: $('#Remark_Req').val(),
          QaResult:
            $('input[type="radio"][name="Result_Req"]:Checked').val() || 0,
        });
      });
      // PRINT TAG
      $('#PrintTag_ReqBtn').unbind();
      $('#PrintTag_ReqBtn').on('click', async function () {
        // console.log("print tags", RepairId);
        // let Printer = $('#TagPrinter_Req').val()
        await userSign(RepairId, 'print_tag', { TagUserId: UserId });
      });
      // PRINT REPAIR ORDER
      $('#PrintOrder_ReqBtn').unbind();
      $('#PrintOrder_ReqBtn').on('click', async function () {
        // console.log("print order", RepairId);
        await userSign(RepairId, 'print_doc', { DocUserId: UserId });
      });
      // finish
      $SubmitBtn.unbind();
      $SubmitBtn.on('click', async () => {
        // console.log("จบงาน");
        await userSign(RepairId, 'finish', {
          FinishUserId: UserId,
          IndexApprove: Index.IndexApprove,
          IndexCheck: Index.IndexCheck,
          IndexQa: Index.IndexQa,
        });
      });
    } else if (StatusId == 8) {
      $CheckBtn.unbind();
      $CheckBtn.on('click', async function () {
        await getCheckPoint(RepairId, Index.IndexProgress, OrderType);
        showCheck();
        // PointCheck History
        $('#PointCheck_Req').unbind();
        $('#PointCheck_Req').on('change', async () => {
          let PointIndexProgress = $('#PointCheck_Req').val();
          await showPointCheckHistory(
            RepairId,
            StatusId,
            PointIndexProgress,
            Index.IndexProgress,
            OrderType
          );
        });
      });
      // PRINT TAG
      $('#PrintTag_ReqBtn').unbind();
      $('#PrintTag_ReqBtn').on('click', async function () {
        // console.log("print tags", RepairId);
        // let Printer = $('#TagPrinter_Req').val()
        await userSign(RepairId, 'print_tag', { TagUserId: UserId });
      });
      // PRINT REPAIR ORDER
      $('#PrintOrder_ReqBtn').unbind();
      $('#PrintOrder_ReqBtn').on('click', async function () {
        // console.log("print order", RepairId);
        await userSign(RepairId, 'print_doc', { DocUserId: UserId });
      });
      // PASS QA
      $(document).unbind();
      $(document).on('click', '#QaUser_ReqBtn', async function () {
        // console.log("qa pass");
        let Userpass = $('#QaPassword_Req').val();
        await userSign(RepairId, 'qa_check', {
          Userpass,
          IndexProgress: Index.IndexProgress,
          IndexQa: Index.IndexQa,
          TryDate: $('#TryDate_Req').val().replace('T', ' '),
          QaRemark: $('#Remark_Req').val(),
          QaResult:
            $('input[type="radio"][name="Result_Req"]:Checked').val() || 0,
        });
        $('#RepairRequestModal').modal('hide');
        RepairOrderList.ajax.reload(null, false);
      });
      // Reject QA
      $(document).on('click', '#QaUser_RejectBtn', async function () {
        // console.log("approve reject");
        let Userpass = $('#QaPassword_Reject').val();
        let Reason = $('#QaReason_Reject').val();
        await userSign(RepairId, 'qa_reject', {
          Userpass,
          IndexQa: Index.IndexQa,
          Reason,
        });

        $('#RepairRequestModal').modal('hide');
        RepairOrderList.ajax.reload(null, false);
      });
      // finish
      $SubmitBtn.on('click', async () => {
        // console.log("ปิดงาน");
        await userSign(RepairId, 'complete', {
          FinishUserId: UserId,
          IndexApprove: Index.IndexApprove,
          IndexCheck: Index.IndexCheck,
          IndexQa: Index.IndexQa,
        });
      });
    }
  });
});
