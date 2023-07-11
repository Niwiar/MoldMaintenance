const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbconfig = require("../../libs/dbconfig");
const createError = require("http-errors");
const { getChecklist, addChecklist, editChecklist, deleteChecklist, addTopic, editTopic } = require("../../controller/checklistController");
const { isAuthEdit } = require("../middleware/checkUser");

router.get("/list/:CheckType&:TopicId", async (req, res, next) => {
  try {
    let { CheckType, TopicId } = req.params
    let Check = await getChecklist(CheckType, TopicId)
    if (Check.msg != 'OK') {
      return next(createError(400, Check.msg));
    }
    res.status(200).send(JSON.stringify(Check.data));
  } catch (err) {
    next(err);
  }
});

router.use(isAuthEdit("MasterProblem"));

router.post("/add", async (req, res, next) => {
  try {
    // body: CheckType, TopicId(only preventive), Topic(only preventive topic), CheckNo, Check
    let { CheckType, Topic, CheckNo, Check } = req.body
    if (CheckType != 4 & (CheckNo == "" || Check == "")) return next(createError(400, "Please fill every field"));
    if (CheckType == 4 & Topic == "") return next(createError(400, "Please fill every field"));
    let Result = CheckType == 4 ?
      await addTopic(req.body) :
      await addChecklist(req.body)
    if (Result.msg != 'OK') {
      return next(createError(400, Result.msg));
    }
    res.status(201).send({ message: `Checklist has been added` });
  } catch (err) {
    next(err);
  }
});
router.put("/edit", async (req, res, next) => {
  try {
    // body: CheckType, CheckId, TopicId(only preventive), Topic(only preventive topic), CheckNo, Check
    let { CheckType } = req.body
    let Result = CheckType == 4 ?
      await editTopic(req.body) :
      await editChecklist(req.body)
    // let Result = await editChecklist(req.body)
    if (Result.msg != 'OK') {
      return next(createError(400, Result.msg));
    }
    res.status(201).send({ message: `Checklist has been edited` });
  } catch (err) {
    next(err);
  }
});
router.delete("/delete/:CheckType&:CheckId", async (req, res, next) => {
  try {
    // param: CheckType, CheckId
    let Result = await deleteChecklist(req.params)
    if (Result.msg != 'OK') {
      return next(createError(400, Result.msg));
    }
    res.status(200).send({ message: `Checklist has been deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
