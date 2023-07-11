const ifNotLoggedIn = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
};

const ifLoggedIn = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/");
  }
  next();
};

const isAuth = (page) => {
  return (req, res, next) => {
    let auth = req.session.Auth;
    if (page == 'Master' && auth['MasterMold'] == 0 && auth['MasterProblem'] == 0 &&
      auth['MasterMfg'] == 0 && auth['MasterDm'] == 0 && auth['MasterPosition'] == 0) {
      req.flash("errTitle", "Error")
      req.flash("errText", "No Permission to access")
      return res.redirect("/error");
      // return res.status(403).send({ message: "No Permission to access" });

    } else if (auth[page] == 0) {
      req.flash("errTitle", "Error")
      req.flash("errText", "No Permission to access")
      return res.redirect("/error");
      // return res.status(403).send({ message: "No Permission to access" });
    }
    next();
  };
};

const isAuthEdit = (page) => {
  return (req, res, next) => {
    let auth = req.session.Auth;
    if (auth[page] <= 1) {
      return res.status(403).send({ message: "No Permission to edit" });
    }
    next();
  };
};

module.exports = {
  ifNotLoggedIn,
  ifLoggedIn,
  isAuth,
  isAuthEdit,
};
