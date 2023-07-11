const $inputDateTime = $(
  "#ReportDateFrom_1, #ReportDateTo_1, #ReportTimeFrom_1, #ReportTimeTo_1,#ReportDateFrom_2, #ReportDateTo_2, #ReportTimeFrom_2, #ReportTimeTo_2,#ReportDateFrom_3, #ReportDateTo_3, #ReportTimeFrom_3, #ReportTimeTo_3,#ReportDateFrom_4, #ReportDateTo_4, #ReportTimeFrom_4, #ReportTimeTo_4"
);

const dropdownMold = (Section) => {
  $.ajax({
    url: `/dropdown/mold_section/${Section}`,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      // console.log("dpMold: ", res);
      if (res.length == 0) {
        $("#MoldName_ReqOpt option").remove();
        $("#MoldName_ReqOpt").append("<option value='No data'>");
        $("#MoldName_Req").attr("disabled", "");
      } else {
        $("#MoldName_ReqOpt option").remove();
        $("#MoldName_ReqOpt optgroup").remove();
        $("#MoldName_ReqOpt").append("<option value=''> ");
        res.forEach((obj) => {
          $("#MoldName_ReqOpt").append(
            `<option value='${obj.MoldId}) ${obj.MoldName}'>`
          );
        });
      }
    },
    error: function (err) {
      $("#MoldName_ReqOpt option").remove();
      $("#MoldName_ReqOpt").append("<option value='No data'>");
      $("#MoldName_Req").attr("disabled", "");
    },
  });
};
const dropdownMoldDetail = (MoldId) => {
  $.ajax({
    url: `/dropdown/mold_detail/${MoldId}`,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      $("#MoldCtrl_Req").val(res.MoldControlNo);
      $("#Cavity_Req").val(res.MoldCavity);
    },
    error: function (err) {
      $("#MoldCtrl_Req").val("No Data");
      $("#Cavity_Req").val("No Data");
    },
  });
};
const dropdownPart = (Section) => {
  $.ajax({
    url: `/dropdown/part_section/${Section}`,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (res.length == 0) {
        $("#PartName_ReqOpt option").remove();
        $("#PartName_ReqOpt").append("<option value='No data'>");
        // $("#PartName_Req").attr("disabled", "");
      } else {
        $("#PartName_ReqOpt option").remove();
        $("#PartName_ReqOpt optgroup").remove();
        $("#PartName_ReqOpt").append("<option value=''> ");
        res.forEach((obj) => {
          $("#PartName_ReqOpt").append(
            `<option value='${obj.PartId})  ${obj.PartName}'>`
            // $("#PartName_Req").attr("disabled", "");
          );
        });
      }
    },
    error: function (err) {
      $("#PartName_ReqOpt option").remove();
      $("#PartName_ReqOpt").append("<option value='No data'>");
      // $("#PartName_Req").attr("disabled", "");
    },
  });
};
const dropdownPartDetail = (PartId) => {
  $.ajax({
    url: `/dropdown/part_detail/${PartId}`,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      $("#PartNo_Req").val(res.PartNo);
    },
    error: function (err) {
      $("#PartNo_Req").val("No Data");
    },
  });
};
const dropdownProblem = (ProblemId = 0) => {
  $.ajax({
    url: "/dropdown/problem",
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      if (!res.length) {
        $("#Problem_Req option").remove();
        $("#Problem_Req optgroup").remove();
        $("#Problem_Req").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $("#Problem_Req option").remove();
        $("#Problem_Req optgroup").remove();
        $("#Problem_Req").append(
          `<option value=''><span>Please select problem..</span></option>`
        );
        res.forEach((obj) => {
          // console.log(ProblemId, obj.ProblemId)

          let ProblemSelected;
          ProblemSelected = obj.ProblemId == ProblemId ? "selected" : "";
          $("#Problem_Req").append(
            `<option value='${obj.ProblemId}' ${ProblemSelected}> 
                        <span>${obj.ProblemNo}) ${obj.Problem}</span>
                      </option>`
          );
        });
      }
    },
    error: function (err) {
      $("#Problem_Req option").remove();
      $("#Problem_Req optgroup").remove();
      $("#Problem_Req").append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
};
const dropdownUser = (Section) => {
  $.ajax({
    url: `/dropdown/user/${Section}`,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      // console.log("dpMold: ", res);
      if (res.length == 0) {
        $("#M_ResponsibleUser_ option").remove();
        $("#M_ResponsibleUser_").append("<option value='No data'>");
        $("#M_ResponsibleUser_Ip").attr("disabled", "");
      } else {
        $("#M_ResponsibleUser_ option").remove();
        $("#M_ResponsibleUser_ optgroup").remove();
        $("#M_ResponsibleUser_").append("<option value=''> ");
        res.forEach((obj) => {
          $("#M_ResponsibleUser_").append(
            `<option value='${obj.UserId}) ${obj.Fullname}'>`
          );
        });
      }
    },
    error: function (err) {
      $("#M_ResponsibleUser_ option").remove();
      $("#M_ResponsibleUser_").append("<option value='No data'>");
      $("#M_ResponsibleUser_Ip").attr("disabled", "");
    },
  });
};

function fillTimeNow() {
  $("input[type=datetime-local][value='2023-01-01 00:00'].report-date").val(`${getdate()} ${gettime()}`);
  let Time = gettime().split(":");
  let h = parseInt(Time[0]) + 1;
  let m = Time[1];
  if (h == 24) h = 0;
  if (h < 10) h = '0' + h
  let newTime = `${h}:${m}`;
  // console.log(`${getdate()} ${gettime()}`)
  $("input[type=datetime-local][value='2023-01-01 01:00'].report-date").val(`${getdate()} ${newTime}`);
  $("input[type=month]").val(getmonth());

  $("input[type=time][value='01:00']").val(gettime());

  $("input[type=time][value='00:00']").val(newTime);
  $(".ip-date-to").attr("min", getdate());
  $(".ip-month-to").attr("min", getmonth());
}

function dropdownSection() {
  $.ajax({
    url: `/dropdown/section/ALL`,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      console.log(res)
      if (res.length == 0) {
        $(".section-dp option").remove();
        $(".section-dp").append("<option value='No data'>No data</option>");
        $(".section-dp").attr("disabled", "");
      } else {
        $(".section-dp option").remove();
        $(".section-dp optgroup").remove();
        $(".section-dp").append(
          `<option value='' selected>All Section</option>`
        );
        res.forEach((obj) => {

          $(".section-dp").append(
            `<option value='${obj.Section}'>${obj.Section}</option>`
          );
        });
      }
    },
    error: function (err) {
      $(".section-dp option").remove();
      $(".section-dp").append("<option value='No data'>No data</option>");
    },
  });
}

