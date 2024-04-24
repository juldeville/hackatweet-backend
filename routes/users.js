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

router.post("/signup", async (req, res) => {
  try {
    if (!checkBody(req.body, ["firstname", "username", "password"])) {
      return res
        .status(400)
        .json({ result: false, error: "Missing or empty fields" });
    }

    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res
        .status(409)
        .json({ result: false, error: "User already exists" });
    }

    const hash = bcrypt.hashSync(req.body.password, 10);

    const newUser = new User({
      firstname: req.body.firstname,
      username: req.body.username,
      password: hash,
      token: uid2(32),
    });

    await newUser.save();
    res.json({
      result: true,
      token: newUser.token,
      user: { firstname: newUser.firstname, username: newUser.username },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res
      .status(500)
      .json({ result: false, error: "An unexpected error occurred" });
  }
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
