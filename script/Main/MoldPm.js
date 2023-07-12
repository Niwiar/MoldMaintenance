let MoldActualList, tbActualHistory, tbPmHistory, tbCumulativeShot;

let ActCol = [
  { data: 'UpdatedTime' },
  { data: 'PartName' },
  { data: 'ActualShot' },
];
let PmHistoryCol = [
  { data: 'PmDate' },
  { data: 'PartName' },
  { data: 'InjShot' },
];
let CumulativeCol = [{ data: 'PartName' }, { data: 'CumulativeShot' }];
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
function fillMoldActualList(Section) {
  MoldActualList = $('#MoldActualList').DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    ordering: false,
    lengthChange: false,
    info: false,
    autoWidth: false,
    dom: 'rtp',
    ajax: {
      url: `/pm/list_pm/${Section}`,
      dataSrc: '',
    },
    columnDefs: [
      { orderData: [0, 11], targets: [0, 1] },
      {
        targets: [11],
        visible: false,
        searchable: false,
      },
    ],
    columns: [
      {
        data: 'MoldSection',
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: 'MoldName',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start fw-bold">${data}</span></div>`;
        },
      },
      {
        data: 'MoldControlNo',
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: 'CleaningPlan',
        render: function (data, type, row) {
          if (data == 0)
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center">-</span></div>`;
          else return data.toLocaleString();
        },
      },
      {
        data: 'CleaningShot',
        render: function (data, type, row) {
          if (data) {
            let textColor;
            let Plan = parseInt(row.CleaningPlan);
            let Warning = Plan * 0.01 * row.WarnPercent;
            let Danger = Plan * 0.01 * row.DangerPercent;
            if (data > Danger) textColor = 'text-alert';
            else if (data < Warning) textColor = '';
            else if (data == 0 || Plan == 0) {
              textColor = '';
              data = '-';
            } else textColor = 'text-warn';
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center ${textColor}">${data.toLocaleString()}</span></div>`;
          } else return '-';
        },
      },
      {
        data: 'PreventivePlan',
        render: function (data, type, row) {
          if (data == 0)
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center">-</span></div>`;
          else return data.toLocaleString();
        },
      },
      {
        data: 'PreventiveShot',
        render: function (data, type, row) {
          if (data) {
            let textColor;
            let Plan = parseInt(row.PreventivePlan);
            let Warning = Plan * 0.01 * row.WarnPercent;
            let Danger = Plan * 0.01 * row.DangerPercent;
            if (data > Danger) textColor = 'text-alert';
            else if (data < Warning) textColor = '';
            else if (data == 0 || Plan == 0) {
              textColor = '';
              data = '-';
            } else textColor = 'text-warn';
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center ${textColor}">${data.toLocaleString()}</span></div>`;
          } else return '-';
        },
      },
      {
        data: 'LifeShot',
        render: function (data, type, row) {
          if (data == 0)
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center">-</span></div>`;
          else return data.toLocaleString();
        },
      },
      {
        data: 'CumulativeShot',
        render: function (data, type, row) {
          if (data) {
            let textColor;
            let Plan = parseInt(row.LifeShot);
            let Warning = Plan * 0.01 * row.WarnPercent;
            let Danger = Plan * 0.01 * row.DangerPercent;
            if (data > Danger) textColor = 'text-alert';
            else if (data < Warning) textColor = '';
            else if (data == 0 || Plan == 0) {
              textColor = '';
              data = '-';
            } else textColor = 'text-warn';
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center ${textColor}">${data.toLocaleString()}</span></div>`;
          } else return '-';
        },
      },
      {
        data: 'OtherPlan',
        render: function (data, type, row) {
          if (data == 0)
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center">-</span></div>`;
          else return data.toLocaleString();
        },
      },
      {
        data: 'OtherShot',
        render: function (data, type, row) {
          if (data) {
            let textColor;
            let Plan = parseInt(row.OtherPlan);
            let Warning = Plan * 0.01 * row.WarnPercent;
            let Danger = Plan * 0.01 * row.DangerPercent;
            if (data > Danger) textColor = 'text-alert';
            else if (data < Warning) textColor = '';
            else if (data == 0 || Plan == 0) {
              textColor = '';
              data = '-';
            } else textColor = 'text-warn';
            return `<div class="d-flex justify-content-center align-item-center"><span class="text-center ${textColor}">${data.toLocaleString()}</span></div>`;
          } else return '-';
        },
      },
      {
        data: 'MoldId',
      },
    ],
  });
}

