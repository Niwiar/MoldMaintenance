const $ReportFilter = $("#ReportFilter_");
const $ReportDate = $("#ReportDate_");

const $DailyReport = $("#DailyReport");
const $MonthlyReport = $("#MonthlyReport");
const $SAReport = $("#SAReport");
const $POReport = $("#POReport");

const getdate = () => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  return yyyy + "-" + mm + "-" + dd;
};

const getmonth = () => {
  let today = new Date();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();
  if (mm < 10) mm = "0" + mm;
  return yyyy + "-" + mm;
};

const gettime = () => {
  let today = new Date();
  let hh = today.getHours();
  let mm = today.getMinutes();
  if (hh < 10) hh = "0" + hh;
  if (mm < 10) mm = "0" + mm;
  return hh + ":" + mm;
};
const DocNames = ['', 'Daily', 'Monthly', 'History', 'PO']
const MonthTH = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
function getDocNo(ReportFilter) {
  console.log(DocNames[ReportFilter])
  return new Promise(async (resolve, reject) => {
    $.ajax({
      url: `/report/docno/${DocNames[ReportFilter]}`,
      method: "get",
      contentType: "application/json",
      dataType: "json",
      success: function (res) {
        $('#ReportCode').val(res.DocCode)
        $('#ReportDateEff').val(res.DocDate)
        resolve("success");
      },
      error: function (err) {
        console.log(err)
        reject("failed");
      },
    })
  })
}

