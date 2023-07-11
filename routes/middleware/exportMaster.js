
exports.fillMoldTemplate = async (Worksheet, Molds) => {
  try {
    let index = 0;
    while (index < Molds.length) {
      let { MoldSection, MoldName, MoldControlNo, MoldCavity,
        CleaningPlan, PreventivePlan, LifeShot, OtherPlan, WarnPercent, DangerPercent } = Molds[index];
      let Row = 2 + index;
      Worksheet.row(Row).height(21.6)
      Worksheet.row(Row).cell(1).value(MoldSection);
      Worksheet.row(Row).cell(2).value(MoldName);
      Worksheet.row(Row).cell(3).value(MoldControlNo);
      Worksheet.row(Row).cell(4).value(MoldCavity);
      Worksheet.row(Row).cell(5).value(CleaningPlan);
      Worksheet.row(Row).cell(6).value(PreventivePlan);
      Worksheet.row(Row).cell(7).value(LifeShot);
      Worksheet.row(Row).cell(8).value(OtherPlan);
      Worksheet.row(Row).cell(9).value(WarnPercent);
      Worksheet.row(Row).cell(10).value(DangerPercent);
      index++;
    }
  } catch (err) {
    console.log(err);
  }
};
exports.fillPartTemplate = async (Worksheet, Parts) => {
  try {
    let index = 0;
    while (index < Parts.length) {
      let { PartSection, PartName, PartNo } = Parts[index];
      let Row = 2 + index;
      Worksheet.row(Row).height(21.6)
      Worksheet.row(Row).cell(1).value(PartSection);
      Worksheet.row(Row).cell(2).value(PartName);
      Worksheet.row(Row).cell(3).value(PartNo);
      index++;
    }
  } catch (err) {
    console.log(err);
  }
};
exports.fillMcTemplate = async (Worksheet, Mcs) => {
  try {
    let index = 0;
    while (index < Mcs.length) {
      let { McSection, McName } = Mcs[index];
      let Row = 2 + index;
      Worksheet.row(Row).height(21.6)
      Worksheet.row(Row).cell(1).value(McSection);
      Worksheet.row(Row).cell(2).value(McName);
      index++;
    }
  } catch (err) {
    console.log(err);
  }
};

exports.writeBackup = async (Workbook, Filename) => {
  try {
    await Workbook.toFileAsync(`./public/backup/${Filename}`);
  } catch (err) {
    console.log(err);
  }
};
