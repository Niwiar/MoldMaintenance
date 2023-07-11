const $PerformanceFilter = $("#PerformanceFilter_");
const $FromDate = $("#PerformanceFromDate_");
const $ToDate = $("#PerformanceToDate_");
const $InputDate = $("#PerformanceFromDate_,#PerformanceToDate_");
const $DownloadBtn = $("#PerformanceDownloadBtn");

const getdate = () => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let yyyy = today.getFullYear();
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  return yyyy + "-" + mm + "-" + dd;
};
const getweek = (date = getdate()) => {
  currentDate = new Date(date);
  let year = currentDate.getFullYear()
  startDate = new Date(year, 0, 1);
  var days = Math.floor((currentDate - startDate) /
    (24 * 60 * 60 * 1000));
  var weekNumber = Math.ceil(days / 7);
  return `${year}-W${weekNumber > 10 ? weekNumber : '0' + weekNumber}`
};

const getDateOfISOWeek = (w, y) => {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  let dd = ISOweekStart.getDate();
  let mm = ISOweekStart.getMonth() + 1;
  let yyyy = ISOweekStart.getFullYear();
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  return yyyy + "-" + mm + "-" + dd;
};

const PerformanceChartConfig = (Tech, Series) => {
  return {
    type: "bar",
    legend: {
      "toggle-action": "remove",
      x: "10%",
      y: "2%",
      "border-width": 1,
      "border-color": "gray",
      "border-radius": "5px",
      header: {
        text: "Mold",
        "font-size": 12,
        "font-color": "#3333cc",
        "font-weight": "normal",
      },
      marker: {
        type: "circle",
      },
      layout: "1x5",
      "max-items": 5,
      overflow: "scroll",
    },
    plotarea: {
      "margin-top": "20%",
      "margin-left": "8%",
    },
    plot: {
      animation: {
        delay: 200,
        effect: "11",
        method: "5",
        sequence: "0",
        speed: 1000,
      },
      tooltip: {
        visible: false,
      },
      barWidth: "50%",
      stacked: true,
      "stack-type": "normal",
      "value-box": {
        text: "%stack-total",
        fontColor: "#808080",
        fontSize: "12px",
        placement: "top",
        rules: [
          {
            rule: "%stack-top==0",
            visible: 0,
          },
        ],
      },
    },
    scaleX: {
      labels: Tech,
      label: {
        text: "<br>Technician",
      },
    },
    scaleY: {
      // values: '0:200:40',
      label: {
        padding: "0 0 0 0",
        text: "<br>TIME (Minute)",
      },
      guide: {
        lineStyle: "solid",
      },
    },
    crosshairX: {
      plotLabel: {
        backgroundColor: "#fff",
        borderColor: "#EEE",
        borderRadius: "5px",
        fontColor: "#333",
        padding: "10px",
      },
      scaleLabel: {
        text: "%v",
        alpha: 0,
        transform: {
          type: "date",
          all: "%M %d, %Y<br>%g:%i %a",
        },
        fontFamily: "Georgia",
      },
    },
    series: Series,
  };
};
const PerformanceChart = (url, Filter) =>
  new Promise((resolve, reject) =>
    $.ajax({
      url: `/performance_dm/${url}/${JSON.stringify(Filter)}`,
      method: "get",
      contentType: "application/json",
    })
      .done((res) => resolve(res))
      .fail((err) => reject(err))
  );
const PerformanceGenerate = async (Order = 1) => {
  try {
    let Chart = await PerformanceChart("tech", getFilterPerformance(Order));
    console.log(Chart);
    let { Tech, Series } = Chart;
    if (Series.length) {
      $(`#PerformanceChart${Order}`).empty();
      zingchart.render({
        id: `PerformanceChart${Order}`,
        data: PerformanceChartConfig(Tech, Series),
      });
    } else {
      $(`#PerformanceChart${Order}`).empty();
      zingchart.exec(`PerformanceChart${Order}`, 'destroy')
      $(`#PerformanceChart${Order}`).append('<h3 class="text-center">No Data Available</h3>')
    }
  } catch (error) {
    SwalAlert(error, "Error");
  }
};
const getFilterPerformance = (Order = 1) => {
  let PerformType = $PerformanceFilter.val();
  let FromDate = $FromDate.val().replace("T", " ");
  if (PerformType == 2) {
    let [year, weekNo] = FromDate.split("-W");
    FromDate = getDateOfISOWeek(weekNo, year);
  }
  return {
    PerformType,
    FromDate,
    ToDate: $ToDate.val().replace("T", " "),
    TechFilter: $(`#User_Filter${Order}`).val(),
  };
};

$PerformanceFilter.on("change", async () => {
  let PerformType = $PerformanceFilter.val();
  $ToDate.parent("div").parent("div").hide();
  if (PerformType == 3) {
    $FromDate.attr("type", "datetime-local");
    $ToDate.parent("div").parent("div").show();
    $FromDate.val(getDateTimeLocal());
    $ToDate.val($FromDate.val()).attr("min", $FromDate.val());
  } else if (PerformType == 2) {
    $FromDate.attr("type", "week");
    $FromDate.val(getweek());
  } else if (PerformType == 1) {
    $FromDate.attr("type", "date");
    $FromDate.val(getdate());
    // $ToDate.val($FromDate.val()).attr('min', $FromDate.val())
  }
  await PerformanceGenerate();
});
$InputDate.on("change", async (e) => {
  if ($(e.target).attr("id") == "PerformanceFromDate_")
    $ToDate.val($FromDate.val()).attr("min", $FromDate.val());
  await PerformanceGenerate();
});
$DownloadBtn.on("click", async () => {
  window.open(
    `/performance_dm/tech_report/${JSON.stringify(getFilterPerformance())}`
  );
});

$(document).ready(async () => {
  $ToDate.parent("div").parent("div").hide();
  $FromDate.val(getdate());
  PerformanceGenerate();
  let $User_Filter = $("#User_Filter1");
  $User_Filter.select2();
  await filterDropdownUser("#User_Filter1");
  $("#User_Filter1").select2({
    placeholder: "Select member.",
  })

  $("#User_Filter1").change(() => {
    console.log("User", $("#User_Filter1").val());
    PerformanceGenerate();
  });
});