const ShowReport = async (Type = 1) => {
  // console.log("Type: ", Type);
  if (Type == 1) {
    $DailyReport.show();
    $MonthlyReport.hide();
    $SAReport.hide();
    $POReport.hide();
    $("#boxOfDateType_1").show();
    $("#boxOfDateType_2").hide();
    $("#boxOfDateType_3").hide();
    $("#boxOfDateType_4").hide();
    filltbDailyReport(getFilter(Type));
  } else if (Type == 2) {
    $DailyReport.hide();
    $MonthlyReport.show();
    $SAReport.hide();
    $POReport.hide();
    $("#boxOfDateType_1").hide();
    $("#boxOfDateType_2").show();
    $("#boxOfDateType_3").hide();
    $("#boxOfDateType_4").hide();
    let { FromDate } = getFilter(Type)
    let [year, month] = FromDate.split('-')
    let Section = $('#Dp_SectionM').val()
    $('#MonthlyReport .report-title').text(`บันทึกการเกิดปัญหาแม่พิมพ์ ${Section} ประจำปี ${year}`)
    $('.MonthlyReportMonth').text(MonthTH[parseInt(month)])
    Section = Section || 'ALL'
    MonthlyChartGenerate(`${FromDate}-01`, Section);
    filltbMonthlyMoldProb(`${FromDate}-01`, Section);
  } else if (Type == 3) {
    $DailyReport.hide();
    $MonthlyReport.hide();
    $SAReport.show();
    $POReport.hide();
    $("#boxOfDateType_1").hide();
    $("#boxOfDateType_2").hide();
    $("#boxOfDateType_3").show();
    $("#boxOfDateType_4").hide();
    filltbSaTable(getFilter(Type));

  } else if (Type == 4) {
    $DailyReport.hide();
    $MonthlyReport.hide();
    $SAReport.hide();
    $POReport.show();
    $("#boxOfDateType_1").hide();
    $("#boxOfDateType_2").hide();
    $("#boxOfDateType_3").hide();
    $("#boxOfDateType_4").show();
    filltbPoReport(getFilter(Type))

  }
  await getDocNo(Type);
};
const MonthlyMold = (Action, Month, Section) => {
  return new Promise(async (resolve, reject) => {
    $.ajax({
      url: `/report/monthly/${Action}/${Month}&${Section}`,
      method: "get",
      contentType: "application/json",
      dataType: "json",
    })
      .done((res) => {
        resolve(res);
      })
      .fail((err) => {
        reject(err);
      });
  });
};
const MonthlyChartConfig = async (title, maxItem, series) => {
  return {
    type: "hbar",
    legend: {
      x: "85%",
      y: "5%",
      "border-width": 1,
      "border-color": "gray",
      "border-radius": "5px",
      header: {
        text: title,
        "font-size": 12,
        "font-color": "#3333cc",
        "font-weight": "normal",
      },
      marker: {
        type: "circle",
      },
      layout: `${maxItem}x1`,
      "max-items": maxItem,
      overflow: "scroll",
    },
    plotarea: {
      "margin-right": "15%",
    },
    "scale-y": {
      guide: {
        visible: false,
      },
      item: {
        visible: true,
      },
      tick: {
        visible: false,
      },
    },
    "scale-x": {
      labels: [""],
    },
    plot: {
      animation: {
        delay: 200,
        effect: "11",
        method: '5',
        sequence: "0",
        speed: 1000
      },
      borderWidth: "2px",
    },
    series: series,
  };
};
const MonthlyChartGenerate = async (Month, Section) => {
  let problemSeries = [],
    prepareSeries = [];
  let MoldProblem = await MonthlyMold("mold_problem", Month, Section);
  let MoldPrepare = await MonthlyMold("mold_prepare", Month, Section);
  MoldProblem.forEach((Problem) => {
    let { ProblemNo, ProblemCount, ProblemPercent } = Problem;
    problemSeries.push({
      values: [ProblemCount],
      text: `${ProblemNo}`,
      "value-box":
      {
        text: `${ProblemPercent}%`,
        fontSize: "12px",
        fontColor: "#FFFFFF",
        placement: "top-in",
      },

      tooltip: {
        text: `%v ครั้ง`,
        borderColor: "#fff",
        borderRadius: "3px",
        borderWidth: "1px",
        fontSize: "12px",
        shadow: false,
      },
    });
  });
  MoldPrepare.forEach((Prepare) => {
    let { ProblemNo, ProblemCount, ProblemPercent } = Prepare;
    prepareSeries.push({
      values: [ProblemCount],
      text: `${ProblemNo}`,
      "value-box":
      {
        text: `${ProblemPercent}%`,
        fontSize: "12px",
        fontColor: "#FFFFFF",
        placement: "top-in",
      },

      tooltip: {
        text: `%v ครั้ง`,
        borderColor: "#fff",
        borderRadius: "3px",
        borderWidth: "1px",
        fontSize: "12px",
        shadow: false,
      },
    });
  });
  zingchart.render({
    id: "MonthlyProblemGraph",
    data: await MonthlyChartConfig("ปัญหาแม่พิมพ์", 15, problemSeries),
  });
  zingchart.render({
    id: "MonthlyPrepareGraph",
    data: await MonthlyChartConfig("เตรียมการแม่พิมพ์", 3, prepareSeries),
    height: 200, // Set to 100% to fully scale to parent container
    // width: '100%',
  });
};

$ReportFilter.on("change", async function () {
  ShowReport($ReportFilter.val());
  // $inputDateTime.removeAttr("min");
  fillTimeNow();
  $("#DailyReportTable tbody").replaceWith(`
      <tbody>
        <tr>
          <td colspan="16">โปรดเลือกช่วงเวลา</td>
        </tr>
      </tbody>
    `);
});

$('#ReportNoSaveBtn').on('click', () => {
  let Data = {
    DocName: DocNames[$ReportFilter.val()],
    DocCode: $('#ReportCode').val(),
    DocDate: $('#ReportDateEff').val()
  }
  $.ajax({
    url: `/report/docno`,
    method: "put",
    contentType: "application/json",
    data: JSON.stringify(Data),
    success: (res) => {
      let success = res.message;
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Updated",
        text: success,
        showConfirmButton: false,
        timer: 1500,
      });
    },
    error: (err) => {
      let error = err.responseJSON.message;
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Warning",
        text: error,
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#FF5733",
      });
    },
  });
})

ShowReport();
