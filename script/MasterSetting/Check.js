let $CheckType = $("#CheckTypeSelect");
let $CheckMoldDiv = $("#CheckMoldDiv");
let $CheckRepairDiv = $("#CheckRepairDiv");
let $CheckPreventiveDiv = $("#CheckPreventiveDiv");

const showCheckType = (checkType = 1) => {
  $CheckMoldDiv.hide();
  $CheckRepairDiv.hide();
  $CheckPreventiveDiv.hide();
  if (checkType == 1) {
    $CheckMoldDiv.show();
  } else if (checkType == 2) {
    $CheckRepairDiv.show();
  } else if (checkType == 4) {
    $CheckPreventiveDiv.show();
  }
};

function filltbCheck(CheckType, TopicId = 0) {
  if (CheckType == 1) {
    tbCheckMD = $("#tbCheckMD").DataTable({
      bDestroy: true,
      scrollCollapse: true,
      searching: false,
      paging: true,
      lengthChange: false,
      info: false,
      autoWidth: false,
      ajax: {
        url: "/check_master/list/" + CheckType + "&" + TopicId,
        dataSrc: "",
      },
      columns: [
        {
          data: "CheckMoldNo",
        },
        {
          data: "CheckMold",
          render: function (data) {
            return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
          },
        },
        {
          width: "20%",
          defaultContent:
            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditMoldDownBtn" type="button" data-bs-target="#modalCheckDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelMoldDownBtn" type="button"><i class="fa fa-remove m-1" id="DelProbBtn-3"></i>ลบ</button>',
        },
      ],
    });
  } else if (CheckType == 2) {
    tbCheckRepair = $("#tbCheckRepair").DataTable({
      bDestroy: true,
      scrollCollapse: true,
      searching: false,
      paging: true,
      lengthChange: false,
      info: false,
      autoWidth: false,
      ajax: {
        url: "/check_master/list/" + CheckType + "&" + TopicId,
        dataSrc: "",
      },
      columns: [
        {
          data: "CheckRepairNo",
        },
        {
          data: "CheckRepair",
          render: function (data) {
            return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
          },
        },
        {
          width: "20%",
          defaultContent:
            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditCheckRepairBtn" type="button" data-bs-target="#modalCheckDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelCheckRepairBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button></div>',
        },
      ],
    });
  } else if (CheckType == 3) {
    tbCheckListPrevent = $("#tbCheckListPrevent").DataTable({
      bDestroy: true,
      scrollCollapse: true,
      searching: false,
      paging: true,
      lengthChange: false,
      info: false,
      autoWidth: false,
      ajax: {
        url: "/check_master/list/" + CheckType + "&" + TopicId,
        dataSrc: "",
      },
      columns: [
        {
          data: "CheckPreventListNo",
        },
        {
          data: "CheckPreventList",
          render: function (data) {
            return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
          },
        },
        {
          width: "20%",
          defaultContent:
            '<div class="btn-group btn-group-sm" role="group"><div class="dropstart btn-group-sm" role="group"><button class="btn btn-warning " id="EditCheckListPreventBtn"aria-expanded="false" data-bs-toggle="dropdown" type="button"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><div class="dropdown-menu dropdown-menu-end p-1"><form id="CheckListPreventForm"><input class="form-control" type="number" id="EditCheckPreventListNo_" placeholder="หมายเลข..."><input class="form-control" type="text" id="EditCheckPreventList_" placeholder="รายการ..."><button class="btn btn-info btn-sm float-end mt-3" id="ConfirmCheckListPreventBtn" type="button">ยืนยัน</button></form></div></div><button class="btn btn-danger ms-1" id="DelCheckListPreventBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button></div>',
        },
      ],
    });
  } else if (CheckType == 4) {
    tbCheckPreventTopic = $("#tbCheckPreventTopic").DataTable({
      bDestroy: true,
      scrollCollapse: true,
      searching: false,
      paging: true,
      lengthChange: false,
      info: false,
      autoWidth: false,
      ajax: {
        url: "/check_master/list/" + CheckType + "&" + TopicId,
        dataSrc: "",
      },
      columns: [
        {
          data: "index",
        },
        {
          data: "CheckPreventTopic",
          render: function (data) {
            return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
          },
        },
        {
          width: "20%",
          defaultContent:
            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditCheckPreventTopicBtn" type="button"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelCheckPreventTopicBtn" type="button"><i class="fa fa-remove m-1" id="DelProbBtn-13"></i>ลบ</button></div>',
        },
      ],
    });
  }
}

