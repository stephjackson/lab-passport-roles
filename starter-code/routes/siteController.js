const express = require("express");
const siteController = express.Router();
var checkBoss  = checkRoles('Boss');
var checkDevelop = checkRoles('Developer');
var checkTA = checkRoles('TA');
const passport = require(`passport`);
const User = require('../models/user');
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

siteController.get("/", (req, res, next) => {
  res.render("index");
});

siteController.get(`/login`, (req, res, next) => {
  res.render(`login`);
})

siteController.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}));

siteController.get(`/showusers`, checkBoss, (req, res, next) => {
  User.find({}, (err, users)=> {
    if (err) { return next(err) }

    res.render(`showusers`, {
      users: users
    })
  })
})

siteController.get("/addemployee", checkBoss, (req, res, next) => {
  res.render("addemployee");
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
    })

    newUser.save((err) => {
      if (err) {
        res.render(`addemployee`, { message: `Something went wrong`} )
      } else {
        res.redirect("/")
      }
    })
  })
})

siteController.post(`/:id/delete`, checkBoss, (req, res, next) => {
  const id = req.params.id;

  User.findByIdAndRemove(id, (err, user) => {
    if (err) { return next(err) ;}
    return res.redirect(`/showusers`);
  })
})

function checkRoles(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    } else {
      res.redirect('/login')
    }
  }
}

module.exports = siteController;
