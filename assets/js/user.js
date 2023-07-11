const checkSidebar = (res) => {
  if (res.Section) {
    console.log(res)
    let { DmPerformance, DmReport, MasterMold, MasterProblem, MasterMfg, MasterDm, MasterPosition } = res
    if (DmPerformance) $('#PerformanceNav').show()
    if (DmReport) $(' #ReportNav').show()
    if (MasterMold || MasterProblem || MasterMfg || MasterDm || MasterPosition) $('#SettingNav').show()
  } else {
    $('#PerformanceNav, #ReportNav, #SettingNav').hide()
  }

}
const checkView = (res, url) => {
  let { DmPerformance, DmReport, MasterMold, MasterProblem, MasterMfg, MasterDm, MasterPosition } = res
  if (url == '/setting') {
    console.log('url setting')
    if (MasterMold > 0 || MasterProblem > 0 || MasterMfg > 0 || MasterDm > 0 || MasterPosition > 0) {
      $('.master-tab').show()
      $(`a[href="#mold-master"],a[href="#user-master"],a[href="#mold-tab"],a[href="#part-tab"],a[href="#mc-tab"],
        a[href="#problem-tab"],a[href="#check-tab"]`).show()
    }
    if (MasterMold < 1 && MasterProblem < 1) {
      $('a[href="#mold-master"]').hide()
      $('#mold-master').removeClass('active')
      $('a[href="#user-master"]').addClass('active').show()
      $('#user-master').addClass('active')
    } else {
      if (MasterMold < 1) {
        $('a[href="#mold-tab"],a[href="#part-tab"],a[href="#mc-tab"]').hide()
        $('#mold-tab').removeClass('active')
        $('#problem-tab').addClass('active')
      }
      if (MasterProblem < 1) {
        $('a[href="#problem-tab"],a[href="#check-tab"]').hide()
        $('#problem-tab').removeClass('active')
      }
    }
    if (MasterMfg < 1 && MasterDm < 1 && MasterPosition < 1) {
      $('a[href="#user-master"]').removeClass('active').hide()
      $('#user-master').removeClass('active')
      $('#mold-master').addClass('active')
    } else {
      if (MasterMfg < 1) {
        $('a[href="#mfg-user-tab"]').hide()
        $('#mfg-user-tab').removeClass('active')
        $('#dm-user-tab').addClass('active')
      }
      if (MasterDm < 1) {
        $('a[href="#dm-user-tab"]').hide()
        $('#dm-user-tab').removeClass('active')
        $('#section-tab').addClass('active')
      }
      if (MasterPosition < 1) {
        $('a[href="#section-tab"]').hide()
        $('#section-tab').removeClass('active')
      }
    }
  }
}


$(document).ready(function () {
  $.ajax({
    url: "/user/profile",
    method: "get",
    contentType: "application/json",
    dataType: "json",
    success: function (res) {
      $('#Username').text(res.Username)
      checkSidebar(res)
      if (res.Position) checkView(res, window.location.pathname)
    },
    error: function (err) {
      console.log(err)
    },
  });
});