var express = require("express");
var router = express.Router();
const User = require("../models/users");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { checkBody } = require("../modules/checkBody");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstname", "username", "password"])) {
    res.json({ result: false, error: "missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username }).then((data) => {
    if (data) {
      res.json({ result: false, error: "user already exists" });
    } else if (!data) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const newUser = new User({
        firstname: req.body.firstname,
        username: req.body.username,
        password: hash,
        token: uid2(32),
      });
      newUser.save().then(() => {
        res.json({
          result: true,
          token: newUser.token,
          user: { firstname: newUser.firstname, username: newUser.username },
        });
      });
    } else {
      res.json({ result: false, error: "error occured" });
    }
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username }).then((data) => {
    if (!data) {
      res.json({ result: false, error: "user does not exist" });
    } else if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({
        result: true,
        token: data.token,
        user: { firstname: data.firstname, username: data.username },
      });
    } else {
      res.json({ result: false, error: "incorrect username or password" });
    }
  });
});

module.exports = router;