$(document).ready(() => {
  dropdownSection();
  fillTimeNow();
  let ReportFilter = $("#ReportFilter_").val();
  let Filter = getFilter(ReportFilter);
  let { FromDate, ToDate, FromTime, ToTime } = Filter
  // console.log(getFilter(ReportFilter))
  filltbDailyReport(Filter);
  searchtbDailyReport();
  filltbSaTable(Filter);
  // searchtbSaTable();
  searchtbSaTable();
  filltbPoReport(Filter);
  searchtbPoReport();


  $inputDateTime.unbind();
  $inputDateTime.change(function () {
    if ($(this).val() != "") {
      let ReportFilter = $("#ReportFilter_").val();
      let { FromDate, ToDate, FromTime, ToTime } = getFilter(ReportFilter);

      if ($(this).attr("id").includes("From")) {
        let id = $(this).attr("id").replace("From_", "To_");
        if ($(`#${id}`).attr("type") == "time") {
          let Time = $(this).val().split(":");
          let h = parseInt(Time[0]) + 1;
          let m = Time[1];
          if (h == 24) h = 0;
          let newTime = `${("0" + h).slice(-2)}:${m}`;
          $(`#${id}`).val(newTime).attr("min", newTime);
        } else {
          $(`#${id}`).val($(this).val()).attr("min", $(this).val());
        }
      }
      // Type 1
      if ($(this).attr("id").includes("_1")) {
        filltbDailyReport(getFilter(ReportFilter));
      }

      // Type 2
      if ($(this).attr("id").includes("_2")) {
        let [year, month] = FromDate.split('-')
        let Section = $('#Dp_SectionM').val() || 'ALL'
        $('#MonthlyReport .report-title').text(`บันทึกการเกิดปัญหาแม่พิมพ์ ${Section} ประจำปี ${year}`)
        $('.MonthlyReportMonth').text(MonthTH[parseInt(month)])

        Section = Section || 'ALL'
        filltbMonthlyMoldProb(`${FromDate}-01`, Section);
        MonthlyChartGenerate(`${FromDate}-01`, Section);
      }
      // Type 3
      if ($(this).attr("id").includes("_3")) {
        filltbSaTable(getFilter(ReportFilter));
      }
      // Type 4
      if ($(this).attr("id").includes("_4")) {
        filltbPoReport(getFilter(ReportFilter));
      }
    }
  });

  $('#Dp_Section, #Dp_Type').change(function () {
    console.log($(this).val());
    let ReportFilter = $("#ReportFilter_").val();
    filltbDailyReport(getFilter(ReportFilter));
  })
  $('#Dp_SectionM').change(function () {
    console.log($(this).val());
    let ReportFilter = $("#ReportFilter_").val();
    let { FromDate } = getFilter(ReportFilter);
    let [year, month] = FromDate.split('-')
    let Section = $('#Dp_SectionM').val()
    $('#MonthlyReport .report-title').text(`บันทึกการเกิดปัญหาแม่พิมพ์ ${Section} ประจำปี ${year}`)
    $('.MonthlyReportMonth').text(MonthTH[parseInt(month)])

    Section = Section || 'ALL'
    filltbMonthlyMoldProb(`${FromDate}-01`, Section);
    MonthlyChartGenerate(`${FromDate}-01`, Section);
  })

  $("#MoldName_Req").unbind();
  $("#MoldName_Req").on("keyup change", () => {
    let MoldId = $("#MoldName_Req").val().split(")")[0];
    if (MoldId != "") dropdownMoldDetail(MoldId);
  });
  $("#PartName_Req").unbind();
  $("#PartName_Req").on("keyup change", () => {
    let PartId = $("#PartName_Req").val().split(")")[0];
    if (PartId != "") dropdownPartDetail(PartId);
  });

  // Type 1 (Daily)
  // Edit Daily Table
  $(document).on("click", "#editDailyReportBtn", function () {
    $("#modalDaily").modal("show");
    $("#modalTitle").text("แก้ไขข้อมูลการบำรุงรักษาแม่พิมพ์ประจำวัน");
    $("#DailyForm").trigger("reset");

    let tr = $(this).closest("tr");
    let {
      RepairId,
      OrderType,
      PartId,
      PartName,
      MoldId,
      MoldName,
      ProblemSource,
      ProblemId,
      Cause,
      IndexProgress,
      FixDetail,
      Section,
    } = tbDailyReport.row(tr).data();
    dropdownMold(Section);
    dropdownMoldDetail(MoldId);
    dropdownPart(Section);
    dropdownPartDetail(PartId);
    dropdownProblem(ProblemId);
    $("#MoldName_Req").val(`${MoldId}) ${MoldName}`);
    $("#PartName_Req").val(`${PartId}) ${PartName}`);
    $("#Cause_").val(Cause);
    $("#FixDetail_").val(FixDetail || "-");
    $(`input[type="radio"][name="Type_Req"][value="${OrderType}"]`).prop(
      "checked",
      true
    );
    $(`input[type="radio"][name="Source_Req"][value="${ProblemSource}"]`).prop(
      "checked",
      true
    );

    $("#DailySubmitBtn").unbind();
    $("#DailySubmitBtn").on("click", () => {
      let Data = {
        RepairId,
        OrderType: $('input[type="radio"][name="Type_Req"]:checked').val() || 0,
        PartId: $("#PartName_Req").val().split(")")[0],
        MoldId: $("#MoldName_Req").val().split(")")[0],
        ProblemSource:
          $('input[type="radio"][name="Source_Req"]:checked').val() || 0,
        ProblemId: $("#Problem_Req").val(),
        Cause: $("#Cause_").val(),
        IndexProgress,
        FixDetail: $("#FixDetail_").val(),
      };
      console.log(Data);
      AjaxPut("/report/daily", tbDailyReport, Data, $("#modalDaily"));
    });
    $(".close,.no").click(function () {
      $("#modalDaily").modal("hide");
    });
  });

  // Type 2 (Monthly)
  // Edit Monthly Fix
  $(document).on("click", "#editMonthlyFixBtn", function () {
    $("#modalMonthly").modal("show");
    $("#MonthlyForm").trigger("reset");
    let tr = $(this).closest("tr");
    let {
      Month,
      IndexMold,
      MoldId,
      RepairDate,
      Cause,
      FixDetail,
      ResponsibleUserId,
      ResponsibleUser,
    } = tbMonthlyFix.row(tr).data();

    $("#M_RepairDate_").val(RepairDate);
    $("#M_Cause_").val(Cause || "-");
    $("#M_FixDetail_").val(FixDetail || "-");
    dropdownUser("DM");
    ResponsibleUserId != null
      ? $("#M_ResponsibleUser_Ip").val(
        `${ResponsibleUserId}) ${ResponsibleUser}`
      )
      : $("#M_ResponsibleUser_Ip").val(`-`);

    $("#MonthlySubmitBtn").unbind();
    $("#MonthlySubmitBtn").on("click", () => {
      let Data = {
        Month,
        IndexMold,
        MoldId,
        RepairDate: $("#M_RepairDate_").val().replace("T", " "),
        Cause: $("#M_Cause_").val(),
        FixDetail: $("#M_FixDetail_").val(),
        ResponsibleUserId: $("#M_ResponsibleUser_Ip").val().split(")")[0],
      };
      // console.log(Data);
      AjaxPut("/report/monthly", tbMonthlyFix, Data, $("#modalMonthly"));
    });
  });

  // Type 3 (Sa Table)
  // Edit Sa Table
  $(document).on("click", "#editSaTableBtn", function () {
    $("#modalDaily").modal("show");
    $("#modalTitle").text("แก้ไขประวัติการบำรุงรักษาแม่พิมพ์");
    $("#DailyForm").trigger("reset");
    let tr = $(this).closest("tr");
    let {
      RepairId,
      OrderType,
      PartId,
      PartName,
      MoldId,
      MoldName,
      ProblemSource,
      ProblemId,
      Cause,
      IndexProgress,
      FixDetail,
      Section,
    } = tbSaTable.row(tr).data();
    dropdownMold(Section);
    dropdownMoldDetail(MoldId);
    dropdownPart(Section);
    dropdownPartDetail(PartId);
    dropdownProblem(ProblemId);
    $("#MoldName_Req").val(`${MoldId}) ${MoldName}`);
    $("#PartName_Req").val(`${PartId}) ${PartName}`);
    $("#Cause_").val(Cause);
    $("#FixDetail_").val(FixDetail || "-");
    $(`input[type="radio"][name="Type_Req"][value="${OrderType}"]`).prop(
      "checked",
      true
    );
    $(`input[type="radio"][name="Source_Req"][value="${ProblemSource}"]`).prop(
      "checked",
      true
    );

    $("#DailySubmitBtn").unbind();
    $("#DailySubmitBtn").on("click", () => {
      let Data = {
        RepairId,
        OrderType: $('input[type="radio"][name="Type_Req"]:checked').val() || 0,
        PartId: $("#PartName_Req").val().split(")")[0],
        MoldId: $("#MoldName_Req").val().split(")")[0],
        ProblemSource:
          $('input[type="radio"][name="Source_Req"]:checked').val() || 0,
        ProblemId: $("#Problem_Req").val(),
        Cause: $("#Cause_").val(),
        IndexProgress,
        FixDetail: $("#FixDetail_").val(),
      };
      AjaxPut("/report/repair", tbSaTable, Data, $("#modalDaily"));
    });

    $(".close,.no").click(function () {
      $("#modalDaily").modal("hide");
    });
  });

  // Type 4 (PO)
  // Edit PO
  $(document).on("click", "#editPoReportBtn", function () {
    $("#modalPo").modal("show");
    $("#PoForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { RepairId, NoHAT, AS400, MgLeader, MgMgr } = tbPoReport.row(tr).data();

    $("#NoHat_").val(NoHAT || "-");
    $("#AS400_").val(AS400 || "-");
    $("#MgLeader_").val(MgLeader || "-");
    $("#MgMgr_").val(MgMgr || "-");
    $("#PoSubmitBtn").unbind();
    $("#PoSubmitBtn").on("click", () => {
      let Data = {
        RepairId,
        NoHat: $("#NoHat_").val(),
        AS400: $("#AS400_").val(),
        MgLeader: $("#MgLeader_").val(),
        MgMgr: $("#MgMgr_").val(),
      };
      // console.log(Data);
      AjaxPut("/report/po", tbPoReport, Data, $("#modalPo"));
    });
    $(".close,.no").click(function () {
      $("#modalPo").modal("hide");
    });
  });

  // Edit PO Leader
  $("#PoReportLeaderBtn").unbind();
  $("#PoReportLeaderBtn").on("click", () => {
    let Data = {
      Filter: getFilter(4),
      MgLeader: $("#IP_Leader").val(),
      MgMgr: $("#IP_MGR").val(),
    };
    // console.log(Data);
    AjaxPut("/report/po_lead", tbPoReport, Data);
  });

  $("#ReportDownloadBtn_").unbind();
  $("#ReportDownloadBtn_").on("click", function () {
    let ReportFilter = $("#ReportFilter_").val();
    let { FromDate } = getFilter(ReportFilter);
    let Filter = JSON.stringify(getFilter(ReportFilter));
    let Section = $('#Dp_SectionM').val() || 'ALL'
    if (ReportFilter == 1) window.open(`/report/export_daily/${Filter}`);
    if (ReportFilter == 2) window.open(`/report/export_monthly/${FromDate}-01&${Section}`);
    if (ReportFilter == 3) window.open(`/report/export_repair/${Filter}`);
    if (ReportFilter == 4) window.open(`/report/export_po/${Filter}`);
  });
});
