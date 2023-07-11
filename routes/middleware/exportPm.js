const { ymd2dmytime, gettime } = require("../../libs/datetime");

exports.fillPmReport = async (Worksheet, Mold, ActualHistory, PmHistory, Cumulative, Filter) => {
  try {
    let { FromDate, ToDate } = Filter
    let { MoldName, MoldControlNo } = Mold.recordset[0]
    Worksheet.row(3).cell(2).value(MoldControlNo);
    Worksheet.row(3).cell(5).value(MoldName);
    let Period = 'all';
    if (FromDate && ToDate) Period = `${ymd2dmytime(FromDate)} - ${ymd2dmytime(ToDate)}`;
    else if (FromDate) Period = `${ymd2dmytime(FromDate)} - ${ymd2dmytime(gettime())}`;
    Worksheet.row(3).cell(9).value(Period);
    // Worksheet.row(3).cell(7).value(`${FromTime} - ${ToTime}`);
    for (let index = 0; index <= ActualHistory.length; index++) {
      let Row = 7 + index;
      Worksheet.row(Row).height(21.6)
      if (index == ActualHistory.length) {
        Worksheet.range(`A${Row}:B${Row}`).merged(true).value('Total Actual').style({
          horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'medium', rightBorderStyle: 'thin', bold: true
        });
        Worksheet.row(Row).cell(3).formula(`=SUM(C7:C${Row - 1})`).style({
          horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'medium', leftBorderStyle: 'thin', bold: true
        });
        break;
      }
      let { UpdatedTime, PartName, ActualShot } = ActualHistory[index]
      Worksheet.row(Row).cell(1).value(UpdatedTime).style({ horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(2).value(PartName).style({ horizontalAlignment: 'left', verticalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(3).value(ActualShot).style({ horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'thin', rightBorderStyle: 'medium' });
      if (index == ActualHistory.length - 1) {
        Worksheet.row(Row).cell(1).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(2).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(3).style('bottomBorderStyle', 'medium');
      }
    }
    for (let index = 0; index < PmHistory.length; index++) {
      let { PmType, PmDate, PartName, InjShot } = PmHistory[index];
      let Row = 7 + index;
      Worksheet.row(Row).height(21.6);
      Worksheet.row(Row).cell(5).value(PmType).style({ horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'thin', leftBorderStyle: 'medium' });
      Worksheet.row(Row).cell(6).value(PmDate).style({ horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(7).value(PartName).style({ horizontalAlignment: 'left', verticalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(8).value(InjShot).style({ horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'thin', rightBorderStyle: 'medium' });
      if (index == PmHistory.length - 1) {
        Worksheet.row(Row).cell(5).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(6).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(7).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(8).style('bottomBorderStyle', 'medium');
      }
    }
    for (let index = 0; index < Cumulative.length; index++) {
      let Row = 7 + index;
      Worksheet.row(Row).height(21.6);
      if (index == Cumulative.length) {
        Worksheet.row(Row).cell(10).value('Total Shots').style({
          horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'medium', rightBorderStyle: 'thin', bold: true
        });
        Worksheet.row(Row).cell(11).formula(`=SUM(K7:K${Row - 1})`).style({
          horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'medium', leftBorderStyle: 'thin', bold: true
        });
        break;
      }
      let { PartName, CumulativeShot } = Cumulative[index]
      Worksheet.row(Row).cell(10).value(PartName).style({ horizontalAlignment: 'left', verticalAlignment: 'center', borderStyle: 'thin', leftBorderStyle: 'medium' });
      Worksheet.row(Row).cell(11).value(CumulativeShot).style({ horizontalAlignment: 'center', verticalAlignment: 'center', borderStyle: 'thin', rightBorderStyle: 'medium' });
      if (index == Cumulative.length - 1) {
        Worksheet.row(Row).cell(10).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(11).style('bottomBorderStyle', 'medium');
      }
    }
  } catch (err) {
    console.log(err);
  }
};

exports.writeReport = async (Workbook, Filename) => {
  try {
    await Workbook.toFileAsync(`./public/report/${Filename}`);
  } catch (err) {
    console.log(err);
  }
};
