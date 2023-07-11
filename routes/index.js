const express = require("express");
const router = express.Router();

const { ifLoggedIn, ifNotLoggedIn, isAuth } = require("./middleware/checkUser");


router.get("/", ifNotLoggedIn, (req, res) => {
  res.render("index");
});
router.get("/repair-view", ifNotLoggedIn, (req, res) => {
  res.render("Repair-view");
});
router.get("/moldpm", ifNotLoggedIn, (req, res) => {
  res.render("MoldPm");
});
router.get("/moldpm-view", ifNotLoggedIn, (req, res) => {
  res.render("MoldPm-view");
});
router.get("/performance", ifNotLoggedIn, isAuth('DmPerformance'), (req, res) => {
  res.render("Performance");
});
router.get("/performance-view", ifNotLoggedIn, isAuth('DmPerformance'), (req, res) => {
  res.render("Performance-view");
});
router.get("/report_dm", ifNotLoggedIn, isAuth('DmReport'), (req, res) => {
  res.render("Report");
});
router.get("/setting", ifNotLoggedIn, isAuth('Master'), (req, res) => {
  res.render("MasterSetting");
});
router.get('/error', (req, res) => {
  res.render("Error.ejs");

})



router.get("/login", ifLoggedIn, (req, res) => {
  res.render("Login.ejs");
});

module.exports = router;
