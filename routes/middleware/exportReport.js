require("dotenv").config();
const fs = require('fs')
const { getweek, ymd2dmytime, ymd2dmydate } = require("../../libs/datetime");
const MonthTH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤษจิกายน', 'ธันวาคม']
const MonthEN = ['', 'January', 'Febuary', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const { HOST, PORT } = process.env;
const Host = `http://${HOST}:${PORT}`

exports.fillDailyReport = async (Worksheet, Reports, Filter, DocNo) => {
  try {
    let { FromDate, ToDate, FromTime, ToTime } = Filter
    let { DocCode, DocDateExcel } = DocNo

    Worksheet.row(3).cell(3).value(`${ymd2dmytime(FromDate)} - ${ymd2dmytime(ToDate)}`);
    // Worksheet.row(3).cell(7).value(`${FromTime} - ${ToTime}`);
    let index = 0;
    while (index < Reports.length) {
      let { SlipNo, RequestUser, RepairUser, InjShot, OrderTypeText, PartName, MoldName,
        Section, ProblemSource, ProblemNo, RequestTime, Detail, Cause,
        FixDetail, PointCheckTime, TotalTime, InjDate, Img } = Reports[index];
      let { ProblemFile, RepairFile, InspectFile, QaFile } = Img
      let docPath = `public/doc/RepairOrder/${SlipNo}.pdf`
      let Row = 6 + index;
      Worksheet.row(Row).height(21.6)
      Worksheet.row(Row).cell(1).value(SlipNo).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(2).value(RequestUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(3).value(RepairUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(4).value(InjShot).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(5).value(OrderTypeText).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(6).value(PartName).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(7).value(MoldName).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(8).value(Section).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(9).value(ProblemSource).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(10).value(ProblemNo).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(11).value(RequestTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(12).value(Detail).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(13).value(Cause).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(14).value(FixDetail).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(15).value(PointCheckTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(16).value(TotalTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(17).value(InjDate).style({ horizontalAlignment: 'center', borderStyle: 'thin' }).style('rightBorderStyle', 'medium');
      if (index == Reports.length - 1) {
        Worksheet.row(Row).cell(1).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(2).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(3).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(4).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(5).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(6).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(7).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(8).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(9).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(10).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(11).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(12).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(13).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(14).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(15).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(16).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(17).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row + 1).cell(16).value(`${DocCode} Effective date : ${DocDateExcel}`)
          .style("horizontalAlignment", 'right');
      }
      if (fs.existsSync(docPath)) {
        Worksheet.row(Row).cell(1).style({ fontColor: "0563c1", underline: true })
          .hyperlink(`${Host}/doc/RepairOrder/${SlipNo}.pdf`)
      }
      let idxX = 0
      ProblemFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(18 + idxX).column().width(16);
        Worksheet.row(Row).cell(18 + idxX).value(`ไฟล์แจ้งซ่อม${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      RepairFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(18 + idxX).column().width(16);
        Worksheet.row(Row).cell(18 + idxX).value(`ไฟล์การซ่อม${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      InspectFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(18 + idxX).column().width(16);
        Worksheet.row(Row).cell(18 + idxX).value(`ไฟล์จุดตรวจสอบ${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      QaFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(18 + idxX).column().width(16);
        Worksheet.row(Row).cell(18 + idxX).value(`ไฟล์การตรวจสอบ${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      index++;
    }
  } catch (err) {
    console.log(err);
  }
};
exports.fillMonthlyReport = async (Worksheet, MoldProblem, TopMoldProblem, MoldCountermeasure, MoldPrepare, params, DocNo) => {
  try {
    let { Month, Section } = params
    let { DocCode, DocDateExcel } = DocNo
    let [year, month, day] = Month.split('-')
    if (Section == 'ALL') Section = ''
    Worksheet.row(1).cell(1).value(`บันทึกการเกิดปัญหาแม่พิมพ์ ${Section} ประจำปี ${year}`);
    Worksheet.row(6).cell(7).value(`กราฟแสดงปัญหาของงานประจำเดือน ${MonthTH[parseInt(month)]}`);
    Worksheet.row(34).cell(7).value(`กราฟแสดงการเตรียมการแม่พิมพ์ประจำเดือน ${MonthTH[parseInt(month)]}`);
    let indexProblem = 0;
    while (indexProblem < MoldProblem.length) {
      let { ProblemCount, ProblemPercent } = MoldProblem[indexProblem]
      let { Problem, MoldName, MoldCount, RequestTime } = TopMoldProblem[indexProblem];
      let Row = 8 + indexProblem;
      Worksheet.row(Row).cell(5).value(ProblemCount);
      Worksheet.row(Row).cell(6).value(parseFloat(ProblemPercent));
      Worksheet.row(Row).cell(11).value(MoldName);
      Worksheet.row(Row).cell(12).value(RequestTime);
      Worksheet.row(Row).cell(13).value(Problem);
      Worksheet.row(Row).cell(14).value(MoldCount);
      indexProblem++;
    }
    let indexCounter = 0;
    while (indexCounter < MoldCountermeasure.length) {
      let { IndexMold, MoldName, RepairDate, Cause, FixDetail, ResponsibleUser } = MoldCountermeasure[indexCounter];
      let Row = 30 + indexCounter;
      Worksheet.row(Row).cell(3).value(IndexMold);
      Worksheet.row(Row).cell(4).value(MoldName);
      Worksheet.row(Row).cell(5).value(RepairDate);
      Worksheet.row(Row).cell(7).value(Cause);
      Worksheet.row(Row).cell(8).value(FixDetail);
      Worksheet.row(Row).cell(14).value(ResponsibleUser);
      indexCounter++;
    }
    let indexPrepare = 0;
    while (indexPrepare < MoldPrepare.length) {
      let { ProblemCount, ProblemPercent } = MoldPrepare[indexPrepare]
      let Row = 35 + indexPrepare;
      Worksheet.row(Row).cell(5).value(ProblemCount);
      Worksheet.row(Row).cell(6).value(parseFloat(ProblemPercent));
      indexPrepare++;
    }
    Worksheet.row(36 + indexPrepare).cell(14).value(`${DocCode} Effective date : ${DocDateExcel}`)
      .style("horizontalAlignment", 'right');
  } catch (err) {
    console.log(err);
  }
};
exports.fillPOReport = async (Worksheet, Reports, Filter, DocNo) => {
  try {
    let { FromDate, ToDate } = Filter
    let { DocCode, DocDateExcel } = DocNo
    let [year, month, day] = FromDate.split('-')
    Worksheet.row(5).cell(4).value(`ปี ${year}   เดือน ${MonthEN[parseInt(month)]}`);
    let index = 0;
    while (index < Reports.length) {
      // console.log(Reports[index])
      let { RequestDate, SlipNo, Section, PartNo, PartName, McName,
        RequestTime, NoHAT, AS400, Detail, Document, RequestUser, MgLeader,
        MgMgr, FixDetail, PointCheckTime, QaResult, QaRemark } = Reports[index];
      // console.log(McName.replace(/[^\d.]/g, '').replaceAll('.', '-'))
      let docPath = `public/doc/RepairOrder/${SlipNo}.pdf`
      let Row = 8 + index;
      // Worksheet.row(Row).cell(1).value(index);
      Worksheet.row(Row).height(27.6)
      Worksheet.row(Row).cell(1).value(index + 1).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(2).value(RequestDate).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(3).value(SlipNo.slice(0, 2)).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(4).value(SlipNo.slice(2)).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(5).value(Section).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(6).value(PartNo).style("horizontalAlignment", 'left').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(7).value(PartName).style("horizontalAlignment", 'left').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(8).value(McName.replace(/[^\d.]/g, '').replaceAll('.', '-')).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(9).value(RequestTime).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(10).value(NoHAT || '-').style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(11).value(AS400 || '-').style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(12).value(Detail).style("horizontalAlignment", 'left').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(13).value(Document).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(14).value(RequestUser).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(15).value(MgLeader || 'KANNIKA').style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(16).value(MgMgr || 'VEERASAK').style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(17).value(FixDetail).style("horizontalAlignment", 'left').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(18).value(PointCheckTime).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(19).value(QaResult).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      Worksheet.row(Row).cell(20).value(QaRemark).style("horizontalAlignment", 'center').style('borderStyle', 'thin');
      if (fs.existsSync(docPath)) {
        Worksheet.row(Row).cell(4).style({ fontColor: "0563c1", underline: true })
          .hyperlink(`${Host}/doc/RepairOrder/${SlipNo}.pdf`)
      }
      index++;
    }
    Worksheet.row(8 + index).cell(19).value(`${DocCode} Effective date : ${DocDateExcel}`)
      .style("horizontalAlignment", 'right');
  } catch (err) {
    console.log(err);
  }
}
exports.fillRepairReport = async (Worksheet, Reports, TotalTime, Filter, DocNo) => {
  try {
    let { FromDate, ToDate, FromTime, ToTime } = Filter
    let { DocCode, DocDateExcel } = DocNo
    Worksheet.row(3).cell(3).value(`${ymd2dmytime(FromDate)} - ${ymd2dmytime(ToDate)}`);
    // Worksheet.row(3).cell(6).value(`${FromTime} - ${ToTime}`);
    Worksheet.row(3).cell(30).value(TotalTime)
    let index = 0;
    while (index < Reports.length) {
      let { SlipNo, InjShot, OrderTypeText, PartName, PartNo, MoldName,
        McName, Section, ProblemSource, ProblemNo, Detail, Cause, FixDetail, InjDate,
        QaResult, TryDate, RequestTime, RequestUser, ReceiveTime, ReceiveUser,
        RepairStart, RepairUser, DmCheckTime, DmCheckUser, DmApproveTime, DmApproveUser,
        PointCheckTime, ProgressTime, FinishTime, RepairTime, QaUser, QaRemark, Img
      } = Reports[index];
      let { ProblemFile, RepairFile, InspectFile, QaFile } = Img
      let docPath = `public/doc/RepairOrder/${SlipNo}.pdf`
      let Row = 6 + index;
      Worksheet.row(Row).height(21.6)
      Worksheet.row(Row).cell(1).value(SlipNo).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(2).value(InjShot).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(3).value(OrderTypeText).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(4).value(PartName).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(5).value(PartNo).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(6).value(MoldName).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(7).value(McName).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(8).value(Section).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(9).value(ProblemSource).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(10).value(ProblemNo).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(11).value(Detail).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(12).value(Cause).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(13).value(FixDetail).style({ horizontalAlignment: 'left', borderStyle: 'thin' });
      Worksheet.row(Row).cell(14).value(QaResult).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(15).value(InjDate).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(16).value(RequestTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(17).value(RequestUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(18).value(ReceiveTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(19).value(ReceiveUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(20).value(RepairStart).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(21).value(RepairUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(22).value(PointCheckTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(23).value(ProgressTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(24).value(DmCheckTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(25).value(DmCheckUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(26).value(DmApproveTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(27).value(DmApproveUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(28).value(TryDate).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(29).value(FinishTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(30).value(RepairTime).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(31).value(QaUser).style({ horizontalAlignment: 'center', borderStyle: 'thin' });
      Worksheet.row(Row).cell(32).value(QaRemark).style({ horizontalAlignment: 'center', borderStyle: 'thin', rightBorderStyle: 'medium' })
      if (index == Reports.length - 1) {
        Worksheet.row(Row).cell(1).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(2).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(3).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(4).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(5).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(6).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(7).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(8).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(9).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(10).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(11).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(12).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(13).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(14).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(15).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(16).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(17).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(18).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(19).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(20).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(21).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(22).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(23).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(24).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(25).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(26).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(27).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(28).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(29).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(30).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(31).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row).cell(32).style('bottomBorderStyle', 'medium');
        Worksheet.row(Row + 1).cell(31).value(`${DocCode} Effective date : ${DocDateExcel}`)
          .style("horizontalAlignment", 'right');
      }
      if (fs.existsSync(docPath)) {
        Worksheet.row(Row).cell(1).style({ fontColor: "0563c1", underline: true })
          .hyperlink(`${Host}/doc/RepairOrder/${SlipNo}.pdf`)
      }
      let idxX = 0
      ProblemFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(33 + idxX).column().width(16);
        Worksheet.row(Row).cell(33 + idxX).value(`ไฟล์แจ้งซ่อม${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      RepairFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(33 + idxX).column().width(16);
        Worksheet.row(Row).cell(33 + idxX).value(`ไฟล์การซ่อม${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      InspectFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(33 + idxX).column().width(16);
        Worksheet.row(Row).cell(33 + idxX).value(`ไฟล์จุดตรวจสอบ${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      QaFile.forEach((Pic, idx) => {
        Worksheet.row(Row).cell(33 + idxX).column().width(16);
        Worksheet.row(Row).cell(33 + idxX).value(`ไฟล์การตรวจสอบ${idx + 1}`).hyperlink(`${Host}${Pic}`)
          .style({ fontColor: "0563c1", underline: true, horizontalAlignment: 'center' });
        idxX++
      })
      index++;
    }
  } catch (err) {
    console.log(err);
  }
}

exports.fillPerformanceReport = async (Worksheet, Performance, Filter) => {
  try {
    let { PerformType, FromDate, ToDate } = Filter
    let { Tech, Series } = Performance
    let TypeText = ''
    if (PerformType == 1) {
      TypeText = 'Daily Working Summary'
      Worksheet.row(3).cell(2).value(`${ymd2dmydate(FromDate)}`);
    } else if (PerformType == 2) {
      TypeText = 'Weekly Working Summary'
      let Week = getweek(FromDate)
      Worksheet.row(3).cell(2).value(`${ymd2dmydate(Week[0])} - ${ymd2dmydate(Week[6])}`);
    } else {
      TypeText = 'Working Summary'
      Worksheet.row(3).cell(2).value(`${ymd2dmydate(FromDate)} - ${ymd2dmydate(ToDate)}`);
    }
    Worksheet.row(2).cell(1).value(TypeText);
    let colIdx = 0
    while (colIdx <= Tech.length) {
      let Col = 2 + colIdx;
      Worksheet.row(6).cell(Col).column().width(17);
      if (colIdx == Tech.length) {
        let totalCol = Worksheet.row(5).cell(2 + colIdx).columnName()
        Worksheet.range(`${totalCol}5:${totalCol}6`).merged(true).value('Total Time\n(Minute)').style({
          horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true, bold: true,
          topBorderStyle: 'medium', bottomBorderStyle: 'medium', rightBorderStyle: 'medium',
        });
        break;
      }
      Worksheet.row(6).cell(Col).value(Tech[colIdx]).style({
        horizontalAlignment: 'center', verticalAlignment: 'center',
        topBorderStyle: 'medium', bottomBorderStyle: 'medium', rightBorderStyle: 'thin'
      });
      colIdx++
    }
    let startTech = Worksheet.row(5).cell(2).columnName()
    let endTech = Worksheet.row(5).cell(1 + colIdx).columnName()
    Worksheet.range(`${startTech}5:${endTech}5`).merged(true).value('Maintenance Member').style({
      horizontalAlignment: 'center', verticalAlignment: 'center', bold: true,
      topBorderStyle: 'medium', bottomBorderStyle: 'medium', rightBorderStyle: 'thin',
    });
    let rowIdx = 0;
    while (rowIdx < Series.length) {
      let Row = 7 + rowIdx;
      let { text, values } = Series[rowIdx];
      Worksheet.row(Row).height(21.6)
      Worksheet.row(Row).cell(1).value(text).style('borderStyle', 'thin').style("horizontalAlignment", 'center');
      for (let idx = 0; idx <= values.length; idx++) {
        let Col = 2 + idx
        if (idx == values.length) { // Total
          let fColName = Worksheet.row(Row).cell(2).columnName()
          let lColName = Worksheet.row(Row).cell(Col - 1).columnName()
          Worksheet.row(Row).cell(Col).formula(`=SUM(${fColName}${Row}:${lColName}${Row})`)
            .style('borderStyle', 'thin').style("horizontalAlignment", 'center')
            .style('rightBorderStyle', 'medium');
          break;
        }
        Worksheet.row(Row).cell(Col).value(values[idx])
          .style('borderStyle', 'thin')
          .style("horizontalAlignment", 'center');
      }
      rowIdx++;
    }
    let lastRow = 7 + rowIdx;
    Worksheet.row(lastRow).height(21.6)
    Worksheet.row(lastRow).cell(1).value('TIME (Minute)').style('borderStyle', 'thin')
      .style("horizontalAlignment", 'center').style('bottomBorderStyle', 'medium').style('bold', true);
    let Idx = 0
    while (Idx <= Tech.length) {
      let lastCol = 2 + Idx
      if (Idx == Tech.length) {
        let fColName = Worksheet.row(lastRow).cell(2).columnName()
        let lColName = Worksheet.row(lastRow).cell(lastCol - 1).columnName()
        Worksheet.row(lastRow).cell(lastCol).formula(`=SUM(${fColName}2:${lColName}${lastRow - 1})`)
          .style('borderStyle', 'thin').style("horizontalAlignment", 'center')
          .style('bottomBorderStyle', 'medium').style('rightBorderStyle', 'medium')
          .style('bold', true);
        break;
      }
      let ColName = Worksheet.row(lastRow).cell(lastCol).columnName()
      Worksheet.row(lastRow).cell(lastCol).formula(`=SUM(${ColName}6:${ColName}${lastRow - 1})`)
        .style('borderStyle', 'thin').style("horizontalAlignment", 'center')
        .style('bottomBorderStyle', 'medium').style('bold', true);
      Idx++;
    }
  } catch (err) {
    console.log(err);
  }
}

exports.writeReport = async (Workbook, Filename) => {
  try {
    await Workbook.toFileAsync(`./public/report/${Filename}`);
  } catch (err) {
    console.log(err);
  }
};
