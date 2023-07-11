function filltbMold() {
  tbMold = $("#tbMold").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    dom: "rtp",
    ajax: {
      url: "/mold_master/list",
      dataSrc: "",
    },
    columns: [
      {
        data: "index",
      },
      {
        data: "MoldSection",
      },
      {
        data: "MoldName",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: "MoldControlNo",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: "MoldCavity",
      },
      {
        data: "OtherPlan",
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: "CleaningPlan",
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: "PreventivePlan",
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: "LifeShot",
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: "DangerPercent",
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        data: "WarnPercent",
        render: function (data, type, row) {
          if (!data) return `-`;
          else return data;
        },
      },
      {
        width: "20%",
        defaultContent:
          '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditMoldBtn" type="button" data-bs-target="#modalMoldDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelMoldBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button></div>',
      },
    ],
  });
}

function filltbDataPart(MoldId) {
  tbDataPart = $("#tbDataPart").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: false,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    ajax: {
      url: "/mold_master/data_part/" + MoldId,
      dataSrc: "",
    },
    columns: [
      {
        data: "index",
      },
      {
        data: "PartName",
      },
      {
        width: "15%",
        defaultContent:
          '<button class="btn btn-danger btn-sm ms-1" id="DelMoldPartBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button>',
      },
    ],
  });
}

function filltbDataMc(MoldId) {
  tbDataMc = $("#tbDataMc").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: false,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    ajax: {
      url: "/mold_master/data_mc/" + MoldId,
      dataSrc: "",
    },
    columns: [
      {
        data: "index",
      },
      {
        data: "McName",
      },
      {
        width: "15%",
        defaultContent:
          '<button class="btn btn-danger btn-sm ms-1" id="DelMoldMcBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button>',
      },
    ],
  });
}

function searchtbMold() {
  $("#tbMold thead tr")
    .clone(true)
    .addClass("filters")
    .appendTo("#tbMold thead");
  $("#tbMold .filters th").each(function (i) {
    var title = $("#tbMold thead th").eq($(this).index()).text();
    if (title != "action") {
      $(this).html(
        '<input class="form-control p-1" type="text" placeholder="' +
          title +
          '" />'
      );
    } else {
      $(this).html(
        '<input class="form-control p-1" type="text" placeholder="' +
          title +
          '" disabled/>'
      );
    }
  });
  tbMold
    .columns()
    .eq(0)
    .each(function (colIdx) {
      $("input", $("#tbMold .filters th")[colIdx]).on(
        "keyup change",
        function () {
          console.log(colIdx, this.value);
          tbMold.column(colIdx).search(this.value).draw();
        }
      );
    });
}

