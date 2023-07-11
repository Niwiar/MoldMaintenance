function filltbPart() {
  tbPart = $('#tbPart').DataTable({
    bDestroy: true,
    scrollCollapse: true,
    searching: true,
    paging: true,
    lengthChange: false,
    info: false,
    autoWidth: false,
    dom: 'rtp',
    ajax: {
      url: '/part_master/list',
      dataSrc: '',
    },
    columns: [
      {
        data: 'index',
      },
      {
        data: 'PartSection',
      },
      {
        data: 'PartName',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        data: 'PartNo',
        render: function (data) {
          return `<div class="d-flex justify-content-start align-item-center"><span class="text-start">${data}</span></div>`;
        },
      },
      {
        width: '20%',
        defaultContent:
          '<div class="btn-group btn-group-sm" role="group"><button class="btn btn-warning" id="EditPartBtn" type="button" data-bs-target="#modalPartDetail" data-bs-toggle="modal"><i class="fa fa-pencil-square-o m-1"></i>แก้ไข</button><button class="btn btn-danger ms-1" id="DeletePartBtn" type="button"><i class="fa fa-remove m-1"></i>ลบ</button></div>',
      },
    ],
  });
}

function dropDownPartSection() {
  $.ajax({
    url: '/dropdown/section/ALL',
    method: 'get',
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      // console.log(res)
      if (res.length == 0) {
        $('#PartSection_ option, #PartSection_ optgroup').remove();
        $('#PartSection_').append(
          "<optgroup label='No data in database'></optgroup>"
        );
      } else {
        $('#PartSection_ option, #PartSection_ optgroup').remove();
        res.forEach((obj) => {
          $('#PartSection_').append(
            "<option value='" +
              obj.Section +
              "'> " +
              '<span>' +
              obj.Section +
              '</span>' +
              '</option>'
          );
        });
      }
    },
    error: function (err) {
      $('#PartSection_ option, #PartSection_ optgroup').remove();
      $('#PartSection_').append(
        "<optgroup label='No data in database'></optgroup>"
      );
    },
  });
}

function searchtbPart() {
  $('#tbPart thead tr')
    .clone(true)
    .addClass('filters')
    .appendTo('#tbPart thead');
  $('#tbPart .filters th').each(function (i) {
    var title = $('#tbPart thead th').eq($(this).index()).text();
    if (title != 'action') {
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
  tbPart
    .columns()
    .eq(0)
    .each(function (colIdx) {
      $('input', $('#tbPart .filters th')[colIdx]).on(
        'keyup change',
        function () {
          // console.log(tbPart.column(colIdx).search(this.value))
          // console.log('event', colIdx)
          console.log(colIdx, this.value);

          // console.log(colIdx)
          tbPart.column(colIdx).search(this.value).draw();
        }
      );
    });
}

$(document).ready(() => {
  filltbPart();
  searchtbPart();
  dropDownPartSection();

  $('#DownloadPartBtn').unbind();
  $('#DownloadPartBtn').click(async (e) => {
    window.open(`/import_master/download/MasterPart`);
  });
  // Import Part
  $('#ImportPartBtn').unbind();
  $('#ImportPartBtn').click(async (e) => {
    $('#ImportPartFile').click();
  });
  $('#ImportPartFile').change(async (e) => {
    let ajaxUrl = `/import_master/MasterPart`;
    let ExFile = $('#ImportPartFile').prop('files')[0];
    let Excel = new FormData();
    Excel.append('masterfile', ExFile, 'MasterPart');
    AjaxImportExcel(ajaxUrl, tbPart, Excel);
    $('#ImportPartFile').val('');
  });

  // Add Part
  $('#AddPartBtn').unbind();
  $('#AddPartBtn').on('click', function () {
    $('#modalPartDetail').modal('show');
    $('#PartForm').trigger('reset');
    $('#PartSection_').removeAttr('disabled');

    $('#PartSubmitBtn').unbind();
    $('#PartSubmitBtn').on('click', () => {
      let PartSection = $.trim($('#PartSection_').val());
      let PartName = $.trim($('#PartName_').val());
      let PartNo = $.trim($('#PartNo_').val());
      let Data = {
        PartSection: PartSection,
        PartName: PartName,
        PartNo: PartNo,
      };
      AjaxPost(`part_master/add`, tbPart, Data, $('#modalPartDetail'));
    });
    $('.close,.no').click(function () {
      $('#modalPartDetail').modal('hide');
    });
  });

  // error //
  // Edit Part
  $('#tbPart').unbind();
  $('#tbPart').on('click', '#EditPartBtn', function () {
    $('#modalPartDetail').modal('show');
    $('#PartForm').trigger('reset');
    // $("#PartSection_").attr("disabled", "disabled");
    let tr = $(this).closest('tr');
    let { PartId, PartNo, PartName, PartSection } = tbPart.row(tr).data();

    $('#PartName_').val(PartName);
    $('#PartNo_').val(PartNo);
    $('#PartSection_').val(PartSection);

    $('#PartSubmitBtn').unbind();
    $('#PartSubmitBtn').on('click', () => {
      let Data = {
        PartId: PartId,
        PartSection: $('#PartSection_').val(),
        PartName: $('#PartName_').val(),
        PartNo: $('#PartNo_').val(),
      };
      AjaxPut(`/part_master/edit`, tbPart, Data, $('#modalPartDetail'));
    });
    $('.close,.no').click(function () {
      $('#modalPartDetail').modal('hide');
    });
  });

  // Delete Part
  $('#tbPart').on('click', '#DeletePartBtn', function () {
    tr = $(this).closest('tr');
    let { PartId } = tbPart.row(tr).data();
    AjaxDelete('/part_master/delete/' + PartId, tbPart);
  });
});
