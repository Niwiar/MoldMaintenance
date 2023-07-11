function filltbSection() {
  tbSection = $("#tbSection").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: false,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    ajax: {
      url: "/permission_master/section",
      dataSrc: "",
    },
    columns: [
      {
        width: "5%",
        data: "SectionNo",
      },
      {
        data: "Section",
      },
      {
        width: "30%",
        render: function (data, type, row) {
          let Disabled = ''
          if (row.Section == 'DM') Disabled = 'disabled'
          return `<div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-sm btn-warning" id="EditSectionBtn" type="button" ${Disabled}><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button>
            <button class="btn btn-sm btn-danger ms-1" id="DelSectionBtn" type="button" ${Disabled}><i class="fa fa-remove m-1"></i>ลบ</button></div>`;
        },
      },
    ],
  });
}

function filltbPosition(SectionId) {
  tbPosition = $("#tbPosition").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: false,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    ajax: {
      url: "/permission_master/position/" + SectionId,
      dataSrc: "",
    },
    columns: [
      {
        width: "5%",
        data: "index",
      },
      {
        data: "Position",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        width: "20%",
        render: function (data, type, row) {
          let Disabled = ''
          if (row.Position.toUpperCase() == 'ADMIN') Disabled = 'disabled'
          return `<div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-warning" id="EditPositionBtn" type="button" ${Disabled}><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button>
            <button class="btn btn-danger ms-1" id="DelPositionBtn" type="button" ${Disabled}><i class="fa fa-remove m-1"></i>ลบ</button></div>`;
        }
      },
    ],
  });
}

function get2CheckStatus(checkname) {
  let status;
  if ($(checkname + "-No").prop("checked")) status = 0;
  if ($(checkname + "-Yes").prop("checked")) status = 1;
  return status;
}
function get3CheckStatus(checkname) {
  let status;
  if ($(checkname + "-No").prop("checked")) status = 0;
  if ($(checkname + "-Only").prop("checked")) status = 1;
  if ($(checkname + "-View").prop("checked")) status = 2;
  return status;
}

function Check2(data, checkname) {
  if (data == 0) {
    $(checkname + "-No").prop("checked", true);
  } else {
    $(checkname + "-Yes").prop("checked", true);
  }
}
function Check3(data, checkname) {
  if (data == 0) {
    $(checkname + "-No").prop("checked", true);
  } else if (data == 1) {
    $(checkname + "-Only").prop("checked", true);
  } else {
    $(checkname + "-View").prop("checked", true);
  }
}