function searchMoldActualList() {
  $('#MoldActualList thead tr')
    .clone(true)
    .addClass('filters')
    .appendTo('#MoldActualList thead');
  $('#MoldActualList .filters th').each(function (e) {
    var title = $('#MoldActualList thead th').eq($(this).index()).text();
    $(this).html(
      `<input class="form-control p-1" type="text" placeholder="${title}"/>`
    );
  });
  MoldActualList.columns()
    .eq(0)
    .each(function (colIdx) {
      $('input', $('#MoldActualList .filters th')[colIdx]).on(
        'keyup change',
        function (e) {
          if (colIdx == 11) return;
          MoldActualList.column(colIdx).search(this.value).draw();
        }
      );
    });
}
const $SubmitBtn = $('#Submit_ReqBtn'),
  $LoginBtn = $('#LoginBtn');
const RepairRequestModal = $('#RepairRequestModal'),
  MoldShotDetailModal = $('#MoldShotDetailModal'),
  MoldShotModal = $('#MoldShotModal'),
  LoginModal = $('#RepairLogin'),
  UpdateActForm = $('#UpdateActForm');

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
        reject(error);
      });
  });
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
function showRequestBtn(btnId, Plan, Act, Warning) {
  if (Plan == 0) {
    $(`#${btnId}`).hide();
  } else {
    $(`#${btnId}`).show();
    Act <= Plan * 0.01 * Warning
      ? $(`#${btnId}`).hide()
      : $(`#${btnId}`).show();
  }
}
const dropdownMold = (Section, No) => {
  $.ajax({
    url: `/dropdown/mold_section/${Section}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.length == 0) {
        $(`#MoldName_ActOpt_0${No} option`).remove();
        $(`#MoldName_ActOpt_0${No}`).append(`<option value='No data'>`);
        $(`#MoldName_Req_0${No}`).attr(`disabled`, ``);
      } else {
        $(`#MoldName_ActOpt_0${No} option`).remove();
        $(`#MoldName_ActOpt_0${No} optgroup`).remove();
        $(`#MoldName_ActOpt_0${No}`).append(`<option value=''> `);
        res.forEach((obj) => {
          $(`#MoldName_ActOpt_0${No}`).append(
            `<option value='${obj.MoldId}) ${obj.MoldName}'/>`
          );
        });
      }
    },
    error: function (err) {
      $(`#MoldName_ActOpt_0${No} option`).remove();
      $(`#MoldName_ActOpt_0${No}`).append(`<option value='No data'>`);
      $(`#MoldName_Act_0${No}`).attr(`disabled`, ``);
    },
  });
};
const dropdownMoldDetail = (MoldId, No) => {
  $.ajax({
    url: `/dropdown/mold_detail/${MoldId}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      $(`#MoldCtrlNo_Act_0${No}`).val(res.MoldControlNo);
      $(`#Cavity_Act_0${No}`).val(res.MoldCavity);
    },
    error: function (err) {
      $(`#MoldCtrlNo_Act_0${No}`).val(`No Data`);
      $(`#Cavity_Act_0${No}`).val(`No Data`);
    },
  });
};
const dropdownMoldReq = (Section) => {
  $.ajax({
    url: `/dropdown/mold_section/${Section}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
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
const dropdownMoldDetailReq = (MoldId) => {
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
const dropdownPart = (StatusId = 1, Filter = 'PO', No) => {
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
        $(`#PartName_ActOpt_0${No} option`).remove();
        $(`#PartName_ActOpt_0${No}`).append(`<option value='No data'>`);
        $(`#PartName_Act_0${No}`).attr(`disabled`, ``);
      } else {
        $(`#PartName_ActOpt_0${No} option`).remove();
        $(`#PartName_ActOpt_0${No} optgroup`).remove();
        $(`#PartName_ActOpt_0${No}`).append(`<option value=''> `);
        res.forEach((obj) => {
          $(`#PartName_ActOpt_0${No}`).append(
            `<option value='${obj.PartId})  ${obj.PartName}'>`
          );
        });
      }
    },
    error: function (err) {
      $(`#PartName_ActOpt_0${No} option`).remove();
      $(`#PartName_ActOpt_0${No}`).append(`<option value='No data'>`);
      $(`#PartName_Act_0${No}`).attr(`disabled`, ``);
    },
  });
};
const dropdownPartDetail = (PartId, No) => {
  $.ajax({
    url: `/dropdown/part_detail/${PartId}`,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      $(`#PartNo_Act_0${No}`).val(res.PartNo);
    },
    error: function (err) {
      $(`#PartNo_Act_0${No}`).val(`No Data`);
    },
  });
};
const dropdownPartReq = (StatusId = 1, Filter = 'PO') => {
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
const dropdownPartDetailReq = (PartId) => {
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

const dropdownMcReq = (StatusId = 1, Filter = 'PO') => {
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
const dropdownProblemReq = (ProblemId = 0) => {
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

function getMoldRow(No = 1) {
  return `<div class="row MoldRow">
  <div class="col-12 col-sm-6 col-md-3">
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;">
              <label class="col-form-label fw-semibold p-0">Mold Name</label>
          </div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm mold-name-act" type="text" id="MoldName_Act_0${No}"
                  placeholder="Mold Name" style="width: 100%;" list="MoldName_ActOpt_0${No}">
          </div>
          <datalist id="MoldName_ActOpt_0${No}"></datalist>
      </div>
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;"><label class="col-form-label fw-semibold p-0"
                  >Mold Control No</label></div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm" type="text" id="MoldCtrlNo_Act_0${No}"
                  disabled="" placeholder="Mold Control No."></div>
      </div>
  
  </div>
  <div class="col-6 col-md-3">
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;"><label class="col-form-label fw-semibold p-0">Part
                  Name</label></div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm part-name-act" type="text" id="PartName_Act_0${No}"
                  placeholder="Part Name" list="PartName_ActOpt_0${No}">
              <datalist id="PartName_ActOpt_0${No}"></datalist>
          </div>
      </div>
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;"><label class="col-form-label fw-semibold p-0">Part
                  No.</label></div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm" type="text" id="PartNo_Act_0${No}"
                  disabled="" placeholder="Part No." style="width: 100%;"></div>
      </div>
  </div>
  <div class="col-6 col-sm-6 col-md-3">
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;"><label
                  class="col-form-label fw-semibold p-0">Cavity</label></div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm" type="text" id="Cavity_Act_0${No}"
                  placeholder="Cavity" disabled=""></div>
      </div>
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;"><label
                  class="col-form-label fw-semibold p-0">Production</label></div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm qty-prod" type="number" id="Qty_Prod_0${No}"
                  disabled="" placeholder="Production quantity">
          </div>
      </div>
  </div>
  <div class="col-6 col-sm-6 col-md-3">
      <div class="row">
          <div class="col-12 d-flex justify-content-center align-items-center"
              style="height: 30px;"><label
                  class="col-form-label fw-semibold p-0">Actual</label></div>
          <div class="col-12" style="height: 40px;"><input
                  class="form-control form-control-sm" type="number" id="Qty_Act_0${No}"
                  placeholder="Actual" disabled=""></div>
      </div>
  </div>
  </div>`;
}
function moldRowDataChange(UserId) {
  $('#MoldUpload_ActBtn').unbind();
  $('#MoldUpload_ActBtn').on('click', (e) => {
    $('#UploadFile_').click();
  });

  $('#UploadFile_').unbind();
  $('#UploadFile_').change(async function (e) {
    let ExFile = e.target.files[0];
    let Excel = new FormData();
    Excel.append('injshotfile', ExFile, 'injshotfile');
    $('#UploadFile_').val('');
    try {
      let res = await AjaxDataJsonUploadFile(
        `/pm/upload_injshot/${UserId}`,
        `post`,
        Excel
      );
      SwalAlert(res, 'Uploaded');
      MoldActualList.ajax.reload(null, false);
      MoldShotModal.modal('hide');
    } catch (error) {
      SwalAlert(error, 'Error');
    }
  });
  $('.mold-name-act').unbind();
  $('.mold-name-act').on('keyup change', (e) => {
    let MoldId = e.target.value.split(')')[0];
    let No = e.target.id.split('_0')[1];
    dropdownMoldDetail(MoldId, No);
    $(`#Qty_Prod_0${No},#Qty_Act_0${No}`).val('');
    MoldId != null
      ? $(`#Qty_Prod_0${No}`).removeAttr('disabled')
      : $(`#Qty_Prod_0${No}`).attr('disabled', '');
  });
  $('.part-name-act').unbind();
  $('.part-name-act').on('keyup change', (e) => {
    let PartId = e.target.value.split(')')[0];
    let No = e.target.id.split('_0')[1];
    dropdownPartDetail(PartId, No);
  });
  $('.qty-prod').unbind();
  $('.qty-prod').on('keyup change', (e) => {
    let No = e.target.id.split('_0')[1];
    let Qty_Prod = $(`#${e.target.id}`).val();
    let Cavity = $(`#Cavity_Act_0${No}`).val();
    let Qty_Act = Qty_Prod / Cavity;
    $(`#Qty_Act_0${No}`).val(Math.ceil(Qty_Act));
  });
  // ชื่อตัวแปร
  $('#Submit_ActBtn').unbind();
  $('#Submit_ActBtn').on('click', async () => {
    // เพิ่มช็อตแม่พิมพ์
    let MoldDetail = [];
    let Max = $('#MoldShotSection').children().length;
    for (let i = 1; i <= Max; i++) {
      MoldDetail.push({
        MoldId: $(`#MoldName_Act_0${i}`).val().split(')')[0],
        PartId: $(`#PartName_Act_0${i}`).val().split(')')[0],
        ActualShot: parseInt($(`#Qty_Act_0${i}`).val()),
      });
    }
    let data = {
      UpdateUserId: UserId,
      UpdateTime: $('#Date_Act').val().replace('T', ' '),
      MoldData: MoldDetail,
    };
    try {
      let res = await AjaxDataJson(`/pm/mold_injshot`, `post`, data);
      SwalAlert(res, 'Created');
      MoldActualList.ajax.reload(null, false);
      MoldShotModal.modal('hide');
    } catch (error) {
      SwalAlert(error, 'Error');
    }
  });
}
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
      $('#downmoldDiv').html('');
      CheckMold.forEach((Downmold) => {
        let { CheckMoldId, CheckMoldNo, CheckMold } = Downmold;
        $('#downmoldDiv').append(`
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="Check${CheckMoldId}_Req"/>
                    <label class="form-check-label" for="Check${CheckMoldId}_Req" style="font-size: 12px">${CheckMoldNo}) ${CheckMold}</label>
                </div>`);
      });

      dropdownPartReq(1, Section);
      dropdownMcReq(1, Section);
    })
    .fail((err) => {
      $('#UserSection_ option, #UserSection_ optgroup').remove();
      $('#UserPosition_ option, #UserPosition_ optgroup').remove();
      $('#UserSection_, #UserPosition_').append(
        "<optgroup label='No data in database'></optgroup>"
      );
    });
}
function sendRequest(RequestDetail, type) {
  let { UserId, Section, MoldId, MoldName } = RequestDetail;
  let IsOther;
  $('#RepairForm').trigger('reset');
  RepairRequestModal.modal('show');
  getRequestTemplate(UserId, Section);
  $('#MoldName_Req').val(MoldName);
  dropdownMoldDetailReq(MoldId);

  if (type == 'other') {
    IsOther = 1;
    $('input[type="radio"][name="Type_Req"]')
      .prop('checked', false)
      .removeAttr('disabled');
  } else if (type == 'clean') {
    IsOther = 2;
    $('input[type="radio"][name="Type_Req"]').attr('disabled', '');
    $('input[type="radio"][name="Type_Req"][value="3"]').prop('checked', true);
    $('input[type="radio"][name="Source_Req"][value="MOLD"]').prop(
      'checked',
      true
    );
    $('#Problem_Req').val(20);
    $('#Detail_Req,#Reason_Req').val('ล้างแม่พิมพ์ : ตามวาระ ( Shot )');
  } else if (type == 'prev') {
    IsOther = 3;
    $('input[type="radio"][name="Type_Req"]').attr('disabled', '');
    $('input[type="radio"][name="Type_Req"][value="4"]').prop('checked', true);
    $('input[type="radio"][name="Source_Req"][value="MOLD"]').prop(
      'checked',
      true
    );
    $('#Problem_Req').val(21);
    $('#Detail_Req,#Reason_Req').val('ครบกำหนด PREVENTIVE');
  }

  $('#PartName_Req').unbind();
  $('#PartName_Req').on('keyup change', () => {
    let PartId = $('#PartName_Req').val().split(')')[0];
    dropdownPartDetailReq(PartId);
  });

  $('#File_ReqBtn').unbind();
  $('#File_ReqBtn').on('click', function () {
    $('#File_Req').click();
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
      // delete pic
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
  $SubmitBtn.on('click', async () => {
    // ส่งคำสั่งซ่อม
    let MoldCheckList = [];
    let DownmoldList = $('#downmoldDiv').children();
    for (let downmold = 0; downmold < DownmoldList.length; downmold++) {
      let checkbox = $(DownmoldList[downmold]).find('input[type="checkbox"]');
      let Checked = $(checkbox).is(':checked') ? 1 : 0;
      let CheckMoldId = checkbox.attr('id').split('_')[0].replace('Check', '');
      let [CheckMoldNo, CheckMold] = $(DownmoldList[downmold])
        .find('label')
        .text()
        .split(') ');
      MoldCheckList.push({
        CheckMoldId,
        CheckMoldNo,
        CheckMold,
        Checked,
      });
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
      MoldId: MoldId,
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
      IsOther: IsOther,
    };
    RequestPic.append('Data', JSON.stringify(Data));

    try {
      let res = await AjaxDataJsonUploadFile(
        `/repair/request`,
        'post',
        RequestPic
      );
      SwalAlert(res, 'Request');
      tbPmHistory.ajax.reload(null, false);
      tbCumulativeShot.ajax.reload(null, false);
      MoldActualList.ajax.reload(null, false);
      MoldShotDetailModal.modal('hide');
      RepairRequestModal.modal('hide');
    } catch (error) {
      SwalAlert(error, 'Error');
    }
  });
}
const socketio = () => {
  const socket = io.connect(socketHost, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 99999,
  });

  socket.on('connect', () => {
    console.log('connected');
    socket.emit('joinRoom', `PmOrder`);
  });

  socket.on('reconnect', () => {
    console.log(`reconnect`);
    socket.emit('joinRoom', `PmOrder`);
  });
  socket.on('connect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on('check-connect', (msg) => {
    console.log(msg);
  });

  socket.on('pm-update', (msg) => {
    fillMoldActualList($('#Section').val());
  });
  socket.on('disconnect', () => {
    console.log('disconnectd');
    window.setTimeout(socket.connect(), 5000);
  });
};
$(async function () {
  fillMoldActualList('ALL');
  searchMoldActualList();
  socketio();
  try {
    let res = await AjaxDataJson('/dropdown/section/ALL', 'get');
    $('#Section').empty();
    if (res.length != 0) {
      $('#Section').append(
        `<option value="ALL" selected="">Please select section..</option>`
      );
      res.forEach((data) => {
        let { Section } = data;
        $('#Section').append(`<option value ="${Section}">${Section}</option>`);
      });
    } else $('#Section').append(`<option value ="No Data">No Data</option>`);
    let {} = res;
  } catch (error) {
    // console.log(error);
  }
  $('#Section').unbind();
  $('#Section').on('change', (e) => {
    fillMoldActualList(e.target.value);
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

  $('#MoldShot_ActBtn').unbind();
  $('#MoldShot_ActBtn').on('click', () => {
    $('#LoginPassword_Req').val('');
    LoginModal.modal('show');
    UpdateActForm.trigger('reset');

    let UserId, Section;
    $LoginBtn.unbind();
    $LoginBtn.on('click', async () => {
      let LoginData = {
        Userpass: $('#LoginPassword_Req').val(),
        Action: 'request',
      };
      let user;
      try {
        user = await checkUser(LoginData);
        $('#MoldShotSection').html(getMoldRow());
        MoldShotModal.modal('show');
        LoginModal.modal('hide');
        let Name = user.Fullname;
        UserId = user.UserId;
        Section = user.Section;
        $('#Issue_Act').val(Name);
        $('#Date_Act').val(getDateTimeLocal());
      } catch (error) {
        callSwal(error);
      }
      let MoldRow = $('#MoldShotSection').children().length + 1;
      dropdownMold(Section, 1);
      dropdownPart(1, Section, 1);
      moldRowDataChange(UserId);

      $('#Add_ModRowBtn').unbind();
      $('#Add_ModRowBtn').on('click', (e) => {
        let newMoldRow = getMoldRow(MoldRow);
        $(newMoldRow).appendTo('#MoldShotSection');
        dropdownMold(Section, MoldRow);
        dropdownPart(1, Section, MoldRow);
        MoldRow++;
        moldRowDataChange(UserId);
      });
    });
  });

  $('#MoldActualList tbody').unbind();
  $('#MoldActualList tbody').on('click', 'tr', (e) => {
    let row = $(e.target).closest('tr');
    let {
      MoldId,
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
      DangerPercent,
      WarnPercent,
    } = MoldActualList.row(row).data();
    $('#LoginPassword_Req').val('');
    LoginModal.modal('show');

    let UserId, Name, Section;
    $LoginBtn.unbind();
    $LoginBtn.on('click', async () => {
      let LoginData = {
        Userpass: $('#LoginPassword_Req').val(),
        Action: 'request',
      };
      let user;
      try {
        user = await checkUser(LoginData);
        MoldShotDetailModal.modal('show');
        LoginModal.modal('hide');
        $('#DetailActForm').trigger('reset');
        Name = user.Fullname;
        UserId = user.UserId;
        Section = user.Section;
      } catch (error) {
        callSwal(error);
      }

      // fillData
      $('#MoldCtrlNo_Edit').val(MoldControlNo);
      $('#MoldName_Edit').val(MoldName);
      $('#OtherPlan').val(OtherPlan);
      $('#OtherAct').val(OtherShot);
      $('#CleanPlan').val(CleaningPlan);
      $('#CleanAct').val(CleaningShot);
      $('#PreventivePlan').val(PreventivePlan);
      $('#PreventiveAct').val(PreventiveShot);
      $('#CumulativePlan').val(LifeShot);
      $('#CumulativeAct').val(CumulativeShot);
      $('#Pmtype_').val('ALL');

      showRequestBtn(`Other_Pm`, OtherPlan, OtherShot, WarnPercent);
      showRequestBtn(`Cleaning_Pm`, CleaningPlan, CleaningShot, WarnPercent);
      showRequestBtn(
        `Preventive_Pm`,
        PreventivePlan,
        PreventiveShot,
        WarnPercent
      );
      LifeShot == 0 || CumulativeShot == 0
        ? $('#ClearShot_Pm').hide()
        : $('#ClearShot_Pm').show();

      let FilterTime = {
        FromDate: $(`#FromDate_`).val().replace('T', ' '),
        ToDate: $(`#ToDate_`).val().replace('T', ' '),
        PmType: $('#Pmtype_').val(),
      };
      tbActualHistory = await fillTable(
        `/pm/actual_history/${MoldId}&${JSON.stringify(FilterTime)}`,
        `tbActualHistory`,
        ActCol
      );
      tbPmHistory = await fillTable(
        `/pm/pm_history/${MoldId}&${JSON.stringify(FilterTime)}`,
        `tbPmHistory`,
        PmHistoryCol
      );
      tbCumulativeShot = await fillTable(
        `/pm/mold_cumulative/${MoldId}&${JSON.stringify(FilterTime)}`,
        `tbCumulativeShot`,
        CumulativeCol
      );

      let RequestDetail = {
        UserId,
        Section,
        MoldId,
        MoldName,
      };
      dropdownProblemReq();
      $('#Other_Pm').unbind();
      $('#Other_Pm').on('click', async () => {
        sendRequest(RequestDetail, 'other');
      });
      $('#Cleaning_Pm').unbind();
      $('#Cleaning_Pm').on('click', async () => {
        sendRequest(RequestDetail, 'clean');
      });
      $('#Preventive_Pm').unbind();
      $('#Preventive_Pm').on('click', async () => {
        sendRequest(RequestDetail, 'prev');
      });
      $('#ClearShot_Pm').unbind();
      $('#ClearShot_Pm').on('click', async () => {
        try {
          let res = await AjaxClear(`/pm/clear_cumulative/${MoldId}`, 'put');
          SwalAlert(res, 'Clear');
          $('#CumulativeAct').val(0);
          $('#ClearShot_Pm').hide();
          MoldActualList.ajax.reload(null, false);
        } catch (error) {
          SwalAlert(error, 'Error');
        }
      });
      $('#DownloadHis_ActBtn').unbind();
      $('#DownloadHis_ActBtn').on('click', () => {
        let FilterTime = {
          FromDate: $(`#FromDate_`).val().replace('T', ' ') || '',
          ToDate: $(`#ToDate_`).val().replace('T', ' '),
          PmType: $('#Pmtype_').val(),
        };
        window.open(
          `/pm/export_actual/${MoldId}&${JSON.stringify(FilterTime)}`
        );
      });
      $('#FromDate_,#ToDate_,#Pmtype_').unbind();
      $('#FromDate_,#ToDate_,#Pmtype_').change(async (e) => {
        let FilterTime = {
          FromDate: $(`#FromDate_`).val().replace('T', ' ') || '',
          ToDate: $(`#ToDate_`).val().replace('T', ' '),
          PmType: $('#Pmtype_').val(),
        };
        tbPmHistory = await fillTable(
          `/pm/pm_history/${MoldId}&${JSON.stringify(FilterTime)}`,
          `tbPmHistory`,
          PmHistoryCol
        );
        if (e.target.id != 'Pmtype_') {
          tbActualHistory = await fillTable(
            `/pm/actual_history/${MoldId}&${JSON.stringify(FilterTime)}`,
            `tbActualHistory`,
            ActCol
          );
          tbCumulativeShot = await fillTable(
            `/pm/mold_cumulative/${MoldId}&${JSON.stringify(FilterTime)}`,
            `tbCumulativeShot`,
            CumulativeCol
          );
        }
      });
    });
  });
});
