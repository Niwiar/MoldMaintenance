const multer = require("multer");
const path = require("path");
const fs = require('fs')
const { gettime } = require("../../libs/datetime");
const { selectIndexImg } = require("../../controller/repairOrderController");

exports.changeFileName = async (des, file, newname) => {
  let filename = file.filename
  let ext = file.mimetype.split("/")[1];
  let newFilename = `${newname}.${ext}`
  fs.rename(`${des}\\${filename}`, `${des}\\${newFilename}`, (err) => {
    if (err) console.log(err);
  });
  return newFilename;
};

exports.uploadUser = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "./public/img/user"),
    filename: async (req, file, cb) => {
      try {
        let { Fullname } = JSON.parse(req.params.Data);
        Fullname = Fullname.replaceAll(' ', '')
        const ext = file.mimetype.split("/")[1];
        cb(null, "User_" + Fullname + "." + ext);
      } catch (err) {
        console.log(err);
      }
    },
  }),
}).single('userpic')

const multerOrder = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "./public/img/repairorder"),
    filename: async (req, file, cb) => {
      let date = gettime()
      date = date.replace(/[-: ]/g, '')
      const ext = file.mimetype.split("/")[1];
      cb(null, file.originalname + '-' + date + "." + ext);
    },
  }),
}).array("orderimg", 20);
exports.uploadOrder = async (req, res, filename) => {
  return new Promise((resolve) => {
    multerOrder(req, res, async (err) => {
      if (err) {
        console.log(err)
        res.status(500).send({ message: `${err}` });
      }
      // let Filepath = `${ShotDest}/blank_Img.jpeg`
      let { files } = req
      return resolve(files)

      // if (req.file) {
      //   let des = path.join(process.cwd(), '/public/' + ShotDest)
      //   let Filename = changeFileName(des, req.file, filename)
      //   Filepath = `${ShotDest}/${Filename}`
      // }
      // console.log(ImgArr)
    })
  })
}

const multerMaster = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "./public/backup"),
    filename: async (req, file, cb) => {
      let { Table } = req.params
      let date = gettime()
      date = date.replace(/[-: ]/g, '')
      const ext = file.mimetype.split("/")[1];
      cb(null, Table + '-' + date + ".xlsx");
    },
  }),
}).single("masterfile");
exports.uploadMaster = async (req, res) => new Promise((resolve, reject) => {
  multerMaster(req, res, (err) => {
    if (err) reject(err)
    if (!req.file) reject('File not found')
    resolve(req.file.path)
  })
})

const multerInj = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), "./public/backup"),
    filename: async (req, file, cb) => {
      let date = gettime()
      date = date.replace(/[-: ]/g, '')
      cb(null, 'Inj-' + date + ".xlsx");
    },
  }),
}).single("injshotfile");
exports.uploadInj = async (req, res) => new Promise((resolve, reject) => {
  multerInj(req, res, (err) => {
    if (err) reject(err)
    if (!req.file) reject('File not found')
    resolve(req.file.path)
  })
})