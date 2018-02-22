const express = require("express");
const siteController = express.Router();
var checkBoss = checkRoles("Boss");
var checkDevelop = checkRoles("Developer");
var checkTA = checkRoles("TA");
const passport = require(`passport`);
const User = require("../models/user");
const Course = require("../models/course");
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

siteController.get("/", (req, res, next) => {
  res.render("index");
});

siteController.get(`/login`, (req, res, next) => {
  res.render(`login`);
});

siteController.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    passReqToCallback: true
  })
);

siteController.get(`/showusers`, ensureAuthenticated, (req, res, next) => {
  User.find({}, (err, users) => {
    if (err) {
      res.redirect(`/login`);
    }
    res.render(`showusers`, {
      users: users
    });
  });
});

siteController.get(`/showcourses`, ensureAuthenticated, (req, res, next) => {
  Course.find({}, (err, courses) => {
    if (err) {
      res.redirect(`/login`);
    }
    res.render(`showcourses`, {
      courses: courses
    });
  });
});

siteController.get("/addemployee", checkBoss, (req, res, next) => {
  res.render("addemployee");
});

siteController.get(`/addcourse`, checkTA, (req, res, next) => {
  res.render(`addcourse`);
});

siteController.post(`/addcourse`, checkTA, (req, res, next) => {
  // name: String,
  // startingDate: Date,
  // endDate: Date,
  // level: String,
  // available: Boolean

  const name = req.body.name;
  const startingDate = req.body.startingDate;
  const endDate = req.body.endDate;
  const level = req.body.level;

  console.log(name);

  if (name === "" || level === "") {
    res.render("addcourse", { message: "Please enter all fields." });
    return;
  }

  Course.findOne({ name }, "name", (err, courseName) => {
    if (courseName !== null) {
      res.render(`addcourse`, { message: `That course already exists` });
      return;
    }

    const newCourse = new Course({
      name,
      startingDate,
      endDate,
      level
    });

    newCourse.save(err => {
      if (err) {
        res.render(`addcourse`, { message: `Something went wrong` });
      } else {
        res.redirect("/");
      }
    });
  });
});

siteController.post(`/addemployee`, checkBoss, (req, res, next) => {
  const username = req.body.username;
  const name = req.body.name;
  const familyName = req.body.familyName;
  const password = req.body.password;
  const role = req.body.role;

  if (username === "" || password === "" || name === `` || familyName === ``) {
    res.render("addemployee", { message: "Please enter all fields." });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render(`addemployee`, { message: `The username already exists!` });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      name,
      familyName,
      password: hashPass,
      role
    });

    newUser.save(err => {
      if (err) {
        res.render(`addemployee`, { message: `Something went wrong` });
      } else {
        res.redirect("/showusers");
      }
    });
  });
});

siteController.get(`/:id`, ensureAuthenticated, (req, res, next) => {
  const id = req.params.id;

  User.findById(id, (err, user) => {
    if (err) {
      return next(err);
    }
    res.render(`userprofile`, { user: user });
  });
});

siteController.post(`/:id/edituser`, (req, res, next) => {
  const id = req.params.id;

  const updates = {
    username: req.body.username,
    name: req.body.name,
    familyName: req.body.familyName
  };

  User.findByIdAndUpdate(id, updates, (err, user) => {
    if (err) {
      return next(err);
    }
    return res.redirect(`/${id}`);
  });
});

siteController.post(`/:id/editcourse`, checkTA, (req, res, next) => {
  const id = req.params.id;

  const updates = {
    name: req.body.name,
    startingDate: req.body.startingDate,
    endDate: req.body.endDate,
    level: req.body.level
  };

  Course.findByIdAndUpdate(id, updates, (err, course) => {
    if (err) {
      return next(err);
    }
    return res.redirect(`/showcourses`);
  });
});

siteController.get(`/:id/edituser`, (req, res, next) => {
  const id = req.params.id;

  User.findById(id, (err, user) => {
    if (err) {
      return next(err);
    }
    if (id == req.user._id) {
      res.render(`editprofile.ejs`, { user: user });
    } else {
      res.redirect(`/showusers`);
    }
  });
});

siteController.get(`/:id/editcourse`, checkTA, (req, res, next) => {
  const id = req.params.id;

  Course.findById(id, (err, course) => {
    if (err) {
      return next(err);
    }
    res.render(`editcourse.ejs`, { course: course });
  });
});

siteController.post(`/:id/deletecourse`, checkTA, (req, res, next) => {
  const id = req.params.id;

  Course.findByIdAndRemove(id, (err, user) => {
    if (err) {
      return next(err);
    }
    return res.redirect(`/showcourses`);
  });
});

siteController.post(`/:id/deleteuser`, checkBoss, (req, res, next) => {
  const id = req.params.id;

  User.findByIdAndRemove(id, (err, user) => {
    if (err) {
      return next(err);
    }
    return res.redirect(`/showusers`);
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

function checkRoles(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect("/login");
    }
  };
}

module.exports = siteController;
