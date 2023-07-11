$(document).ready(function () {
  // $('#RepairOrderList thead tr').clone(true).addClass('filters').appendTo('#RepairOrderList thead')
  // $('#RepairOrderList .filters th').each(function (i) {
  //   var title = $('#RepairOrderList thead th').eq($(this).index()).text();
  //   $(this).html('<input class="form-control p-1" type="text" placeholder="' + title + '" />');
  // });
  // let RepairOrderTable = $('#RepairOrderList').DataTable({
  //   // paging: false,
  //   // searching: false,
  //   // bFilter: true,
  //   // info: false,
  //   ordering: false,
  //   dom: 'rt',
  //   // initComplete: function () {
  //   //   $('#SectionFilter').on('change', function () {
  //   //     RepairOrderTable.columns(3).search(this.value).draw()
  //   //   })
  //   // }
  // })
  // RepairOrderTable.columns().eq(0).each(function (colIdx) {
  //   $('input', $('.filters th')[colIdx]).on('keyup change', function () {
  //     console.log(RepairOrderTable.column(colIdx).search(this.value))
  //     RepairOrderTable.column(colIdx)
  //       .search(this.value)
  //       .draw();
  //   })
  // })

  $('#DailyReportTable thead tr').clone(true).addClass('filters').appendTo('#DailyReportTable thead')
  $('#DailyReportTable .filters th').each(function (i) {
    var title = $('#DailyReportTable thead th').eq($(this).index()).text();
    $(this).html('<input class="form-control p-1 w-100" type="text" placeholder="' + title + '" />');
  });

  let DailyReportTable = $('#DailyReportTable').DataTable({
    // scrollX: true,
    scrollY: true,
    // scrollCollapse: true,
    dom: 'rt',
    initComplete: function () {

    }
  })
  DailyReportTable.columns().eq(0).each(function (colIdx) {
    $('input', $('.filters th')[colIdx]).on('keyup change', function () {
      console.log(DailyReportTable.column(colIdx).search(this.value))
      DailyReportTable.column(colIdx)
        .search(this.value)
        .draw();
    })
  })


});