$(document).ready(() => {
  filltbSection();
  // Add Section
  $("#AddSectionBtn").unbind();
  $("#AddSectionBtn").on("click", function () {
    $("#modalSectionDetail").modal("show");
    $("#PerSectionForm").trigger("reset");

    $("#PerSectionSubmit").unbind();
    $("#PerSectionSubmit").on("click", () => {
      let Data = {
        SectionNo: $("#PerSectionNo_").val(),
        Section: $("#PerSectionName_").val(),
        SectionPass: $("#PerSectionPass_").val(),
      };
      AjaxPost(`/permission_master/section_add`, tbSection, Data, $("#modalSectionDetail"));
    });
    $(".close,.no").click(function () {
      $("#modalSectionDetail").modal("hide");
    });
  });

  // Edit Section
  $(document).on("click", "#EditSectionBtn", function () {
    console.log("EditPer");
    $("#modalSectionDetail").modal("show");
    $("#PerSectionForm").trigger("reset");

    let tr = $(this).closest("tr");
    let { SectionId, SectionNo, Section, SectionPass } = tbSection
      .row(tr)
      .data();

    $("#PerSectionNo_").val(SectionNo);
    $("#PerSectionName_").val(Section);
    $("#PerSectionPass_").val(SectionPass);

    $("#PerSectionSubmit").unbind();
    $("#PerSectionSubmit").on("click", () => {
      let Data = {
        SectionId: SectionId,
        SectionNo: $("#PerSectionNo_").val(),
        Section: $("#PerSectionName_").val(),
        SectionPass: $("#PerSectionPass_").val(),
      };
      AjaxPut(
        `/permission_master/section_edit`,
        tbSection,
        Data,
        $("#modalSectionDetail")
      );
    });
    $(".close,.no").click(function () {
      $("#modalSectionDetail").modal("hide");
    });
  });

  // Delete Section
  $(document).on("click", "#DelSectionBtn", function () {
    tr = $(this).closest("tr");
    let { SectionId } = tbSection.row(tr).data();
    AjaxDelete("/permission_master/section_del/" + SectionId, tbSection);
  });

  // Click Table Die
  $("#tbSection tbody").unbind();
  $("#tbSection tbody").on("click", "tr", function () {
    let tr = $(this).closest("tr");
    let { SectionId, Section } = tbSection.row(tr).data();
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      // no select row
      // tbPosition.destroy();
      $("#AddPositionBtn").attr("disabled", "disabled");
      $("#tbPosition tbody").html(
        '<tr><td colspan="3">เลือกรายการแผนก</td></tr>'
      );
    } else {
      tbSection.$("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      // select row
      if (Section == "DM") {
        $(".section-all").removeClass("d-none");
        $(".section-dm").removeClass("d-none");
      } else {
        $(".section-all").removeClass("d-none");
        $(".section-dm").addClass("d-none");
      }
      $("#AddPositionBtn").removeAttr("disabled");
      filltbPosition(SectionId);

      // Add Position
      $(document).on("click", "#AddPositionBtn", function () {
        $("#modalPositionDetail").modal("show");
        $("#PositionForm").trigger("reset");
        $(
          "#CheckCreReq-No, #CheckCheReq-No, #CheckAppReq-No, #CheckPerfoDataAcc-No, #CheckReDataAcc-No, #CheckMMaPM-No, #CheckMMPaC-No, #CheckUS-No ,#CheckDmUS-No, #CheckSaPaPS-No"
        ).prop("checked", true);

        $("#PositionSubmit").unbind();
        $("#PositionSubmit").on("click", () => {
          let Data = {
            SectionId: SectionId,
            Position: $("#PositionName_").val(),
            MgCreateOrder: get2CheckStatus("#CheckCreReq"),
            MgCheckOrder: get2CheckStatus("#CheckCheReq"),
            MgApproveOrder: get2CheckStatus("#CheckAppReq"),
            DmPerformance: get3CheckStatus("#CheckPerfoDataAcc"),
            DmReport: get3CheckStatus("#CheckReDataAcc"),
            MasterMold: get3CheckStatus("#CheckMMaPM"),
            MasterProblem: get3CheckStatus("#CheckMMPaC"),
            MasterMfg: get3CheckStatus("#CheckUS"),
            MasterDm: get3CheckStatus("#CheckDmUS"),
            MasterPosition: get3CheckStatus("#CheckSaPaPS"),
          };
          AjaxPost(
            `/permission_master/position_add`,
            tbPosition,
            Data,
            $("#modalPositionDetail")
          );
        });
        $(".close,.no").click(function () {
          $("#modalPositionDetail").modal("hide");
        });
      });
      // Edit Position
      $(document).on("click", "#EditPositionBtn", function () {
        $("#modalPositionDetail").modal("show");
        let tr = $(this).closest("tr");
        let {
          PositionId,
          Position,
          MgCreateOrder,
          MgCheckOrder,
          MgApproveOrder,
          DmPerformance,
          DmReport,
          MasterMold,
          MasterProblem,
          MasterMfg,
          MasterDm,
          MasterPosition,
        } = tbPosition.row(tr).data();
        $("#PositionName_").val(Position);
        Check2(MgCreateOrder, "#CheckCreReq");
        Check2(MgCheckOrder, "#CheckCheReq");
        Check2(MgApproveOrder, "#CheckAppReq");
        // Check2(QaOrder,'#CheckQACheReq');

        Check3(DmPerformance, "#CheckPerfoDataAcc");
        Check3(DmReport, "#CheckReDataAcc");
        Check3(MasterMold, "#CheckMMaPM");
        Check3(MasterProblem, "#CheckMMPaC");
        Check3(MasterMfg, "#CheckUS");
        Check3(MasterDm, "#CheckDmUS");
        Check3(MasterPosition, "#CheckSaPaPS");

        $("#PositionSubmit").unbind();
        $("#PositionSubmit").on("click", () => {
          let Data = {
            SectionId: SectionId,
            PositionId: PositionId,
            Position: $("#PositionName_").val(),
            MgCreateOrder: get2CheckStatus("#CheckCreReq"),
            MgCheckOrder: get2CheckStatus("#CheckCheReq"),
            MgApproveOrder: get2CheckStatus("#CheckAppReq"),
            DmPerformance: get3CheckStatus("#CheckPerfoDataAcc"),
            DmReport: get3CheckStatus("#CheckReDataAcc"),
            MasterMold: get3CheckStatus("#CheckMMaPM"),
            MasterProblem: get3CheckStatus("#CheckMMPaC"),
            MasterMfg: get3CheckStatus("#CheckUS"),
            MasterDm: get3CheckStatus("#CheckDmUS"),
            MasterPosition: get3CheckStatus("#CheckSaPaPS"),
          };
          AjaxPut(
            `/permission_master/position_edit`,
            tbPosition,
            Data,
            $("#modalPositionDetail")
          );
        });
        $(".close,.no").click(function () {
          $("#modalPositionDetail").modal("hide");
        });
      });
      // Delete Position
      $(document).on("click", "#DelPositionBtn", function () {
        tr = $(this).closest("tr");
        let { PositionId } = tbPosition.row(tr).data();
        AjaxDelete("/permission_master/position_del/" + PositionId, tbPosition);
      });
    }
  });
});
