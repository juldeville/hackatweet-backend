var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Tweet = require("../models/tweets");
const { checkBody } = require("../modules/checkBody");

router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/newTweet", (req, res) => {
  if (!checkBody(req.body, ["tweetContent"])) {
    res.json({ result: false, error: "missing or empty fields" });
    return;
  }
  if (!checkBody(req.body, ["token"])) {
    res.json({ result: false, error: "missing token" });
    return;
  }
  User.findOne({ token: req.body.token }).then((data) => {
    const newTweet = new Tweet({
      user: data._id,
      tweetContent: req.body.tweetContent,
      date: new Date(),
      tag: req.body.tag,
    });

    newTweet.save().then(() => {
      res.json({ result: true });
    });
  });
});

module.exports = router;