function dropDownMoldSection() {
  $.ajax({
    url: "/dropdown/section/ALL",
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      // console.log(res)
      if (res.length == 0) {
        $("#MoldSection_ option, #MoldSection_ optgroup").remove();
        $("#MoldSection_").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $("#MoldSection_ option, #MoldSection_ optgroup").remove();
        res.forEach((obj) => {
          $("#MoldSection_").append(
            "<option value='" +
              obj.Section +
              "'> " +
              "<span>" +
              obj.Section +
              "</span>" +
              "</option>"
          );
        });
      }
    },
    error: function (err) {
      $("#MoldSection_ option, #MoldSection_ optgroup").remove();
      $("#MoldSection_").append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}

$(document).ready(() => {
  filltbMold();
  searchtbMold();
  dropDownMoldSection();
  $("#DownloadMoldBtn").unbind();
  $("#DownloadMoldBtn").click(async (e) => {
    window.open(`/import_master/download/MasterMold`);
  });
  // Import Mold
  $("#ImportMoldBtn").unbind();
  $("#ImportMoldBtn").click(async (e) => {
    $("#ImportMoldFile").click();
  });
  $("#ImportMoldFile").change(async (e) => {
    let ajaxUrl = `/import_master/MasterMold`;
    let ExFile = $("#ImportMoldFile").prop("files")[0];
    let Excel = new FormData();
    Excel.append("masterfile", ExFile, "MasterMold");
    AjaxImportExcel(ajaxUrl, tbMold, Excel);
    $("#ImportMoldFile").val("");
  });

  // Add Mold
  $("#AddMoldBtn").unbind();
  $("#AddMoldBtn").on("click", function () {
    $("#modalMoldDetail").modal("show");
    $("#MoldForm").trigger("reset");
    $("#MoldEditPartMc").addClass("d-none");
    $("#MoldSection_").removeAttr("disabled");

    $("#MoldSubmitBtn").unbind();
    $("#MoldSubmitBtn").on("click", () => {
      let Data = {
        MoldSection: $("#MoldSection_").val(),
        MoldName: $("#MoldName_").val(),
        MoldControlNo: $("#MoldControl_").val(),
        MoldCavity: $("#Cavity_").val(),
        OtherPlan: $("#OtherPlan_").val(),
        CleaningPlan: $("#CleaningPlan_").val(),
        PreventivePlan: $("#PreventivePlan_").val(),
        LifeShot: $("#LifeShot_").val(),
        DangerPercent: $("#Danger_").val(),
        WarnPercent: $("#Warning_").val(),
      };
      AjaxPost(`/mold_master/add`, tbMold, Data, $("#modalMoldDetail"));
    });
    $(".close,.no").click(function () {
      $("#modalMoldDetail").modal("hide");
    });
  });

  // Edit Mold
  $("#tbMold").unbind();
  $("#tbMold").on("click", "#EditMoldBtn", function () {
    $("#modalMoldDetail").modal("show");
    $("#MoldForm").trigger("reset");
    $("#MoldEditPartMc").removeClass("d-none");
    let tr = $(this).closest("tr");
    let {
      MoldId,
      MoldSection,
      MoldName,
      MoldControlNo,
      MoldCavity,
      OtherPlan,
      CleaningPlan,
      PreventivePlan,
      LifeShot,
      DangerPercent,
      WarnPercent
    } = tbMold.row(tr).data();
    filltbDataPart(MoldId);
    filltbDataMc(MoldId);

    $("#MoldSection_").val(MoldSection);
    $("#MoldName_").val(MoldName);
    $("#MoldControl_").val(MoldControlNo);
    $("#Cavity_").val(MoldCavity);
    $("#OtherPlan_").val(OtherPlan);
    $("#CleaningPlan_").val(CleaningPlan);
    $("#PreventivePlan_").val(PreventivePlan);
    $("#LifeShot_").val(LifeShot);
    $("#Danger_").val(DangerPercent);
    $("#Warning_").val(WarnPercent);

    // Dropdown Part
    $.ajax({
      url: "/dropdown/part_section/" + MoldSection,
      method: "get",
      contentType: "application/json",
      dataType: "json",
      success: function (res) {
        if (res.length == 0) {
          $("#MoldPartSelect option").remove();
          $("#MoldPartSelect optgroup").remove();
          $("#MoldPartSelect").append(
            "<optgroup label='No data in database'></optgroup>"
          );
        } else {
          $("#MoldPartSelect option").remove();
          $("#MoldPartSelect optgroup").remove();
          res.forEach((obj) => {
            $("#MoldPartSelect").append(
              `<option value='${obj.PartId}'>
                <span>${obj.PartName} (${obj.PartNo})</span>
              </option>`
            );
          });
        }
      },
      error: function (err) {
        $("#MoldPartSelect option").remove();
        $("#MoldPartSelect optgroup").remove();
        $("#MoldPartSelect").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      },
    });

    // Dropdown Mc
    $.ajax({
      url: "/dropdown/mc_section/" + MoldSection,
      method: "get",
      contentType: "application/json",
      dataType: "json",
      success: function (res) {
        if (res.length == 0) {
          $("#MoldMcSelect option").remove();
          $("#MoldMcSelect optgroup").remove();
          $("#MoldMcSelect").append(
            "<optgroup label='No data in database'></optgroup>"
          );
        } else {
          $("#MoldMcSelect option").remove();
          $("#MoldMcSelect optgroup").remove();
          res.forEach((obj) => {
            $("#MoldMcSelect").append(
              `<option value='${obj.McId}'> 
                <span>${obj.McName} </span>
              </option>`
            );
          });
        }
      },
      error: function (err) {
        $("#MoldMcSelect option").remove();
        $("#MoldMcSelect optgroup").remove();
        $("#MoldMcSelect").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      },
    });

    // Add MoldPart
    $("#AddMoldPartBtn").unbind();
    $("#AddMoldPartBtn").on("click", function () {
      let Data = {
        MoldId: MoldId,
        PartId: $("#MoldPartSelect").val(),
      };
      AjaxPost(`/mold_master/add_part`, tbDataPart, Data);
    });

    // Delete MoldPart
    $("#tbDataPart").unbind();
    $("#tbDataPart").on("click", "#DelMoldPartBtn", function () {
      let tr = $(this).closest("tr");
      let { MoldPartId } = tbDataPart.row(tr).data();
      AjaxDelete(`/mold_master/delete_part/${MoldPartId}`, tbDataPart, "post");
    });

    // Add MoldMc
    $("#AddMoldMcBtn").unbind();
    $("#AddMoldMcBtn").on("click", function () {
      let Data = {
        MoldId: MoldId,
        McId: $("#MoldMcSelect").val(),
      };
      AjaxPost(`/mold_master/add_mc`, tbDataMc, Data);
    });

    // Delete MoldMc
    $("#tbDataMc").unbind();
    $("#tbDataMc").on("click", "#DelMoldMcBtn", function () {
      let tr = $(this).closest("tr");
      let { MoldMcId } = tbDataMc.row(tr).data();
      AjaxDelete(`/mold_master/delete_mc/${MoldMcId}`, tbDataMc, "post");
    });

    $("#MoldSubmitBtn").unbind();
    $("#MoldSubmitBtn").on("click", () => {
      let Data = {
        MoldId: MoldId,
        MoldSection: $("#MoldSection_").val(),
        MoldName: $("#MoldName_").val(),
        MoldControlNo: $("#MoldControl_").val(),
        MoldCavity: $("#Cavity_").val(),
        OtherPlan: $("#OtherPlan_").val(),
        CleaningPlan: $("#CleaningPlan_").val(),
        PreventivePlan: $("#PreventivePlan_").val(),
        LifeShot: $("#LifeShot_").val(),
        DangerPercent: $("#Danger_").val(),
        WarnPercent: $("#Warning_").val(),
      };
      AjaxPut(`/mold_master/edit`, tbMold, Data, $("#modalMoldDetail"));
    });
    $(".close,.no").click(function () {
      $("#modalMoldDetail").modal("hide");
    });
  });

  // Delete Mold
  $("#tbMold").on("click", "#DelMoldBtn", function () {
    tr = $(this).closest("tr");
    let { MoldId } = tbMold.row(tr).data();
    AjaxDelete("/mold_master/delete/" + MoldId, tbMold);
  });
});
