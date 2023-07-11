function filltbDmUser() {
  tbDmUser = $('#tbDmUser').DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    dom: 'rtp',
    ajax: {
      url: '/user_master/list/DM',
      dataSrc: '',
    },
    columns: [
      {
        data: 'index',
      },
      {
        data: 'Section',
      },
      {
        data: 'Position',
      },
      {
        data: 'UserNo',
      },
      {
        data: 'Fullname',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: 'Email',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: 'Username',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: 'Userpass',
      },
      {
        data: 'MgAltCheckOrder',
        render: function (data, type, row) {
          let CheckStatus = data == 0 ? '' : 'checked';
          return (
            " <div class='form-check d-flex justify-content-center align-items-center'><input class='form-check-input' type='checkbox' value='" +
            data +
            "' id='CheckOrder' " +
            CheckStatus +
            '></div>'
          );
        },
      },
      {
        data: 'MgAltApproveOrder',
        render: function (data, type, row) {
          let CheckStatus = data == 0 ? '' : 'checked';
          return (
            " <div class='form-check d-flex justify-content-center align-items-center'><input class='form-check-input' type='checkbox' value='" +
            data +
            "' id='ApproveOrder' " +
            CheckStatus +
            '></div>'
          );
        },
      },
      {
        width: '20%',
        render: function (data, type, row) {
          let disabled = row.Position == 'ADMIN' ? 'disabled' : '';
          return `<div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-warning" id="EditDmUserBtn" type="button" ${disabled}><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button>
            <button class="btn btn-danger ms-1" id="DelDmUserBtn" type="button" ${disabled}><i class="fa fa-remove m-1"></i>ลบ</button>
          </div>`;
        },
      },
    ],
  });
}
function DropdownDmUserSection() {
  $.ajax({
    url: '/dropdown/section/DM',
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.length == 0) {
        $('#DmUserSection_ option, #DmUserSection_ optgroup').remove();
        $('#UserPosition_ option, #UserPosition_ optgroup').remove();
        $('#DmUserSection_, #UserPosition_').append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        DropdownDmUserPosition(res[0].SectionId);
        $('#DmUserSection_ option, #DmUserSection_ optgroup').remove();
        res.forEach((obj) => {
          $('#DmUserSection_').append(
            `<option value='${obj.SectionId}'><span>${obj.Section}</span></option>`
          );
        });
      }
    },
    error: function (err) {
      $('#DmUserSection_ option, #DmUserSection_ optgroup').remove();
      $('#UserPosition_ option, #UserPosition_ optgroup').remove();
      $('#DmUserSection_, #UserPosition_').append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}
function DropdownDmUserPosition(sectionId, positionId = null) {
  $.ajax({
    url: '/dropdown/position/' + sectionId,
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      //   console.log("DropdownPosition: ", res);
      let selectStatus;

      if (res.length == 0) {
        $('#UserPosition_ option, #UserPosition_ optgroup').remove();
        $('#UserPosition_').append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $('#UserPosition_ option, #UserPosition_ optgroup').remove();
        res.forEach((obj) => {
          selectStatus =
            positionId == obj.PositionId && positionId != null
              ? 'selected'
              : '';
          $('#UserPosition_').append(
            `<option value='${obj.PositionId}' ${selectStatus}><span>${obj.Position}</span></option>`
          );
        });
      }
    },

    error: function (err) {
      $('#UserPosition_ option, #UserPosition_ optgroup').remove();
      $('#UserPosition_').append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}
$(document).ready(() => {
  filltbDmUser();
  searchtbDmUser();
  DropdownDmUserSection();
  // Dropdown section
  $('#DmUserSection_').change(function () {
    if ($(this).find('option:selected span').text() == 'DM')
      DropdownDmUserPosition($(this).val());
  });
  // Add DmUser
  $(document).on('click', '#AddDmUserBtn', function () {
    $('#DmUserSection_').show();
    $('#UserSection_').hide();
    $('#modalUserDetail').modal('show');
    $('#MfgUserForm').trigger('reset');

    $('#UserSubmit').unbind();
    $('#UserSubmit').on('click', () => {
      let SectionId = $.trim($('#DmUserSection_').val());
      let PositionId = $.trim($('#UserPosition_').val());
      let Fullname = $.trim($('#Name_').val());
      let Email = $.trim($('#Email_').val());
      let Username = $.trim($('#Username_').val());
      let Userpass = $.trim($('#Password_').val());

      let Data = JSON.stringify({
        SectionId: SectionId,
        PositionId: PositionId,
        Fullname: Fullname,
        Email: Email,
        Username: Username,
        Userpass: Userpass,
      });
      // Pic add
      AjaxPostWithImage(
        `/user_master/add/${Data}`,
        tbDmUser,
        $('#modalUserDetail')
      );
    });
    $('.close,.no').click(function () {
      $('#modalUserDetail').modal('hide');
    });
  });

  // Edit DmUser
  $(document).on('click', '#EditDmUserBtn', function () {
    $('#DmUserSection_').show();
    $('#UserSection_').hide();
    $('#modalUserDetail').modal('show');
    $('#MfgUserForm').trigger('reset');
    let tr = $(this).closest('tr');
    let { UserId, SectionId, PositionId, Fullname, Email, Username, Userpass } =
      tbDmUser.row(tr).data();
    DropdownDmUserPosition(SectionId, PositionId);

    $('#DmUserSection_').val(SectionId);
    $('#UserPosition_').val(PositionId);
    $('#Name_').val(Fullname);
    $('#Email_').val(Email);
    $('#Username_').val(Username);
    $('#Password_').val(Userpass);

    $('#UserSubmit').unbind();
    $('#UserSubmit').on('click', () => {
      let SectionId = $.trim($('#DmUserSection_').val());
      let PositionId = $.trim($('#UserPosition_').val());
      let Fullname = $.trim($('#Name_').val());
      let Email = $.trim($('#Email_').val());
      let Username = $.trim($('#Username_').val());
      let Userpass = $.trim($('#Password_').val());

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
        tbDmUser,
        $('#modalUserDetail')
      );
    });
    $('.close,.no').click(function () {
      $('#modalUserDetail').modal('hide');
    });
  });

  // Delete DmUser
  $(document).on('click', '#DelDmUserBtn', function () {
    tr = $(this).closest('tr');
    let { UserId } = tbDmUser.row(tr).data();
    AjaxDelete(`/user_master/del/${UserId}`, tbDmUser);
  });

  //ALT Change Check & Approver
  $(document).on('click', '#CheckOrder, #ApproveOrder', function (e) {
    tr = $(this).closest('tr');
    let { UserId } = tbDmUser.row(tr).data();
    let statusUserCheckBox, ajaxURL, Data, swalTitle;
    statusUserCheckBox = $(this).is(':checked') ? 1 : 0;
    // console.log(e.target.id);
    if (e.target.id == 'CheckOrder') {
      ajaxURL = '/user_master/altcheck';
      swalTitle = 'Change Alternate Check';
      Data = {
        UserId: UserId,
        MgAltCheckOrder: statusUserCheckBox,
      };
    } else {
      ajaxURL = '/user_master/altapprove';
      swalTitle = 'Change Alternate Approver';
      Data = {
        UserId: UserId,
        MgAltApproveOrder: statusUserCheckBox,
      };
    }
    AjaxPutCheckbox(ajaxURL, tbDmUser, Data, swalTitle);
  });
});
