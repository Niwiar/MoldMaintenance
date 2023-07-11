function filltbProblem(ProblemType) {
  if (ProblemType == 1) {
    tbProb = $("#tbProb").DataTable({
      bDestroy: true,
      scrollCollapse: true,
      searching: false,
      paging: true,
      lengthChange: false,
      info: false,
      autoWidth: false,
      ajax: {
        url: "/problem_master/list/" + ProblemType,
        dataSrc: "",
      },
      columns: [
        {
          data: "ProblemNo",
        },
        {
          data: "Problem",
          render: function (data) {
            return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
          },
        },
        {
          width: "20%",
          defaultContent:
            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditProbBtn" type="button" data-bs-target="#modalProblemDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelProbBtn" type="button"><i class="fa fa-remove m-1" id="DelProbBtn"></i>ลบ</button></div>',
        },
      ],
    });
  } else {
    tbPrep = $("#tbPrep").DataTable({
      bDestroy: true,
      scrollCollapse: true,
      searching: false,
      paging: true,
      lengthChange: false,
      info: false,
      autoWidth: false,
      ajax: {
        url: "/problem_master/list/" + ProblemType,
        dataSrc: "",
      },
      columns: [
        {
          data: "ProblemNo",
        },
        {
          data: "Problem",
          render: function (data) {
            return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
          },
        },
        {
          width: "20%",
          defaultContent:
            '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditPrepBtn" type="button" data-bs-target="#modalProblemDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelPrepBtn" type="button"><i class="fa fa-remove m-1" id="DelProbBtn"></i>ลบ</button></div>',
        },
      ],
    });
  }
}

$(document).ready(() => {
  filltbProblem(1);
  filltbProblem(2);
  // Add Problem 1
  $("#AddProbBtn").unbind();
  $("#AddProbBtn").on("click", function () {
    let Data = {
      ProblemType: 1,
      ProblemNo: $("#ProbNo_").val(),
      Problem: $("#Prob_").val(),
    };
    AjaxPost(`problem_master/add`, tbProb, Data);
    $("#ProbNo_").val("");
    $("#Prob_").val("");
  });

  // Edit Problem 1
  $('#tbProb').unbind();
  $('#tbProb').on("click", "#EditProbBtn", function () {
    console.log('aaaaaaaa')
    $("#modalProblemDetail").modal("show");
    $("#ProblemForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { ProblemId, Problem, ProblemNo } = tbProb.row(tr).data();

    $("#ProblemNo_").val(ProblemNo);
    $("#Problem_").val(Problem);

    $("#ProblemSubmitBtn").unbind();
    $("#ProblemSubmitBtn").on("click", () => {
      let Data = {
        ProblemId: ProblemId,
        ProblemNo: $("#ProblemNo_").val(),
        Problem: $("#Problem_").val(),
      };
      AjaxPut(
        `problem_master/edit`,
        tbProb,
        Data,
        $("#modalProblemDetail").modal("hide")
      );
    });
    $(".close,.no").click(function () {
      $("#modalProblemDetail").modal("hide");
    });
  });

  // Delete Problem 1
  $('#tbProb').on("click", "#DelProbBtn", function () {
    tr = $(this).closest("tr");
    let { ProblemId } = tbProb.row(tr).data();
    AjaxDelete("/problem_master/delete/" + ProblemId, tbProb);
  });

  // Add Problem 2
  $("#AddPrepBtn").unbind();
  $("#AddPrepBtn").on("click", function () {
    let Data = {
      ProblemType: 2,
      ProblemNo: $("#PrepNo_").val(),
      Problem: $("#Prep_").val(),
    };
    AjaxPost(`problem_master/add`, tbPrep, Data);
    $("#PrepNo_").val("");
    $("#Prep_").val("");
  });

  // Edit Problem 2
  $('#tbPrep').unbind();
  $('#tbPrep').on("click", "#EditPrepBtn", function () {
    $("#modalProblemDetail").modal("show");
    $("#ProblemForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { ProblemId, Problem, ProblemNo } = tbPrep.row(tr).data();

    $("#ProblemNo_").val(ProblemNo);
    $("#Problem_").val(Problem);

    $("#ProblemSubmitBtn").unbind();
    $("#ProblemSubmitBtn").on("click", () => {
      let Data = {
        ProblemId: ProblemId,
        ProblemNo: $("#ProblemNo_").val(),
        Problem: $("#Problem_").val(),
      };
      AjaxPut(`problem_master/edit`, tbPrep, Data, $("#modalProblemDetail"));
    });
    $(".close,.no").click(function () {
      $("#modalProblemDetail").modal("hide");
    });
  });

  // Delete Problem 1
  $('#tbPrep').on("click", "#DelPrepBtn", function () {
    tr = $(this).closest("tr");
    let { ProblemId } = tbPrep.row(tr).data();
    AjaxDelete("/problem_master/delete/" + ProblemId, tbPrep);
  });
});
