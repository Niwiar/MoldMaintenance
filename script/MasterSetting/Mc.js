let tbMc;
function filltbMc() {
  tbMc = $("#tbMc").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    dom: "rtp",
    ajax: {
      url: "/mc_master/list",
      dataSrc: "",
    },
    columns: [
      {
        data: "index",
      },
      {
        data: "McSection",
      },
      {
        data: "McName",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        width: "20%",
        defaultContent:
          '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditMcBtn" type="button" data-bs-target="#modalMcDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelMcBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button></div>',
      },
    ],
  });
}
function searchtbMc() {
  $("#tbMc thead tr").clone(true).addClass("filters").appendTo("#tbMc thead");
  $("#tbMc .filters th").each(function (i) {
    var title = $("#tbMc thead th").eq($(this).index()).text();
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
  tbMc
    .columns()
    .eq(0)
    .each(function (colIdx) {
      $("input", $("#tbMc .filters th")[colIdx]).on(
        "keyup change",
        function () {
          // console.log(colIdx, this.value)
          tbMc.column(colIdx).search(this.value).draw();
        }
      );
    });
}

function dropDownMcSection() {
  $.ajax({
    url: "/dropdown/section/ALL",
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      // console.log(res)
      if (res.length == 0) {
        $("#McSection_ option, #McSection_ optgroup").remove();
        $("#McSection_").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $("#McSection_ option, #McSection_ optgroup").remove();
        res.forEach((obj) => {
          $("#McSection_").append(
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
      $("#McSection_ option, #McSection_ optgroup").remove();
      $("#McSection_").append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}

$(document).ready(() => {
  filltbMc();
  searchtbMc();
  dropDownMcSection();

  $("#DownloadMcBtn").unbind();
  $("#DownloadMcBtn").click(async (e) => {
    window.open(`/import_master/download/MasterMc`);
  });
  // Import Mc
  $("#ImportMcBtn").unbind();
  $("#ImportMcBtn").click(async (e) => {
    $("#ImportMcFile").click();
  })
  $("#ImportMcFile").change(async (e) => {
    console.log('object')
    let ajaxUrl = `/import_master/MasterMc`;
    let ExFile = $('#ImportMcFile').prop('files')[0];
    let Excel = new FormData()
    Excel.append('masterfile', ExFile, 'MasterMc')
    AjaxImportExcel(ajaxUrl, tbMc, Excel)
    $("#ImportMcFile").val('')
  });

  // Add Mc
  $("#AddMcBtn").on("click", function () {
    $("#modalMcDetail").modal("show");
    $("#McForm").trigger("reset");
    $("#McSection_").removeAttr("disabled");

    $("#McSubmitBtn").unbind();
    $("#McSubmitBtn").on("click", () => {
      let Data = {
        McName: $("#McName_").val(),
        McSection: $("#McSection_").val(),
      };
      AjaxPost(`/mc_master/add`, tbMc, Data);
    });
    $(".close,.no").click(function () {
      $("#modalMcDetail").modal("hide");
    });
  });

  // Edit Mc
  $('#tbMc').unbind();
  $('#tbMc').on("click", "#EditMcBtn", function () {
    $("#modalMcDetail").modal("show");
    $("#McForm").trigger("reset");
    // $("#McSection_").attr("disabled", "disabled");
    let tr = $(this).closest("tr");
    let { McId, McSection, McName } = tbMc.row(tr).data();

    $("#McName_").val(McName);
    $("#McSection_").val(McSection);

    $("#McSubmitBtn").unbind();
    $("#McSubmitBtn").on("click", () => {
      let Data = {
        McId: McId,
        McName: $("#McName_").val(),
        McSection: $("#McSection_").val(),
      };
      AjaxPut(`/mc_master/edit`, tbMc, Data);
    });
    $(".close,.no").click(function () {
      $("#modalMcDetail").modal("hide");
    });
  });

  // Delete Mc
  $('#tbMc').on("click", "#DelMcBtn", function () {
    tr = $(this).closest("tr");
    let { McId } = tbMc.row(tr).data();
    AjaxDelete("/mc_master/delete/" + McId, tbMc);
  });
});
