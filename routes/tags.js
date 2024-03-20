var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Tweet = require("../models/tweets");
const Tag = require("../models/tags");
const { checkBody } = require("../modules/checkBody");

router.get("/getTags", async (req, res) => {
  try {
    const tags = await Tag.find();
    const modifiedTags = tags.sort((a, b) => {
      return b.tweets.length - a.tweets.length;
    });
    res.json({ result: modifiedTags });
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
