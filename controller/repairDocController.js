const path = require("path");
const fs = require("fs");
const pdfMake = require("pdfmake");
const { createRepairDoc, fonts } = require("../libs/pdf-generator");

exports.updateRepairDoc = (RepairId) => new Promise(async (resolve, reject) => {
  let { doc, SlipNo } = await createRepairDoc(RepairId)
  let pdfCreator = new pdfMake(fonts);
  let pdfDoc = pdfCreator.createPdfKitDocument(doc);
  let docPath = path.join(process.cwd(), `/public/doc/RepairOrder/${SlipNo}.pdf`);
  let creating = pdfDoc.pipe(fs.createWriteStream(docPath));
  pdfDoc.end();
  creating.on("finish", () => {
    console.log(SlipNo, "create success");
    resolve(SlipNo)
  });
})