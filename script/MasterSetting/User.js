function filltbUser() {
  tbUser = $("#tbUser").DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    dom: "rtp",
    ajax: {
      url: "/user_master/list/ALL",
      dataSrc: "",
    },
    columns: [
      {
        data: "index",
      },
      {
        data: "Section",
      },
      {
        data: "Position",
      },
      {
        data: "UserNo",
      },
      {
        data: "Fullname",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: "Email",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: "Username",
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: "Userpass",
      },
      {
        data: "MgQaOrder",
        render: function (data, type, row) {
          let CheckStatus = data == 0 ? "" : "checked";
          return (
            " <div class='form-check d-flex justify-content-center align-items-center'><input class='form-check-input' type='checkbox' value='" +
            data +
            "' id='QaOrder' " +
            CheckStatus +
            "></div>"
          );
        },
      },
      {
        width: "20%",
        defaultContent:
          '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditUserBtn" type="button"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DelUserBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button></div>',
      },
    ],
  });
}
function DropdownSection() {
  $.ajax({
    url: "/dropdown/section/ALL",
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      // console.log(res)
      if (res.length == 0) {
        $("#UserSection_ option, #UserSection_ optgroup").remove();
        $("#UserPosition_ option, #UserPosition_ optgroup").remove();
        $("#UserSection_, #UserPosition_").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        DropdownPosition(res[0].SectionId);
        $("#UserSection_ option, #UserSection_ optgroup").remove();
        res.forEach((obj) => {
          $("#UserSection_").append(
            `<option value ='${obj.SectionId}'><span>${obj.Section}</span></option>`
          );
        });
      }
    },
    error: function (err) {
      $("#UserSection_ option, #UserSection_ optgroup").remove();
      $("#UserPosition_ option, #UserPosition_ optgroup").remove();
      $("#UserSection_, #UserPosition_").append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}
function DropdownPosition(sectionId, positionId = null) {
  $.ajax({
    url: "/dropdown/position/" + sectionId,
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      // console.log("DropdownPosition: ", res);
      let selectStatus;
      if (res.length == 0) {
        $("#UserPosition_ option, #UserPosition_ optgroup").remove();
        $("#UserPosition_").append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $("#UserPosition_ option, #UserPosition_ optgroup").remove();
        res.forEach((obj) => {
          selectStatus =
            positionId == obj.PositionId && positionId != null
              ? "selected"
              : "";
          $("#UserPosition_").append(
            `<option value='${obj.PositionId}' ${selectStatus}><span>${obj.Position}</span></option>`
          );
        });
      }
    },
    error: function (err) {
      $("#UserPosition_ option, #UserPosition_ optgroup").remove();
      $("#UserPosition_").append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}
$(document).ready(() => {
  filltbUser();
  searchtbUser();
  DropdownSection();

  // Dropdown section
  $("#UserSection_").unbind();
  $("#UserSection_").change(function () {
    if ($(this).find("option:selected span").text() != "DM")
      DropdownPosition($(this).val());
  });
  // Add User
  $(document).on("click", "#AddUserBtn", function () {
    $("#DmUserSection_").hide();
    $("#UserSection_").show();
    $("#modalUserDetail").modal("show");
    $("#MfgUserForm").trigger("reset");

    $("#UserSubmit").unbind();
    $("#UserSubmit").on("click", () => {
      let SectionId = $.trim($("#UserSection_").val());
      let PositionId = $.trim($("#UserPosition_").val());
      let Fullname = $.trim($("#Name_").val());
      let Email = $.trim($("#Email_").val());
      let Username = $.trim($("#Username_").val());
      let Userpass = $.trim($("#Password_").val());

      let Data = JSON.stringify({
        SectionId: SectionId,
        PositionId: PositionId,
        Fullname: Fullname,
        Email: Email,
        Username: Username,
        Userpass: Userpass,
      });

      AjaxPostWithImage(
        `/user_master/add/${Data}`,
        tbUser,
        $("#modalUserDetail")
      );
    });
    $(".close,.no").click(function () {
      $("#modalUserDetail").modal("hide");
    });
  });

  // Edit User
  $(document).on("click", "#EditUserBtn", function () {
    $("#DmUserSection_").hide();
    $("#UserSection_").show();
    $("#modalUserDetail").modal("show");
    $("#MfgUserForm").trigger("reset");
    let tr = $(this).closest("tr");
    let { UserId, SectionId, PositionId, Fullname, Email, Username, Userpass } =
      tbUser.row(tr).data();
    DropdownPosition(SectionId, PositionId);
    $("#UserSection_").val(SectionId);
    $("#UserPosition_").val(PositionId);
    $("#Name_").val(Fullname);
    $("#Email_").val(Email);
    $("#Username_").val(Username);
    $("#Password_").val(Userpass);

    $("#UserSubmit").unbind();
    $("#UserSubmit").on("click", () => {
      let SectionId = $.trim($("#UserSection_").val());
      let PositionId = $.trim($("#UserPosition_").val());
      let Fullname = $.trim($("#Name_").val());
      let Email = $.trim($("#Email_").val());
      let Username = $.trim($("#Username_").val());
      let Userpass = $.trim($("#Password_").val());

      let Data = JSON.stringify({
        UserId: UserId,
        SectionId: SectionId,
        PositionId: PositionId,
        Fullname: Fullname,
        Email: Email,
        Username: Username,
        Userpass: Userpass,
      });
      AjaxPutWithImage(
        `/user_master/edit/${Data}`,
        tbUser,
        $("#modalUserDetail")
      );
    });
    $(".close,.no").click(function () {
      $("#modalUserDetail").modal("hide");
    });
  });

  // Delete User
  $(document).on("click", "#DelUserBtn", function () {
    tr = $(this).closest("tr");
    let { UserId } = tbUser.row(tr).data();
    AjaxDelete(`/user_master/del/${UserId}`, tbUser);
  });

  //Change Qa
  $(document).on("click", "#QaOrder", function (e) {
    tr = $(this).closest("tr");
    let { UserId } = tbUser.row(tr).data();
    let statusUserCheckBox = $(this).is(":checked") ? 1 : 0;
    let swalTitle = "Change Alternate Qa";
    let Data = {
      UserId: UserId,
      MgQaOrder: statusUserCheckBox,
    };
    AjaxPutCheckbox("/user_master/altqa", tbUser, Data, swalTitle);
  });
});