$(document).ready(() => {
  let CheckType = $("#CheckTypeSelect").val();
  CheckType = 1;
  filltbCheck(1);
  showCheckType();
  $($CheckType).change(function () {
    showCheckType($CheckType.val());
    filltbCheck($CheckType.val());
  });
  // Add MoldDown
  $("#AddCheckMoldDownBtn").on("click", function () {
    let CheckNo = $.trim($("#CheckMoldNo_").val());
    let Check = $.trim($("#CheckMold_").val());
    console.log(Check);
    let Data = {
      CheckType: 1,
      CheckNo: CheckNo,
      Check: Check,
    };
    AjaxPost("/check_master/add", tbCheckMD, Data);
    $("#CheckMoldNo_").val("");
    $("#CheckMold_").val("");
  });

  // Edit MoldDown
  $('#tbCheckMD').unbind();
  $('#tbCheckMD').on("click", "#EditMoldDownBtn", function () {
    $("#modalCheckDetail").modal("show");
    $("#CheckForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { CheckMoldId, CheckMoldNo, CheckMold } = tbCheckMD.row(tr).data();

    $("#CheckNo_").val(CheckMoldNo);
    $("#Check_").val(CheckMold);

    $("#CheckSubmitBtn").unbind();
    $("#CheckSubmitBtn").on("click", () => {
      let CheckId = CheckMoldId;
      let CheckNo = $.trim($("#CheckNo_").val());
      let Check = $.trim($("#Check_").val());
      let Data = {
        CheckType: 1,
        CheckId: CheckId,
        CheckNo: CheckNo,
        Check: Check,
      };
      AjaxPut("/check_master/edit", tbCheckMD, Data, $("#modalCheckDetail"));
    });
    $(".close,.no").click(function () {
      $("#modalCheckDetail").modal("hide");
    });
  });

  // Delete MoldDown
  $('#tbCheckMD').on("click", "#DelMoldDownBtn", function () {
    tr = $(this).closest("tr");
    let { CheckMoldId } = tbCheckMD.row(tr).data();
    let CheckId = CheckMoldId;
    let URL = "/check_master/delete/1&" + CheckId;
    let tbId = tbCheckMD;
    AjaxDelete(URL, tbId);
  });

  // Add Repair
  $("#AddCheckRepairBtn").on("click", function () {
    let CheckNo = $.trim($("#CheckRepairNo_").val());
    let Check = $.trim($("#CheckRepair_").val());
    let Data = {
      CheckType: 2,
      CheckNo: CheckNo,
      Check: Check,
    };
    AjaxPost("/check_master/add", tbCheckRepair, Data);
    $("#CheckRepairNo_").val("");
    $("#CheckRepair_").val("");
  });

  // Edit Repair
  $('#tbCheckRepair').unbind();
  $('#tbCheckRepair').on("click", "#EditCheckRepairBtn", function () {
    $("#modalCheckDetail").modal("show");
    $("#CheckForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { CheckRepairId, CheckRepairNo, CheckRepair } = tbCheckRepair
      .row(tr)
      .data();

    $("#CheckNo_").val(CheckRepairNo);
    $("#Check_").val(CheckRepair);

    $("#CheckSubmitBtn").unbind();
    $("#CheckSubmitBtn").on("click", () => {
      let CheckId = CheckRepairId;
      let CheckNo = $.trim($("#CheckNo_").val());
      let Check = $.trim($("#Check_").val());
      let Data = {
        CheckType: 2,
        CheckId: CheckId,
        CheckNo: CheckNo,
        Check: Check,
      };
      AjaxPut(
        "/check_master/edit",
        tbCheckRepair,
        Data,
        $("#modalCheckDetail")
      );
    });
    $(".close,.no").click(function () {
      $("#modalCheckDetail").modal("hide");
    });
  });

  // Delete Repair
  $('#tbCheckRepair').on("click", "#DelCheckRepairBtn", function () {
    tr = $(this).closest("tr");
    let { CheckRepairId } = tbCheckRepair.row(tr).data();
    let CheckId = CheckRepairId;
    AjaxDelete("/check_master/delete/2&" + CheckId, tbCheckRepair);
  });

  // Add Topic Preventive
  $("#AddCheckPreventTopicBtn").on("click", function () {
    let Topic = $.trim($("#CheckPreventTopic_").val());
    let Data = {
      CheckType: 4,
      Topic: Topic,
    };
    AjaxPost("/check_master/add", tbCheckPreventTopic, Data);
    $("#CheckPreventTopic_").val("");
  });

  // Edit Topic Preventive
  $('#tbCheckPreventTopic').unbind();
  $('#tbCheckPreventTopic').on("click", "#EditCheckPreventTopicBtn", function () {
    $("#modalPreventiveDetail").modal("show");
    $("#PrevForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { CheckPreventTopicId, CheckPreventTopic } = tbCheckPreventTopic
      .row(tr)
      .data();

    $("#CheckTopic_").val(CheckPreventTopic);

    filltbCheck(3, CheckPreventTopicId);

    // Add Check List Preventive
    $("#AddCheckListPreventBtn").unbind();
    $("#AddCheckListPreventBtn").on("click", function () {
      let CheckNo = $.trim($("#CheckPreventListNo_").val());
      let Check = $.trim($("#CheckPreventList_").val());

      $.ajax({
        url: "/check_master/add",
        method: "post",
        contentType: "application/json",
        data: JSON.stringify({
          CheckType: 3,
          TopicId: CheckPreventTopicId,
          CheckNo: CheckNo,
          Check: Check,
        }),
        success: (res) => {
          let success = res.message;
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Created",
            text: success,
            showConfirmButton: false,
            timer: 1500,
          });
          tbCheckListPrevent.ajax.reload(null, false);
        },
        error: (err) => {
          let error = err.responseJSON.message;
          Swal.fire({
            position: "center",
            icon: "warning",
            title: "Warning",
            text: error,
            showConfirmButton: true,
            confirmButtonText: "OK",
            confirmButtonColor: "#FF5733",
          });
        },
      });

      $("#CheckPreventListNo_").val("");
      $("#CheckPreventList_").val("");
    });

    // Edit Check List Preventive
    $('#tbCheckListPrevent').unbind();
    $('#tbCheckListPrevent').on("click", "#EditCheckListPreventBtn", function () {
      let tr = $(this).closest("tr");
      let { CheckPreventListId, CheckPreventListNo, CheckPreventList } =
        tbCheckListPrevent.row(tr).data();
      $(this)
        .siblings()
        .find("#EditCheckPreventListNo_")
        .val(CheckPreventListNo);
      $(this).siblings().find("#EditCheckPreventList_").val(CheckPreventList);
      $('#tbCheckListPrevent').on("click", "#ConfirmCheckListPreventBtn", function () {
        let CheckNo = $(this).siblings("#EditCheckPreventListNo_").val();
        let Check = $(this).siblings("#EditCheckPreventList_").val();
        let TopicId = CheckPreventTopicId;
        let CheckId = CheckPreventListId;
        let Data = {
          CheckType: 3,
          TopicId: TopicId,
          CheckId: CheckId,
          CheckNo: CheckNo,
          Check: Check,
        };
        AjaxPut("/check_master/edit", tbCheckListPrevent, Data);
      });
    });

    // Delete Check List Preventive
    $('#tbCheckListPrevent').on("click", "#DelCheckListPreventBtn", function () {
      let tr = $(this).closest("tr");
      let { CheckPreventListId } = tbCheckListPrevent.row(tr).data();
      let CheckId = CheckPreventListId;
      AjaxDelete("/check_master/delete/3&" + CheckId, tbCheckListPrevent);
    });

    // Edit Check Topic Preventive
    $("#CheckTopicSubmitBtn").unbind();
    $("#CheckTopicSubmitBtn").on("click", () => {
      let TopicId = CheckPreventTopicId;
      let Topic = $.trim($("#CheckTopic_").val());
      let Data = {
        CheckType: 4,
        TopicId: TopicId,
        Topic: Topic,
      };
      AjaxPut("/check_master/edit", tbCheckPreventTopic, Data, $("#modalPreventiveDetail"));
    });
    $(".close,.no").click(function () {
      $("#modalPreventiveDetail").modal("hide");
    });
  });

  // Delete Topic Preventive
  $('#tbCheckPreventTopic').on("click", "#DelCheckPreventTopicBtn", function () {
    let tr = $(this).closest("tr");
    let { CheckPreventTopicId } = tbCheckPreventTopic.row(tr).data();
    let CheckId = CheckPreventTopicId;
    AjaxDelete("/check_master/delete/4&" + CheckId, tbCheckPreventTopic);
  });
});
